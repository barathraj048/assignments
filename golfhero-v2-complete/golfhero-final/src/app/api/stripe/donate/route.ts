import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function POST(request: NextRequest) {
  try {
    const { charityId, amount } = await request.json()
    if (!charityId || !amount || amount < 100) {
      return NextResponse.json({ error: 'Invalid donation amount (min £1)' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: charity } = await supabase.from('charities').select('name').eq('id', charityId).maybeSingle()
    if (!charity) return NextResponse.json({ error: 'Charity not found' }, { status: 404 })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Donation to ${charity.name}`,
            description: 'Direct charitable donation via GolfHero',
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      metadata: { charity_id: charityId, donation_type: 'voluntary' },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donate/success?charity=${charityId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donate`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
