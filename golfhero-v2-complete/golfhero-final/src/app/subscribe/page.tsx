'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Heart, Zap, ArrowRight, Shield, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Charity } from '@/types'

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '£19.99',
    period: 'per month',
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

function SubscribeContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  const reason = searchParams.get('reason')
  const cancelled = searchParams.get('cancelled')

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [charityPercentage, setCharityPercentage] = useState(10)
  const [selectedCharityId, setSelectedCharityId] = useState<string>('')
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCharityPicker, setShowCharityPicker] = useState(false)

  useEffect(() => {
    // Load charities
    supabase.from('charities').select('id, name, short_description').eq('is_active', true).then(({ data }) => {
      if (data) {
        setCharities(data as Charity[])
        // Pre-select from localStorage if set during signup
        const saved = localStorage.getItem('selected_charity_id')
        if (saved && data.find(c => c.id === saved)) {
          setSelectedCharityId(saved)
        } else if (data.length > 0) {
          setSelectedCharityId(data[0].id)
        }
      }
    })
  }, [])

  const selectedCharity = charities.find(c => c.id === selectedCharityId)

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/subscribe')
        return
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          charityPercentage,
          charityId: selectedCharityId,
          userId: user.id,
          email: user.email,
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (e: any) {
      setError(e.message || 'Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <span className="text-xs font-bold">GH</span>
          </div>
          <span className="font-semibold">GolfHero</span>
        </Link>
        <Link href="/login" className="text-sm text-slate-400 hover:text-white">Sign in</Link>
      </nav>

      {/* Alerts */}
      {reason === 'subscription_required' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-sm text-center py-3 px-6 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          A subscription is required to access the dashboard. Choose a plan below.
        </div>
      )}
      {cancelled === 'true' && (
        <div className="bg-slate-800 border-b border-slate-700 text-slate-300 text-sm text-center py-3 px-6">
          Payment cancelled — no charge was made. Choose a plan whenever you're ready.
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Choose your plan</h1>
          <p className="text-slate-400 text-lg">Play. Give. Win. Every month.</p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {PLANS.map((plan, i) => (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
              className={`relative text-left p-7 rounded-2xl border-2 transition-all ${
                selectedPlan === plan.id
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">{plan.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                  selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                }`}>
                  {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div className="mb-5">
                <span className="text-3xl font-black">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-2">{plan.period}</span>
              </div>
              <ul className="space-y-2.5">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className={selectedPlan === plan.id ? 'text-slate-200' : 'text-slate-400'}>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}
        </div>

        {/* Charity selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-pink-400" />
              <div>
                <h3 className="font-semibold">Your charity</h3>
                <p className="text-xs text-slate-400">At least 10% of your subscription goes directly to them</p>
              </div>
            </div>
            <button
              onClick={() => setShowCharityPicker(!showCharityPicker)}
              className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-all"
            >
              {showCharityPicker ? 'Done' : 'Change'}
            </button>
          </div>

          {/* Current selection */}
          {selectedCharity && (
            <div className="flex items-center gap-3 p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl mb-4">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <div className="text-sm font-medium">{selectedCharity.name}</div>
                <div className="text-xs text-slate-400">{selectedCharity.short_description}</div>
              </div>
              <Check className="w-4 h-4 text-pink-400 ml-auto flex-shrink-0" />
            </div>
          )}

          {/* Charity picker */}
          {showCharityPicker && (
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {charities.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCharityId(c.id); setShowCharityPicker(false) }}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    selectedCharityId === c.id
                      ? 'border-pink-500/40 bg-pink-500/5'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 flex-shrink-0 ${selectedCharityId === c.id ? 'text-pink-400' : 'text-slate-500'}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-slate-500 truncate">{c.short_description}</div>
                  </div>
                  {selectedCharityId === c.id && <Check className="w-4 h-4 text-pink-400 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Percentage */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Contribution percentage</p>
            <div className="flex gap-2 flex-wrap">
              {CHARITY_PERCENTAGE_OPTIONS.map(pct => (
                <button
                  key={pct}
                  onClick={() => setCharityPercentage(pct)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    charityPercentage === pct
                      ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-3">
              <span className="text-pink-400 font-semibold">
                £{((selectedPlan === 'monthly' ? 19.99 : 199.99 / 12) * charityPercentage / 100).toFixed(2)}/month
              </span>{' '}
              goes to {selectedCharity?.name || 'your charity'}
            </p>
          </div>
        </motion.div>

        {error && (
          <div className="mb-5 flex items-start gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
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
          className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-bold text-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Redirecting to checkout...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Subscribe — {selectedPlan === 'monthly' ? '£19.99/month' : '£199.99/year'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        <div className="flex flex-wrap items-center justify-center gap-5 mt-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure via Stripe</span>
          <span>Cancel anytime</span>
          <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-pink-500" /> {charityPercentage}% to charity</span>
        </div>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  )
}
