'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Heart, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Charity } from '@/types'

const STEPS = ['Account', 'Charity', 'Done']

function SignupContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCharityId = searchParams.get('charity') // from /charities page links

  const [step, setStep] = useState(0)
  const [charities, setCharities] = useState<Charity[]>([])
  const [charitiesLoading, setCharitiesLoading] = useState(true)
  const [charitiesError, setCharitiesError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [selectedCharityId, setSelectedCharityId] = useState<string>(preselectedCharityId || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load charities immediately on mount — not deferred
  useEffect(() => {
    async function loadCharities() {
      setCharitiesLoading(true)
      const { data, error } = await supabase
        .from('charities')
        .select('id, name, short_description, is_featured, total_raised')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name', { ascending: true })

      if (error) {
        setCharitiesError('Could not load charities. Please try again.')
      } else if (data) {
        setCharities(data as Charity[])
        // Apply preselected from URL param, or localStorage, or first charity
        if (preselectedCharityId && data.find(c => c.id === preselectedCharityId)) {
          setSelectedCharityId(preselectedCharityId)
        } else {
          const saved = localStorage.getItem('selected_charity_id')
          if (saved && data.find(c => c.id === saved)) {
            setSelectedCharityId(saved)
          } else if (data.length > 0) {
            setSelectedCharityId(data[0].id)
          }
        }
      }
      setCharitiesLoading(false)
    }
    loadCharities()
  }, [])

  async function handleCreateAccount() {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Save charity to profile immediately if user is already confirmed (some setups skip email confirm)
    if (data.user && selectedCharityId) {
      await supabase
        .from('profiles')
        .update({ })
        .eq('id', data.user.id)
      // Store in localStorage as backup
      localStorage.setItem('selected_charity_id', selectedCharityId)
    }

    setLoading(false)
    setStep(1)
  }

  async function handleSelectCharity() {
    if (!selectedCharityId) {
      setError('Please select a charity to continue')
      return
    }
    setError('')

    // Persist to localStorage so subscribe page picks it up
    localStorage.setItem('selected_charity_id', selectedCharityId)

    // Also try to update profile charity_id if user session is available
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Update the subscription record if it exists already
      await supabase
        .from('subscriptions')
        .update({ charity_id: selectedCharityId })
        .eq('user_id', user.id)
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
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400' :
                'bg-slate-800 text-slate-600'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs mx-2 hidden sm:block ${i === step ? 'text-emerald-400' : 'text-slate-600'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px ${i < step ? 'bg-emerald-500' : 'bg-slate-800'} mx-1 sm:hidden`} />
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
                    onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
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
                    onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
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
                <div className="mt-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreateAccount}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white py-4 rounded-xl font-semibold transition-all"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                  : <>Continue <ArrowRight className="w-4 h-4" /></>
                }
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
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold mb-2">Choose your charity</h2>
              <p className="text-slate-400 text-sm mb-6">
                At least 10% of your subscription goes directly to your chosen cause.
              </p>

              {/* Loading state */}
              {charitiesLoading && (
                <div className="flex items-center justify-center py-10 text-slate-500 gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading charities...</span>
                </div>
              )}

              {/* Error state */}
              {charitiesError && !charitiesLoading && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-3 mb-4">
                  {charitiesError}
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-2 underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Charity list */}
              {!charitiesLoading && charities.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {charities.map(charity => (
                    <button
                      key={charity.id}
                      onClick={() => { setSelectedCharityId(charity.id); setError('') }}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        selectedCharityId === charity.id
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedCharityId === charity.id ? 'bg-pink-500/20' : 'bg-slate-700/60'
                      }`}>
                        <Heart className={`w-5 h-5 ${selectedCharityId === charity.id ? 'text-pink-400' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{charity.name}</div>
                        <div className="text-xs text-slate-500 truncate">{charity.short_description}</div>
                      </div>
                      {selectedCharityId === charity.id && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!charitiesLoading && charities.length === 0 && !charitiesError && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No charities available yet. You can choose one later from your dashboard.
                </div>
              )}

              {error && (
                <div className="mt-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleSelectCharity}
                disabled={charitiesLoading}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white py-4 rounded-xl font-semibold transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>

              {charities.length === 0 && !charitiesLoading && (
                <button
                  onClick={() => setStep(2)}
                  className="mt-3 w-full text-sm text-slate-500 hover:text-slate-300 py-2 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </motion.div>
          )}

          {/* STEP 2: Done */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-3">Account created!</h2>
              <p className="text-slate-400 text-sm mb-2">
                Check your email to verify your account.
              </p>
              <p className="text-slate-500 text-xs mb-8">
                Then subscribe to start entering monthly prize draws.
              </p>

              {selectedCharityId && (
                <div className="flex items-center justify-center gap-2 text-sm text-pink-400 mb-6">
                  <Heart className="w-4 h-4" />
                  <span>Supporting: {charities.find(c => c.id === selectedCharityId)?.name || 'your chosen charity'}</span>
                </div>
              )}

              <Link
                href="/subscribe"
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-xl font-semibold transition-all"
              >
                Choose a subscription plan <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="mt-3 block text-sm text-slate-500 hover:text-slate-300 transition-colors"
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
