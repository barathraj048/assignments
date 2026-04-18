'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Trophy, Heart, BarChart3, Settings, Play,
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw,
  DollarSign, TrendingUp, Calendar, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { simulateDraw, generateRandomDraw, generateAlgorithmicDraw } from '@/lib/draw-engine'
import type { DrawMonth, DrawResult, DrawEntry, AdminDashboardStats } from '@/types'

// ============================================
// Draw Management Panel
// ============================================
function DrawManagementPanel() {
  const supabase = createClient()
  const [draws, setDraws] = useState<DrawMonth[]>([])
  const [entries, setEntries] = useState<DrawEntry[]>([])
  const [selectedDraw, setSelectedDraw] = useState<DrawMonth | null>(null)
  const [simulationResult, setSimulationResult] = useState<any>(null)
  const [drawMode, setDrawMode] = useState<'random' | 'algorithmic'>('random')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadDraws()
  }, [])

  async function loadDraws() {
    const { data } = await supabase
      .from('draw_months')
      .select('*')
      .order('month_year', { ascending: false })
      .limit(6)
    if (data) setDraws(data)
  }

  async function loadEntriesForDraw(drawId: string) {
    const { data } = await supabase
      .from('draw_entries')
      .select('*')
      .eq('draw_id', drawId)
    if (data) setEntries(data)
  }

  async function runSimulation(draw: DrawMonth) {
    setLoading(true)
    setSimulationResult(null)
    await loadEntriesForDraw(draw.id)
    const result = simulateDraw(
      entries,
      drawMode,
      draw.jackpot_pool,
      draw.match4_pool,
      draw.match3_pool,
      draw.jackpot_rolled_over
    )
    setSimulationResult(result)
    setLoading(false)
  }

  async function publishDraw(draw: DrawMonth) {
    if (!simulationResult) {
      setMessage('Run simulation first')
      return
    }
    setLoading(true)

    // Update draw with results
    await supabase
      .from('draw_months')
      .update({
        status: 'published',
        drawn_numbers: simulationResult.drawn_numbers,
        draw_mode: drawMode,
        jackpot_claimed: simulationResult.winners.match5.length > 0,
        published_at: new Date().toISOString(),
      })
      .eq('id', draw.id)

    // Create result records for each winner
    for (const winner of simulationResult.winners.match5) {
      await supabase.from('draw_results').insert({
        draw_id: draw.id,
        user_id: winner.user_id,
        match_type: 'match5',
        prize_amount: simulationResult.prize_breakdown.per_winner_match5,
        total_tier_prize: simulationResult.prize_breakdown.jackpot_pool,
        winner_count: simulationResult.winners.match5.length,
      })
    }
    for (const winner of simulationResult.winners.match4) {
      await supabase.from('draw_results').insert({
        draw_id: draw.id,
        user_id: winner.user_id,
        match_type: 'match4',
        prize_amount: simulationResult.prize_breakdown.per_winner_match4,
        total_tier_prize: simulationResult.prize_breakdown.match4_pool,
        winner_count: simulationResult.winners.match4.length,
      })
    }
    for (const winner of simulationResult.winners.match3) {
      await supabase.from('draw_results').insert({
        draw_id: draw.id,
        user_id: winner.user_id,
        match_type: 'match3',
        prize_amount: simulationResult.prize_breakdown.per_winner_match3,
        total_tier_prize: simulationResult.prize_breakdown.match3_pool,
        winner_count: simulationResult.winners.match3.length,
      })
    }

    // Handle jackpot rollover if no match5 winners
    if (simulationResult.winners.match5.length === 0) {
      // Create next month's draw with rolled over jackpot
      const [year, month] = draw.month_year.split('-')
      const nextDate = new Date(parseInt(year), parseInt(month), 1)
      const nextMonthYear = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

      await supabase.from('draw_months').upsert({
        month_year: nextMonthYear,
        status: 'upcoming',
        jackpot_rolled_over: simulationResult.prize_breakdown.jackpot_pool,
      })
    }

    setMessage('Draw published successfully!')
    setSimulationResult(null)
    setSelectedDraw(null)
    await loadDraws()
    setLoading(false)
  }

  async function createNewDraw() {
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    await supabase.from('draw_months').insert({
      month_year: monthYear,
      status: 'open',
      total_pool: 5000, // Will be calculated from subscriptions
      jackpot_pool: 2000,
      match4_pool: 1750,
      match3_pool: 1250,
    })
    await loadDraws()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Draw management</h2>
        <button
          onClick={createNewDraw}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
        >
          <Calendar className="w-4 h-4" />
          New draw
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl">
          {message}
        </div>
      )}

      {/* Draw mode selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setDrawMode('random')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            drawMode === 'random'
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
              : 'border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          🎲 Random draw
        </button>
        <button
          onClick={() => setDrawMode('algorithmic')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            drawMode === 'algorithmic'
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          🧮 Algorithmic draw
        </button>
      </div>

      {/* Draws list */}
      <div className="space-y-3">
        {draws.map(draw => (
          <div key={draw.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{draw.month_year}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  draw.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                  draw.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                  draw.status === 'upcoming' ? 'bg-slate-700 text-slate-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {draw.status}
                </span>
                {draw.jackpot_rolled_over > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    +£{draw.jackpot_rolled_over} rollover
                  </span>
                )}
              </div>
              {(draw.status === 'open' || draw.status === 'upcoming') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedDraw(draw); runSimulation(draw) }}
                    disabled={loading}
                    className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  >
                    <Play className="w-3 h-3" />
                    Simulate
                  </button>
                  <button
                    onClick={() => publishDraw(draw)}
                    disabled={loading || !simulationResult || selectedDraw?.id !== draw.id}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Publish
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/60 rounded-lg p-2.5">
                <div className="text-amber-400 font-bold">£{draw.jackpot_pool.toFixed(0)}</div>
                <div className="text-slate-500">Jackpot</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2.5">
                <div className="text-purple-400 font-bold">£{draw.match4_pool.toFixed(0)}</div>
                <div className="text-slate-500">Match 4</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2.5">
                <div className="text-emerald-400 font-bold">£{draw.match3_pool.toFixed(0)}</div>
                <div className="text-slate-500">Match 3</div>
              </div>
            </div>

            {/* Simulation results */}
            {simulationResult && selectedDraw?.id === draw.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 bg-slate-900/80 rounded-xl p-4 border border-slate-600"
              >
                <h4 className="text-sm font-medium text-slate-300 mb-3">Simulation results</h4>
                <div className="flex gap-2 flex-wrap mb-3">
                  <span className="text-slate-400 text-xs">Drawn numbers:</span>
                  {simulationResult.drawn_numbers.map((n: number) => (
                    <span key={n} className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center">
                      {n}
                    </span>
                  ))}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Match 5 winners</span>
                    <span className={simulationResult.winners.match5.length > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                      {simulationResult.winners.match5.length} {simulationResult.winners.match5.length === 0 ? '(jackpot rolls over)' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Match 4 winners</span>
                    <span className="text-purple-400">{simulationResult.winners.match4.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Match 3 winners</span>
                    <span className="text-emerald-400">{simulationResult.winners.match3.length}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {draw.drawn_numbers && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Results:</span>
                {draw.drawn_numbers.map(n => (
                  <span key={n} className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Winners Verification Panel
// ============================================
function WinnersPanel() {
  const supabase = createClient()
  const [winners, setWinners] = useState<DrawResult[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'proof_submitted' | 'approved'>('all')

  useEffect(() => {
    loadWinners()
  }, [])

  async function loadWinners() {
    const { data } = await supabase
      .from('draw_results')
      .select('*, profile:profiles(full_name, email), draw:draw_months(month_year)')
      .order('created_at', { ascending: false })
    if (data) setWinners(data as any)
  }

  async function updateVerification(id: string, status: 'approved' | 'rejected', notes?: string) {
    await supabase
      .from('draw_results')
      .update({
        verification_status: status,
        admin_reviewed_at: new Date().toISOString(),
        admin_notes: notes || null,
        payout_status: status === 'approved' ? 'processing' : 'pending',
      })
      .eq('id', id)
    await loadWinners()
  }

  async function markPaid(id: string) {
    await supabase
      .from('draw_results')
      .update({ payout_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
    await loadWinners()
  }

  const filtered = filter === 'all' ? winners : winners.filter(w => w.verification_status === filter)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Winners verification</h2>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'proof_submitted', 'approved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f.replace('_', ' ')}
            <span className="ml-1.5 text-slate-500">
              ({filter === f ? filtered.length : winners.filter(w => f === 'all' || w.verification_status === f).length})
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No winners to display</p>
        ) : (
          filtered.map(winner => (
            <div key={winner.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {(winner.profile as any)?.full_name || (winner.profile as any)?.email || 'Unknown'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      winner.match_type === 'match5' ? 'bg-amber-500/20 text-amber-400' :
                      winner.match_type === 'match4' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {winner.match_type === 'match5' ? 'Jackpot' : winner.match_type === 'match4' ? 'Match 4' : 'Match 3'}
                    </span>
                    <span className="text-xs text-slate-500">{(winner.draw as any)?.month_year}</span>
                  </div>
                  <div className="text-xl font-bold text-amber-400 mt-1">£{winner.prize_amount.toFixed(2)}</div>
                  {winner.winner_count > 1 && (
                    <div className="text-xs text-slate-500">Split between {winner.winner_count} winners</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    winner.verification_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    winner.verification_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    winner.verification_status === 'proof_submitted' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {winner.verification_status.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    winner.payout_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                    winner.payout_status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {winner.payout_status}
                  </span>
                </div>
              </div>

              {winner.proof_url && (
                <div className="mt-3 bg-slate-900/60 rounded-lg p-2.5 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-blue-400">Proof submitted</span>
                  <a href={winner.proof_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-slate-300 ml-auto">
                    View proof →
                  </a>
                </div>
              )}

              {winner.verification_status === 'proof_submitted' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => updateVerification(winner.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-600/30 text-emerald-400 py-2 rounded-lg text-xs font-medium transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => updateVerification(winner.id, 'rejected', 'Proof not valid')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 py-2 rounded-lg text-xs font-medium transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}

              {winner.verification_status === 'approved' && winner.payout_status === 'processing' && (
                <button
                  onClick={() => markPaid(winner.id)}
                  className="mt-3 w-full bg-blue-600/30 hover:bg-blue-600/50 border border-blue-600/30 text-blue-400 py-2 rounded-lg text-xs font-medium transition-all"
                >
                  Mark as paid
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================
// MAIN ADMIN DASHBOARD
// ============================================
export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'draws' | 'charities' | 'winners' | 'reports'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    // Load admin stats
    const [usersRes, activeSubs, pendingVerif, pendingPayout] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('draw_results').select('id', { count: 'exact' }).eq('verification_status', 'proof_submitted'),
      supabase.from('draw_results').select('id', { count: 'exact' }).eq('payout_status', 'processing'),
    ])

    setStats({
      total_users: usersRes.count || 0,
      active_subscribers: activeSubs.count || 0,
      monthly_revenue: 0, // Would compute from subscriptions
      total_prize_pool: 0,
      total_charity_contributed: 0,
      pending_verifications: pendingVerif.count || 0,
      pending_payouts: pendingPayout.count || 0,
      draws_this_month: null,
    })
    setLoading(false)
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'draws', label: 'Draws', icon: Trophy },
    { id: 'charities', label: 'Charities', icon: Heart },
    { id: 'winners', label: 'Winners', icon: CheckCircle },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
  ] as const

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Admin header */}
      <div className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-semibold">Admin Panel</span>
            <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800 rounded">GolfHero</span>
          </div>
          <span className="text-sm text-slate-400 hidden sm:block">
            {stats?.pending_verifications ? (
              <span className="text-amber-400">
                ⚠ {stats.pending_verifications} pending verification(s)
              </span>
            ) : 'All clear'}
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total users', value: stats?.total_users || 0, icon: Users, color: 'blue', format: (v: number) => v.toLocaleString() },
                { label: 'Active subscribers', value: stats?.active_subscribers || 0, icon: CheckCircle, color: 'emerald', format: (v: number) => v.toLocaleString() },
                { label: 'Pending verification', value: stats?.pending_verifications || 0, icon: AlertCircle, color: 'amber', format: (v: number) => v.toString() },
                { label: 'Pending payouts', value: stats?.pending_payouts || 0, icon: DollarSign, color: 'purple', format: (v: number) => v.toString() },
              ].map((kpi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs text-slate-500">{kpi.label}</span>
                    <kpi.icon className={`w-4 h-4 text-${kpi.color}-400`} />
                  </div>
                  <div className={`text-3xl font-black text-${kpi.color}-400`}>{kpi.format(kpi.value)}</div>
                </motion.div>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-slate-300">Quick actions</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab('draws')}
                  className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all text-left"
                >
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-sm font-medium text-purple-300">Manage draws</div>
                    <div className="text-xs text-slate-500">Run & publish monthly draws</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('winners')}
                  className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all text-left"
                >
                  <CheckCircle className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-medium text-amber-300">Verify winners</div>
                    <div className="text-xs text-slate-500">{stats?.pending_verifications} pending</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('charities')}
                  className="flex items-center gap-3 p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl hover:bg-pink-500/20 transition-all text-left"
                >
                  <Heart className="w-5 h-5 text-pink-400" />
                  <div>
                    <div className="text-sm font-medium text-pink-300">Charities</div>
                    <div className="text-xs text-slate-500">Manage charity listings</div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* DRAWS */}
        {activeTab === 'draws' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
            <DrawManagementPanel />
          </motion.div>
        )}

        {/* WINNERS */}
        {activeTab === 'winners' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
            <WinnersPanel />
          </motion.div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-lg font-semibold mb-6">User management</h2>
            <UserManagementTable />
          </motion.div>
        )}

        {/* REPORTS */}
        {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ReportsPanel />
          </motion.div>
        )}

        {/* CHARITIES */}
        {activeTab === 'charities' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CharitiesAdminPanel />
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Sub-components (inline for single file)
// ============================================

function UserManagementTable() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*, subscriptions(status, plan, current_period_end)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setUsers(data) })
  }, [])

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs">
              <th className="text-left px-6 py-4 font-medium">User</th>
              <th className="text-left px-6 py-4 font-medium">Status</th>
              <th className="text-left px-6 py-4 font-medium">Plan</th>
              <th className="text-left px-6 py-4 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium">{user.full_name || 'Unknown'}</div>
                  <div className="text-slate-500 text-xs">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.subscriptions?.[0]?.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {user.subscriptions?.[0]?.status || 'No sub'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 capitalize">
                  {user.subscriptions?.[0]?.plan || '—'}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(user.created_at).toLocaleDateString('en-GB')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReportsPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Reports & analytics</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total revenue (all time)', value: '£96,120', color: 'emerald' },
          { label: 'Total charity distributed', value: '£352,400', color: 'pink' },
          { label: 'Total prizes paid', value: '£28,600', color: 'amber' },
          { label: 'Average subscription value', value: '£19.99/mo', color: 'blue' },
          { label: 'Monthly active users', value: '3,421', color: 'purple' },
          { label: 'Draw participation rate', value: '87.4%', color: 'teal' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="text-xs text-slate-500 mb-2">{stat.label}</div>
            <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CharitiesAdminPanel() {
  const supabase = createClient()
  const [charities, setCharities] = useState<any[]>([])

  useEffect(() => {
    supabase.from('charities').select('*').order('name').then(({ data }) => {
      if (data) setCharities(data)
    })
  }, [])

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from('charities').update({ is_featured: !current }).eq('id', id)
    setCharities(prev => prev.map(c => c.id === id ? { ...c, is_featured: !current } : c))
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('charities').update({ is_active: !current }).eq('id', id)
    setCharities(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-semibold">Charity management</h2>
      <div className="space-y-3">
        {charities.map(charity => (
          <div key={charity.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium">{charity.name}</div>
              <div className="text-xs text-slate-500 truncate">{charity.short_description}</div>
              <div className="text-xs text-emerald-400 mt-1">£{charity.total_raised.toFixed(0)} raised</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => toggleFeatured(charity.id, charity.is_featured)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  charity.is_featured
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                    : 'border-slate-700 text-slate-500 hover:border-slate-600'
                }`}
              >
                {charity.is_featured ? '⭐ Featured' : 'Feature'}
              </button>
              <button
                onClick={() => toggleActive(charity.id, charity.is_active)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  charity.is_active
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/20 border-red-500/30 text-red-400'
                }`}
              >
                {charity.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
