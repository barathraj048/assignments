'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Charity } from '@/types'

const PRESET_AMOUNTS = [5, 10, 25, 50, 100]

export default function DonatePage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [selectedCharity, setSelectedCharity] = useState<string>('')
  const [amount, setAmount] = useState<number>(10)
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('charities').select('*').eq('is_active', true).order('is_featured', { ascending: false }).then(({ data }) => {
      if (data) {
        setCharities(data)
        if (data.length > 0) setSelectedCharity(data[0].id)
      }
    })
  }, [])

  const finalAmount = useCustom ? parseFloat(customAmount) : amount

  async function handleDonate() {
    if (!selectedCharity) { setError('Please select a charity'); return }
    if (!finalAmount || finalAmount < 1) { setError('Minimum donation is £1'); return }
    if (finalAmount > 10000) { setError('Maximum single donation is £10,000'); return }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charityId: selectedCharity, amount: Math.round(finalAmount * 100) }),
      })
      const { url, error: apiError } = await response.json()
      if (apiError) throw new Error(apiError)
      if (url) window.location.href = url
    } catch (e: any) {
      setError(e.message || 'Failed to process donation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <span className="text-xs font-bold">GH</span>
          </div>
          <span className="font-semibold">GolfHero</span>
        </Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-pink-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Make a donation</h1>
            <p className="text-slate-400">Support a cause directly — no subscription required. 100% goes to your chosen charity.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 space-y-6">

            {/* Charity selection */}
            <div>
              <label className="text-xs text-slate-400 mb-3 block font-medium uppercase tracking-wide">Choose charity</label>
              <div className="space-y-2">
                {charities.map(charity => (
                  <button
                    key={charity.id}
                    onClick={() => setSelectedCharity(charity.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedCharity === charity.id
                        ? 'border-pink-500/50 bg-pink-500/5'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedCharity === charity.id ? 'bg-pink-500/20' : 'bg-slate-800'
                    }`}>
                      <Heart className={`w-4 h-4 ${selectedCharity === charity.id ? 'text-pink-400' : 'text-slate-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{charity.name}</div>
                      <div className="text-xs text-slate-500 truncate">{charity.short_description}</div>
                    </div>
                    {selectedCharity === charity.id && (
                      <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount selection */}
            <div>
              <label className="text-xs text-slate-400 mb-3 block font-medium uppercase tracking-wide">Donation amount</label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {PRESET_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setUseCustom(false) }}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      !useCustom && amount === a
                        ? 'border-pink-500/50 bg-pink-500/10 text-pink-300'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    £{a}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">£</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setUseCustom(true) }}
                  onFocus={() => setUseCustom(true)}
                  placeholder="Custom amount"
                  className={`w-full bg-slate-800/60 border-2 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-colors ${
                    useCustom ? 'border-pink-500/50' : 'border-slate-700'
                  }`}
                />
              </div>
            </div>

            {/* Summary */}
            {finalAmount >= 1 && selectedCharity && (
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 text-sm text-slate-300">
                <span className="text-pink-400 font-semibold">£{finalAmount.toFixed(2)}</span> will go directly to{' '}
                <span className="font-medium">{charities.find(c => c.id === selectedCharity)?.name}</span>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-3">{error}</div>
            )}

            <button
              onClick={handleDonate}
              disabled={loading || !selectedCharity || finalAmount < 1}
              className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading
                ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <><Heart className="w-5 h-5" /> Donate £{(finalAmount || 0).toFixed(2)} <ArrowRight className="w-4 h-4" /></>
              }
            </button>

            <p className="text-center text-xs text-slate-600">
              Secure payment via Stripe. You'll receive a receipt by email.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
