import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const PRICES = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID!,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID!,
}

export async function POST(request: NextRequest) {
  try {
    const { plan, charityPercentage, charityId, userId, email } = await request.json()

    if (!plan || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!PRICES[plan as 'monthly' | 'yearly']) {
      return NextResponse.json({ error: `No price ID configured for plan: ${plan}. Check STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID env vars.` }, { status: 400 })
    }

    // Create or retrieve Stripe customer
    let customerId: string
    const existing = await stripe.customers.list({ email, limit: 1 })

    if (existing.data.length > 0) {
      customerId = existing.data[0].id
      await stripe.customers.update(customerId, {
        metadata: { supabase_user_id: userId },
      })
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
    }

    // All critical data in metadata — used by webhook on BOTH session and subscription events
    const allMetadata = {
      supabase_user_id: userId,
      charity_percentage: String(charityPercentage || 10),
      charity_id: charityId || '',
      plan,
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PRICES[plan as 'monthly' | 'yearly'], quantity: 1 }],
      subscription_data: { metadata: allMetadata },
      metadata: allMetadata,
      // SUCCESS: go to /dashboard/welcome — this page does NOT check subscription in middleware
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?cancelled=true`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
