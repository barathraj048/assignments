import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const PRICES = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID!,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID!,
}

export async function POST(request: NextRequest) {
  try {
    const { plan, charityPercentage, userId, email } = await request.json()

    if (!plan || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create or retrieve Stripe customer
    let customerId: string
    const existing = await stripe.customers.list({ email, limit: 1 })

    if (existing.data.length > 0) {
      customerId = existing.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: PRICES[plan as 'monthly' | 'yearly'],
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          charity_percentage: charityPercentage.toString(),
          plan,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?checkout=cancelled`,
      metadata: {
        supabase_user_id: userId,
        plan,
        charity_percentage: charityPercentage.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
