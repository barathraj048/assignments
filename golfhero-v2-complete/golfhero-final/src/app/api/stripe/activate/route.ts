import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    // Verify the user is logged in
    const cookieStore = cookies()
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Check if subscription already exists (webhook may have already fired)
    const adminClient = createAdminClient()
    const { data: existing } = await adminClient
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ activated: true, source: 'already_exists' })
    }

    // Retrieve session from Stripe directly
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Verify this session belongs to the logged-in user
    const sessionUserId = session.metadata?.supabase_user_id
    if (sessionUserId !== user.id) {
      return NextResponse.json({ error: 'Session user mismatch' }, { status: 403 })
    }

    const stripeSub = session.subscription as Stripe.Subscription
    if (!stripeSub) {
      return NextResponse.json({ error: 'No subscription in session' }, { status: 400 })
    }

    const plan = session.metadata?.plan || 'monthly'
    const charityPercentage = parseFloat(session.metadata?.charity_percentage || '10')
    const charityId = session.metadata?.charity_id || null

    const { error } = await adminClient.from('subscriptions').upsert(
      {
        user_id: user.id,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: stripeSub.id,
        plan,
        status: 'active',
        amount_pence: stripeSub.items.data[0]?.price.unit_amount || 0,
        charity_id: charityId || null,
        charity_percentage: charityPercentage,
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' }
    )

    if (error) {
      console.error('Manual activation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Manual activation success for user:', user.id)
    return NextResponse.json({ activated: true, source: 'manual_fallback' })

  } catch (err: any) {
    console.error('Activate route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}