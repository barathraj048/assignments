import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { PRIZE_POOL_DISTRIBUTION } from '@/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {

      // ============================================
      // SUBSCRIPTION CREATED
      // ============================================
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id
        const charityPercentage = parseFloat(subscription.metadata.charity_percentage || '10')
        const plan = subscription.metadata.plan as 'monthly' | 'yearly'

        if (!userId) break

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          plan,
          status: subscription.status === 'active' ? 'active' : 'trialing',
          amount_pence: subscription.items.data[0]?.price.unit_amount || 0,
          charity_percentage: charityPercentage,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' })

        break
      }

      // ============================================
      // SUBSCRIPTION UPDATED (renewal, plan change)
      // ============================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const statusMap: Record<string, string> = {
          active: 'active',
          past_due: 'lapsed',
          canceled: 'cancelled',
          unpaid: 'lapsed',
          trialing: 'trialing',
        }

        await supabase
          .from('subscriptions')
          .update({
            status: statusMap[subscription.status] || 'inactive',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      // ============================================
      // SUBSCRIPTION DELETED / CANCELLED
      // ============================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      // ============================================
      // INVOICE PAID (successful renewal)
      // Calculate and record charity contribution + prize pool
      // ============================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break

        // Get subscription details
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*, profiles(id)')
          .eq('stripe_subscription_id', invoice.subscription)
          .single()

        if (!sub) break

        const amountPaid = invoice.amount_paid // in pence
        const charityAmount = (amountPaid * sub.charity_percentage) / 100

        // Record charity contribution
        const now = new Date()
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        await supabase.from('charity_contributions').insert({
          user_id: sub.user_id,
          charity_id: sub.charity_id,
          subscription_id: sub.id,
          amount: charityAmount / 100, // store in pounds
          contribution_type: 'subscription',
          month_year: monthYear,
        })

        // Update charity total_raised
        if (sub.charity_id) {
          await supabase.rpc('increment_charity_raised', {
            charity_id: sub.charity_id,
            amount: charityAmount / 100,
          })
        }

        // Add to current month's draw prize pool
        const remaining = amountPaid - charityAmount
        const prizeContribution = remaining * 0.5 // 50% of remainder goes to prizes

        // Upsert current month's draw
        const { data: existingDraw } = await supabase
          .from('draw_months')
          .select('*')
          .eq('month_year', monthYear)
          .single()

        if (existingDraw) {
          const jackpotAdd = prizeContribution * PRIZE_POOL_DISTRIBUTION.match5
          const match4Add = prizeContribution * PRIZE_POOL_DISTRIBUTION.match4
          const match3Add = prizeContribution * PRIZE_POOL_DISTRIBUTION.match3

          await supabase
            .from('draw_months')
            .update({
              total_pool: (existingDraw.total_pool || 0) + prizeContribution / 100,
              jackpot_pool: (existingDraw.jackpot_pool || 0) + jackpotAdd / 100,
              match4_pool: (existingDraw.match4_pool || 0) + match4Add / 100,
              match3_pool: (existingDraw.match3_pool || 0) + match3Add / 100,
            })
            .eq('id', existingDraw.id)
        }

        // Update subscription status to active
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', invoice.subscription)

        break
      }

      // ============================================
      // INVOICE PAYMENT FAILED
      // ============================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break

        await supabase
          .from('subscriptions')
          .update({ status: 'lapsed' })
          .eq('stripe_subscription_id', invoice.subscription)

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
