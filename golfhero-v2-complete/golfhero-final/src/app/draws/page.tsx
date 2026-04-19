'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Target, Zap, ChevronRight, Calendar, Users, ArrowRight, Heart } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { DrawMonth } from '@/types'

// ============================================
// Animated number reveal for draw balls
// ============================================
function DrawBall({ number, delay, revealed }: { number: number; delay: number; revealed: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={revealed ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 15 }}
      className="relative"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <span className="text-white font-black text-lg sm:text-xl">{number}</span>
      </div>
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ delay: delay + 0.3, duration: 0.4 }}
        className="absolute inset-0 rounded-full border-2 border-emerald-400/40"
      />
    </motion.div>
  )
}

// ============================================
// Past draw result card
// ============================================
function DrawResultCard({ draw }: { draw: DrawMonth }) {
  const [revealed, setRevealed] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRevealed(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }

  return (
    <div ref={ref} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-sm text-slate-400 mb-1">
            {formatMonth(draw.month_year)}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              draw.jackpot_claimed ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
            }`}>
              {draw.jackpot_claimed ? 'Jackpot won!' : 'Jackpot rolled over'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 capitalize">
              {draw.draw_mode} draw
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">Prize pool</div>
          <div className="text-xl font-bold text-emerald-400">£{draw.total_pool.toLocaleString()}</div>
        </div>
      </div>

      {draw.drawn_numbers && draw.drawn_numbers.length > 0 ? (
        <div>
          <div className="text-xs text-slate-500 mb-3">Drawn numbers</div>
          <div className="flex gap-3 flex-wrap">
            {draw.drawn_numbers.map((num, i) => (
              <DrawBall key={i} number={num} delay={i * 0.15} revealed={revealed} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-14 h-14 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
              <span className="text-slate-700 text-lg font-black">?</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// Prize tier card
// ============================================
function PrizeTier({ match, share, example, rollover, color }: {
  match: number, share: string, example: string, rollover?: boolean, color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm text-slate-400 mb-1">Match {match} numbers</div>
          <div className="text-3xl font-black" style={{ color }}>{share}</div>
          <div className="text-sm text-slate-500 mt-0.5">of prize pool</div>
        </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full"
              style={{ background: i < match ? color : '#1e293b', border: `1px solid ${i < match ? color : '#334155'}` }}
            />
          ))}
        </div>
      </div>
      <div className="text-xs text-slate-400 bg-slate-800/60 rounded-lg px-3 py-2">
        e.g. with 500 subscribers → <span style={{ color }} className="font-semibold">{example}</span>
      </div>
      {rollover && (
        <div className="mt-3 text-xs text-amber-400/80 flex items-center gap-1.5">
          <Trophy className="w-3 h-3" />
          Rolls over to next month if unclaimed
        </div>
      )}
    </motion.div>
  )
}

// ============================================
// MAIN PAGE
// ============================================
export default function DrawsPage() {
  const supabase = createClient()
  const [draws, setDraws] = useState<DrawMonth[]>([])
  const [upcomingDraw, setUpcomingDraw] = useState<DrawMonth | null>(null)
  const [jackpot, setJackpot] = useState(84200)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('draw_months').select('*').eq('status', 'published').order('month_year', { ascending: false }).limit(6),
      supabase.from('draw_months').select('*').in('status', ['upcoming', 'open']).order('month_year', { ascending: false }).limit(1).maybeSingle(),
    ]).then(([publishedRes, upcomingRes]) => {
      if (publishedRes.data) setDraws(publishedRes.data)
      if (upcomingRes.data) {
        setUpcomingDraw(upcomingRes.data)
        setJackpot(upcomingRes.data.jackpot_pool + upcomingRes.data.jackpot_rolled_over)
      }
      setLoading(false)
    })

    // Live jackpot ticker
    const interval = setInterval(() => {
      setJackpot(prev => prev + Math.floor(Math.random() * 2))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
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
        <div className="flex items-center gap-4 text-sm">
          <Link href="/charities" className="text-slate-400 hover:text-white">Charities</Link>
          <Link href="/winners" className="text-slate-400 hover:text-white">Winners</Link>
          <Link href="/login" className="text-slate-400 hover:text-white">Sign in</Link>
          <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-full text-sm font-medium transition-all">
            Join
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-5xl mx-auto px-6 py-20 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium mb-5">
              <Trophy className="w-4 h-4" />
              Monthly prize draws
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-5 tracking-tight">
              Your golf scores are<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                your lottery numbers
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
              Every month, 5 numbers are drawn from 1–45. Match your latest golf scores to win. The more you play, the better your chances.
            </p>

            {/* Live jackpot */}
            <div className="inline-flex flex-col items-center gap-2 px-8 py-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 mb-10">
              <div className="text-xs text-amber-400/70 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                Current jackpot
              </div>
              <div className="text-5xl font-black text-amber-400">
                £{jackpot.toLocaleString()}
              </div>
              {upcomingDraw && (
                <div className="text-sm text-slate-400">
                  Draw: {formatMonth(upcomingDraw.month_year)}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Link
                href="/signup"
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105"
              >
                Enter this month's draw <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* How the draw works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">How the draw works</h2>
            <p className="text-slate-400">Simple, transparent, and run every month</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-4 mb-16">
            {[
              { step: '01', title: 'You subscribe', desc: 'From £19.99/month. A portion builds the prize pool.', icon: '💳' },
              { step: '02', title: 'Log 5 scores', desc: 'Enter your latest Stableford scores (1–45). These become your numbers.', icon: '⛳' },
              { step: '03', title: 'Draw day', desc: '5 numbers are drawn on the last day of each month.', icon: '🎱' },
              { step: '04', title: 'Match & win', desc: 'Match 3, 4 or all 5 numbers to win your share of the pool.', icon: '🏆' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-slate-700 font-black text-5xl mb-3 font-mono">{item.step}</div>
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-semibold mb-2">{item.title}</div>
                <div className="text-slate-400 text-sm leading-relaxed">{item.desc}</div>
                {i < 3 && (
                  <ChevronRight className="hidden md:block absolute -right-2 top-10 w-4 h-4 text-slate-700" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Prize tiers */}
          <h3 className="text-xl font-bold text-center mb-8">Prize pool breakdown</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <PrizeTier match={5} share="40%" example="~£4,000 jackpot" rollover color="#f59e0b" />
            <PrizeTier match={4} share="35%" example="~£350 per winner" color="#7F77DD" />
            <PrizeTier match={3} share="25%" example="~£62 per winner" color="#10b981" />
          </div>
          <p className="text-center text-slate-500 text-sm">
            Pool grows with every subscriber. Multiple winners in a tier split the prize equally.
            No match-5 winner = jackpot carries to next month.
          </p>
        </div>
      </section>

      {/* Draw modes */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-10">Two draw modes</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900 border border-blue-500/20 rounded-2xl p-6"
            >
              <div className="text-2xl mb-3">🎲</div>
              <h4 className="font-semibold text-blue-300 mb-2">Random draw</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Standard lottery-style. 5 unique numbers are drawn at random from 1–45. Every score has an equal chance of matching. Clean, fair, simple.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900 border border-purple-500/20 rounded-2xl p-6"
            >
              <div className="text-2xl mb-3">🧮</div>
              <h4 className="font-semibold text-purple-300 mb-2">Algorithmic draw</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Weighted by score frequency across all members. Numbers that fewer players have logged get slightly higher draw probability — rewarding golfers with a diverse score range.
              </p>
            </motion.div>
          </div>
          <p className="text-center text-slate-600 text-xs mt-5">Draw mode is selected by our admin team each month and announced before the draw runs.</p>
        </div>
      </section>

      {/* Past draw results */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Past draws</h2>
            <p className="text-slate-400 text-sm">Every draw is published transparently with the full drawn numbers</p>
          </motion.div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-900 rounded-2xl p-6 h-40 animate-pulse" />
              ))}
            </div>
          ) : draws.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
              <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No draws published yet — first draw coming soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {draws.map(draw => (
                <DrawResultCard key={draw.id} draw={draw} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/winners" className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 font-medium">
              See all winners <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to play?</h2>
          <p className="text-slate-400 mb-8">
            Subscribe, log your scores, and you're automatically entered into this month's draw. Plus 10% always goes to your chosen charity.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105"
          >
            Join GolfHero <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-center gap-2 mt-4 text-slate-600 text-xs">
            <Heart className="w-3 h-3 text-pink-500" />
            At least 10% of every subscription goes to charity
          </div>
        </div>
      </section>
    </div>
  )
}
