'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Trophy, Target, Heart, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function WelcomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const supabase = createClient()

  const [status, setStatus] = useState<'checking' | 'activating' | 'ready' | 'slow' | 'error'>('checking')
  const [attempts, setAttempts] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let tries = 0
    let stopped = false

    async function checkSubscription() {
      if (stopped) return
      tries++
      setAttempts(tries)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle()

      if (sub) { setStatus('ready'); return }

      // After 5 polls (~7.5s), try direct Stripe session lookup as fallback
      // This handles missing/broken STRIPE_WEBHOOK_SECRET
      if (tries === 5 && sessionId) {
        setStatus('activating')
        try {
          const res = await fetch('/api/stripe/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
          const data = await res.json()
          if (data.activated) { setStatus('ready'); return }
          console.error('Manual activation failed:', data.error)
        } catch (e) {
          console.error('Activate fetch error:', e)
        }
      }

      if (tries >= 20) {
        setStatus('error')
        setErrorMsg('Your payment was received but account setup is delayed. Please refresh or contact support.')
        return
      }

      if (tries >= 5) setStatus('slow')
      setTimeout(checkSubscription, 1500)
    }

    checkSubscription()
    return () => { stopped = true }
  }, [])

  const steps = [
    { icon: CheckCircle, label: 'Payment confirmed', done: true, color: 'text-emerald-400' },
    { icon: Trophy, label: 'Account activated', done: status === 'ready', color: 'text-amber-400' },
    { icon: Target, label: 'Ready to enter draws', done: status === 'ready', color: 'text-purple-400' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-8"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold mb-3"
        >
          Payment successful!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-slate-400 mb-10"
        >
          Welcome to GolfHero. Your subscription is being activated.
        </motion.p>

        <div className="space-y-3 mb-10">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.15 }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                step.done
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              {step.done ? (
                <step.icon className={`w-5 h-5 flex-shrink-0 ${step.color}`} />
              ) : (
                <Loader2 className="w-5 h-5 flex-shrink-0 text-slate-600 animate-spin" />
              )}
              <span className={`text-sm font-medium ${step.done ? 'text-white' : 'text-slate-500'}`}>
                {step.label}
                {i === 1 && status === 'activating' && (
                  <span className="text-amber-400 ml-1 text-xs">(activating...)</span>
                )}
              </span>
              {step.done && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {status === 'slow' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-amber-400/80 text-sm mb-6"
          >
            Taking a moment longer than usual — your account is still being set up.
          </motion.p>
        )}

        {status === 'activating' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-blue-400/80 text-sm mb-6"
          >
            Activating your account directly from payment data...
          </motion.p>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-6 text-left"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs text-red-400 underline"
            >
              Refresh page
            </button>
          </motion.div>
        )}

        {status === 'ready' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-emerald-400 text-sm font-medium mb-4">
              Your subscription is active! Time to enter your first scores.
            </p>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Go to my dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/charities"
              className="w-full flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white py-3 rounded-xl text-sm transition-all"
            >
              <Heart className="w-4 h-4 text-pink-400" />
              Browse charities
            </Link>
          </motion.div>
        ) : status !== 'error' ? (
          <p className="text-slate-600 text-xs">
            Activating subscription... ({attempts} checks)
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  )
}