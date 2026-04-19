import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { PRIZE_POOL_DISTRIBUTION } from '@/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

async function upsertSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  data: {
    userId: string
    stripeCustomerId: string
    stripeSubscriptionId: string
    plan: string
    status: string
    amountPence: number
    charityId?: string | null
    charityPercentage: number
    periodStart: Date
    periodEnd: Date
  }
) {
  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: data.userId,
      stripe_customer_id: data.stripeCustomerId,
      stripe_subscription_id: data.stripeSubscriptionId,
      plan: data.plan,
      status: data.status,
      amount_pence: data.amountPence,
      charity_id: data.charityId || null,
      charity_percentage: data.charityPercentage,
      current_period_start: data.periodStart.toISOString(),
      current_period_end: data.periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  )
  if (error) console.error('upsertSubscription error:', error)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {

      // ============================================
      // checkout.session.completed — fires immediately
      // when user pays. This is THE critical event.
      // subscription.created comes AFTER this.
      // ============================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan || 'monthly'
        const charityPercentage = parseFloat(session.metadata?.charity_percentage || '10')
        const charityId = session.metadata?.charity_id || null

        if (!userId || !session.subscription) break

        const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string)

        await upsertSubscription(supabase, {
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSub.id,
          plan,
          status: 'active',
          amountPence: stripeSub.items.data[0]?.price.unit_amount || 0,
          charityId,
          charityPercentage,
          periodStart: new Date(stripeSub.current_period_start * 1000),
          periodEnd: new Date(stripeSub.current_period_end * 1000),
        })

        console.log('checkout.session.completed: subscription upserted for', userId)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        if (!userId) break

        await upsertSubscription(supabase, {
          userId,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          plan: subscription.metadata?.plan || 'monthly',
          status: subscription.status === 'active' ? 'active' : 'trialing',
          amountPence: subscription.items.data[0]?.price.unit_amount || 0,
          charityId: subscription.metadata?.charity_id || null,
          charityPercentage: parseFloat(subscription.metadata?.charity_percentage || '10'),
          periodStart: new Date(subscription.current_period_start * 1000),
          periodEnd: new Date(subscription.current_period_end * 1000),
        })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const statusMap: Record<string, string> = {
          active: 'active', past_due: 'lapsed', canceled: 'cancelled',
          unpaid: 'lapsed', trialing: 'trialing', incomplete: 'inactive',
        }
        await supabase
          .from('subscriptions')
          .update({
            status: statusMap[subscription.status] || 'inactive',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, user_id, charity_id, charity_percentage')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .maybeSingle()

        if (!sub) break

        const amountPaid = invoice.amount_paid
        const charityAmount = Math.round((amountPaid * sub.charity_percentage) / 100)
        const now = new Date()
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        if (sub.charity_id) {
          await supabase.from('charity_contributions').upsert(
            {
              user_id: sub.user_id,
              charity_id: sub.charity_id,
              subscription_id: sub.id,
              amount: charityAmount / 100,
              contribution_type: 'subscription',
              month_year: monthYear,
            },
            { onConflict: 'user_id,charity_id,month_year,contribution_type' }
          )
          await supabase.rpc('increment_charity_raised', {
            charity_id: sub.charity_id,
            amount: charityAmount / 100,
          })
        }

        const prizeContribution = (amountPaid - charityAmount) * 0.5
        const { data: existingDraw } = await supabase
          .from('draw_months')
          .select('*')
          .eq('month_year', monthYear)
          .maybeSingle()

        if (existingDraw) {
          await supabase.from('draw_months').update({
            total_pool: Number(existingDraw.total_pool || 0) + prizeContribution / 100,
            jackpot_pool: Number(existingDraw.jackpot_pool || 0) + (prizeContribution * PRIZE_POOL_DISTRIBUTION.match5) / 100,
            match4_pool: Number(existingDraw.match4_pool || 0) + (prizeContribution * PRIZE_POOL_DISTRIBUTION.match4) / 100,
            match3_pool: Number(existingDraw.match3_pool || 0) + (prizeContribution * PRIZE_POOL_DISTRIBUTION.match3) / 100,
          }).eq('id', existingDraw.id)
        }

        await supabase.from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', invoice.subscription as string)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break
        await supabase.from('subscriptions')
          .update({ status: 'lapsed', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', invoice.subscription as string)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ received: true, warning: error.message })
  }
}
