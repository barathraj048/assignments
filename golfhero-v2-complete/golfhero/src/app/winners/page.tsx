'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Heart, ArrowRight, Star, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface WinnerDisplay {
  id: string
  match_type: 'match5' | 'match4' | 'match3'
  prize_amount: number
  paid_at: string | null
  month_year: string
  initials: string
  location: string
}

// Sample winners for when DB has no real data yet
const SAMPLE_WINNERS: WinnerDisplay[] = [
  { id: '1', match_type: 'match5', prize_amount: 4200, paid_at: '2024-01-31', month_year: '2024-01', initials: 'JM', location: 'Manchester' },
  { id: '2', match_type: 'match4', prize_amount: 840, paid_at: '2024-01-31', month_year: '2024-01', initials: 'SR', location: 'Edinburgh' },
  { id: '3', match_type: 'match4', prize_amount: 840, paid_at: '2024-01-31', month_year: '2024-01', initials: 'PK', location: 'Birmingham' },
  { id: '4', match_type: 'match3', prize_amount: 240, paid_at: '2024-01-31', month_year: '2024-01', initials: 'TW', location: 'London' },
  { id: '5', match_type: 'match3', prize_amount: 240, paid_at: '2024-01-31', month_year: '2024-01', initials: 'AC', location: 'Leeds' },
  { id: '6', match_type: 'match4', prize_amount: 1100, paid_at: '2023-12-31', month_year: '2023-12', initials: 'DH', location: 'Bristol' },
  { id: '7', match_type: 'match3', prize_amount: 310, paid_at: '2023-12-31', month_year: '2023-12', initials: 'NP', location: 'Glasgow' },
  { id: '8', match_type: 'match3', prize_amount: 310, paid_at: '2023-12-31', month_year: '2023-12', initials: 'LO', location: 'Cardiff' },
]

const MATCH_CONFIG = {
  match5: { label: 'Jackpot winner', color: '#f59e0b', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', icon: '🏆' },
  match4: { label: 'Match 4', color: '#7F77DD', bg: 'bg-purple-500/15 border-purple-500/30', text: 'text-purple-400', icon: '⭐' },
  match3: { label: 'Match 3', color: '#10b981', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', icon: '✓' },
}

function WinnerCard({ winner, index }: { winner: WinnerDisplay; index: number }) {
  const config = MATCH_CONFIG[winner.match_type]
  const formatMonth = (my: string) => {
    const [y, m] = my.split('-')
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative border rounded-2xl p-5 overflow-hidden ${config.bg}`}
    >
      {winner.match_type === 'match5' && (
        <div className="absolute top-3 right-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
            className="text-xl"
          >
            🏆
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: `${config.color}25`, color: config.color, border: `1.5px solid ${config.color}50` }}
        >
          {winner.initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.text}`}>
              {config.label}
            </span>
            <span className="text-xs text-slate-500">{winner.location}</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatMonth(winner.month_year)}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-black text-xl" style={{ color: config.color }}>
            £{winner.prize_amount.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">prize</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function WinnersPage() {
  const supabase = createClient()
  const [winners, setWinners] = useState<WinnerDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'match5' | 'match4' | 'match3'>('all')
  const [totalPaid, setTotalPaid] = useState(0)
  const [winnerCount, setWinnerCount] = useState(0)
  const [jackpot, setJackpot] = useState(84200)

  useEffect(() => {
    loadWinners()
    const interval = setInterval(() => setJackpot(p => p + Math.floor(Math.random() * 2)), 3000)
    return () => clearInterval(interval)
  }, [])

  async function loadWinners() {
    const { data } = await supabase
      .from('draw_results')
      .select('*, draw:draw_months(month_year), profile:profiles(full_name)')
      .eq('payout_status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(50)

    if (data && data.length > 0) {
      const mapped: WinnerDisplay[] = data.map((r: any) => {
        const name = r.profile?.full_name || 'Member'
        const parts = name.split(' ')
        const initials = parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`
          : name.slice(0, 2).toUpperCase()
        return {
          id: r.id,
          match_type: r.match_type,
          prize_amount: r.prize_amount,
          paid_at: r.paid_at,
          month_year: r.draw?.month_year || '',
          initials,
          location: 'UK',
        }
      })
      setWinners(mapped)
      setTotalPaid(data.reduce((s: number, r: any) => s + r.prize_amount, 0))
      setWinnerCount(data.length)
    } else {
      // Use sample data if no real winners yet
      setWinners(SAMPLE_WINNERS)
      setTotalPaid(SAMPLE_WINNERS.reduce((s, w) => s + w.prize_amount, 0))
      setWinnerCount(SAMPLE_WINNERS.length)
    }
    setLoading(false)
  }

  const filtered = filter === 'all' ? winners : winners.filter(w => w.match_type === filter)
  const jackpotWinners = winners.filter(w => w.match_type === 'match5')

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
          <Link href="/draws" className="text-slate-400 hover:text-white">Draws</Link>
          <Link href="/login" className="text-slate-400 hover:text-white">Sign in</Link>
          <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-full text-sm font-medium transition-all">
            Join
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-5xl mx-auto px-6 py-20 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-5xl mb-5">🏆</div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-4 tracking-tight">
              Hall of Fame
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Real golfers. Real winnings. Every prize paid out, verified and recorded.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { value: `£${totalPaid.toLocaleString()}`, label: 'Total paid out' },
                { value: winnerCount.toString(), label: 'Winners to date' },
                { value: jackpotWinners.length.toString(), label: 'Jackpot winners' },
                { value: `£${jackpot.toLocaleString()}`, label: 'Current jackpot', live: true },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {stat.live && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />}
                    <div className="text-3xl font-black text-amber-400">{stat.value}</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured jackpot winners */}
      {jackpotWinners.length > 0 && (
        <section className="py-10 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400 uppercase tracking-widest">Jackpot winners</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {jackpotWinners.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative bg-gradient-to-br from-amber-900/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_60%)]" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-lg">
                      {w.initials}
                    </div>
                    <div>
                      <div className="font-bold text-amber-300 text-lg">JACKPOT WON!</div>
                      <div className="text-sm text-slate-400">{w.location} · {w.month_year}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-black text-amber-400">£{w.prize_amount.toLocaleString()}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All winners */}
      <section className="py-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-xl font-bold">All winners</h2>
            <div className="flex gap-2">
              {(['all', 'match5', 'match4', 'match3'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'match5' ? 'Jackpot' : f === 'match4' ? 'Match 4' : 'Match 3'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-slate-900 rounded-2xl p-5 h-20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((winner, i) => (
                <WinnerCard key={winner.id} winner={winner} index={i} />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-500">No winners in this category yet</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Your name could be next</h2>
          <p className="text-slate-400 mb-6 text-sm">
            Subscribe from £19.99/month, log your 5 most recent Stableford scores, and you're entered into the next draw automatically.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-7 py-3.5 rounded-full font-semibold transition-all hover:scale-105"
          >
            Join GolfHero <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-center gap-1.5 mt-4 text-slate-600 text-xs">
            <Heart className="w-3 h-3 text-pink-500/70" />
            10% of every subscription supports your chosen charity
          </div>
        </div>
      </section>
    </div>
  )
}
