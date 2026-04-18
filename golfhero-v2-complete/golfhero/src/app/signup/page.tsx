'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Heart, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Charity } from '@/types'

const STEPS = ['Account', 'Charity', 'Subscribe']

export default function SignupPage() {
  const supabase = createClient()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [charities, setCharities] = useState<Charity[]>([])

  // Step 1 fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Step 2 fields
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('charities').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setCharities(data)
    })
  }, [])

  async function handleCreateAccount() {
    if (!fullName || !email || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setStep(1)
  }

  async function handleSelectCharity() {
    // if (!selectedCharity) {
    //   setError('Please select a charity to continue')
    //   return
    // }
    // setError('')

    // Update user's charity in their subscription record (will be created on subscribe)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ }).eq('id', user.id)
      // Store charity selection in localStorage for use on subscribe page
      localStorage.setItem('selected_charity_id', selectedCharity || "")
    }

    setStep(2)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <span className="text-sm font-bold">GH</span>
            </div>
            <span className="text-xl font-bold">GolfHero</span>
          </Link>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400' :
                'bg-slate-800 text-slate-600'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-emerald-400' : 'text-slate-600'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-1 ${i < step ? 'bg-emerald-500' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 0: Create account */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8"
            >
              <h1 className="text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-slate-400 text-sm mb-8">Start playing golf with purpose</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
                      placeholder="Min. 8 characters"
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-3">{error}</div>
              )}

              <button
                onClick={handleCreateAccount}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white py-4 rounded-xl font-semibold transition-all"
              >
                {loading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>

              <p className="mt-4 text-xs text-slate-500 text-center">
                By signing up you agree to our{' '}
                <Link href="/terms" className="text-slate-400 hover:text-slate-200">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-slate-400 hover:text-slate-200">Privacy Policy</Link>
              </p>
            </motion.div>
          )}

          {/* STEP 1: Choose charity */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-2">Choose your charity</h2>
                <p className="text-slate-400 text-sm mb-6">
                  At least 10% of your subscription will go directly to your chosen cause.
                </p>

                <div className="space-y-3">
                  {charities.map(charity => (
                    <button
                      key={charity.id}
                      onClick={() => setSelectedCharity(charity.id)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        selectedCharity === charity.id
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedCharity === charity.id ? 'bg-pink-500/20' : 'bg-slate-700/60'
                      }`}>
                        <Heart className={`w-5 h-5 ${selectedCharity === charity.id ? 'text-pink-400' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{charity.name}</div>
                        <div className="text-xs text-slate-500 truncate">{charity.short_description}</div>
                      </div>
                      {selectedCharity === charity.id && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-3">{error}</div>
                )}

                <button
                  onClick={handleSelectCharity}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-xl font-semibold transition-all"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Subscribe */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Account created!</h2>
              <p className="text-slate-400 text-sm mb-8">
                Check your email to verify your account, then subscribe to start entering draws.
              </p>
              <Link
                href="/subscribe"
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-xl font-semibold transition-all"
              >
                Choose a subscription plan <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="mt-3 block text-sm text-slate-500 hover:text-slate-300"
              >
                Go to dashboard first
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 0 && (
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
