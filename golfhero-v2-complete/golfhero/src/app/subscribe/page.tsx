'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Heart, Trophy, Zap, ArrowRight, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '£19.99',
    period: 'per month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
    description: 'Perfect for casual golfers',
    highlight: false,
    features: [
      'Enter monthly prize draws',
      'Track 5 rolling golf scores',
      'Choose your charity (min. 10%)',
      'Access draw results instantly',
      'Cancel anytime',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '£199.99',
    period: 'per year',
    priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID,
    description: 'Save over £39 vs monthly',
    highlight: true,
    badge: 'Best value',
    features: [
      'Everything in monthly',
      '2 months free (save £39.89)',
      'Priority winner verification',
      'Exclusive yearly member badge',
      'Lock in current pricing',
    ],
  },
]

const CHARITY_PERCENTAGE_OPTIONS = [10, 15, 20, 25, 30]

interface SubscribePageProps {
  searchParams?: { reason?: string }
}

export default function SubscribePage({ searchParams }: SubscribePageProps) {
  const supabase = createClient()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [charityPercentage, setCharityPercentage] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login?redirect=/subscribe'
        return
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          charityPercentage,
          userId: user.id,
          email: user.email,
        }),
      })

      const { url, error: apiError } = await response.json()
      if (apiError) throw new Error(apiError)
      if (url) window.location.href = url
    } catch (e: any) {
      setError(e.message || 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {searchParams?.reason === 'subscription_required' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-sm text-center py-3 px-6">
          A subscription is required to access the dashboard. Choose a plan below.
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Choose your plan</h1>
          <p className="text-slate-400 text-lg">Play. Give. Win. Every month.</p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {PLANS.map((plan, i) => (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
              className={`relative text-left p-8 rounded-3xl border-2 transition-all ${
                selectedPlan === plan.id
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">{plan.description}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                  selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                }`}>
                  {selectedPlan === plan.id && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-2">{plan.period}</span>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className={selectedPlan === plan.id ? 'text-slate-200' : 'text-slate-400'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}
        </div>

        {/* Charity percentage selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-pink-400" />
            <div>
              <h3 className="font-semibold">Charity contribution</h3>
              <p className="text-sm text-slate-400">Choose how much of your subscription goes to charity</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {CHARITY_PERCENTAGE_OPTIONS.map(pct => (
              <button
                key={pct}
                onClick={() => setCharityPercentage(pct)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  charityPercentage === pct
                    ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          <div className="mt-4 text-sm text-slate-400">
            That's{' '}
            <span className="text-pink-400 font-semibold">
              £{((selectedPlan === 'monthly' ? 19.99 : 16.67) * charityPercentage / 100).toFixed(2)}/month
            </span>{' '}
            going to your chosen charity.
            {charityPercentage > 10 && (
              <span className="text-emerald-400 ml-1">
                +£{(((selectedPlan === 'monthly' ? 19.99 : 16.67) * (charityPercentage - 10) / 100)).toFixed(2)} extra above the minimum
              </span>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white py-5 rounded-2xl font-bold text-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(16,185,129,0.25)]"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Subscribe {selectedPlan === 'yearly' ? '(Save £39)' : ''} — {selectedPlan === 'monthly' ? '£19.99/mo' : '£199.99/yr'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Secure payment via Stripe
          </div>
          <div>Cancel anytime</div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pink-500" />
            {charityPercentage}% to charity
          </div>
        </div>
      </div>
    </div>
  )
}
