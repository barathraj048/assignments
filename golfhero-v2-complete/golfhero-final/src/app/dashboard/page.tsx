'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Target, Heart, Calendar,
  Plus, Edit2, Trash2, ChevronRight, AlertCircle,
  CheckCircle, Clock, CreditCard, Loader2, Upload
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { GolfScore, Subscription, DrawMonth, DrawResult } from '@/types'

// ============================================
// Score Entry Form (inline)
// ============================================
function ScoreEntryForm({
  onSave,
  existingScore,
  onCancel,
}: {
  onSave: (score: number, date: string, course?: string) => Promise<void>
  existingScore?: GolfScore
  onCancel?: () => void
}) {
  const [score, setScore] = useState(existingScore?.score?.toString() || '')
  const [date, setDate] = useState(existingScore?.score_date || new Date().toISOString().split('T')[0])
  const [course, setCourse] = useState(existingScore?.course_name || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    const scoreNum = parseInt(score)
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      setError('Score must be between 1 and 45 (Stableford format)')
      return
    }
    if (!date) {
      setError('Please select a date')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(scoreNum, date, course || undefined)
    } catch (e: any) {
      setError(e.message || 'Failed to save score')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Score (1–45)</label>
          <input
            type="number"
            min="1"
            max="45"
            value={score}
            onChange={e => setScore(e.target.value)}
            placeholder="e.g. 32"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Date played</label>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Course name (optional)</label>
        <input
          type="text"
          value={course}
          onChange={e => setCourse(e.target.value)}
          placeholder="e.g. St Andrews Old Course"
          className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all active:scale-95"
        >
          {saving ? 'Saving...' : existingScore ? 'Update score' : 'Add score'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// Score Badge
// ============================================
function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 36) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    if (score >= 25) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    if (score >= 15) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    return 'bg-slate-700/60 text-slate-300 border-slate-600/30'
  }
  return (
    <span className={`text-2xl font-black px-3 py-1 rounded-lg border ${getColor()}`}>
      {score}
    </span>
  )
}

// ============================================
// Proof Upload Component
// ============================================
function ProofUploader({ result, onDone }: { result: DrawResult; onDone: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMsg('')
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('result_id', result.id)

    try {
      const res = await fetch('/api/winners/upload-proof', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')
      setMsg('Proof submitted! Our team will review within 2 business days.')
      onDone()
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-3 border border-amber-500/20 rounded-xl p-3 bg-slate-900/50">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-sm">
          <span className="font-medium text-amber-300">
            £{Number(result.prize_amount).toFixed(2)} prize
          </span>
          <span className="text-slate-500 ml-2 text-xs">
            {result.match_type === 'match5' ? 'Jackpot' : result.match_type === 'match4' ? 'Match 4' : 'Match 3'}
          </span>
        </div>
        <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
          uploading
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-amber-500 hover:bg-amber-400 text-white'
        }`}>
          {uploading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-3.5 h-3.5" /> Upload screenshot</>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleFile}
          />
        </label>
      </div>
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ============================================
// MAIN DASHBOARD
// ============================================
export default function DashboardPage() {
  const supabase = createClient()

  const [scores, setScores] = useState<GolfScore[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [currentCharity, setCurrentCharity] = useState<any>(null)
  const [allCharities, setAllCharities] = useState<any[]>([])
  const [upcomingDraw, setUpcomingDraw] = useState<DrawMonth | null>(null)
  const [recentResults, setRecentResults] = useState<DrawResult[]>([])
  const [totalWinnings, setTotalWinnings] = useState(0)
  const [charityTotal, setCharityTotal] = useState(0)
  const [showAddScore, setShowAddScore] = useState(false)
  const [editingScore, setEditingScore] = useState<GolfScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'charity' | 'draws'>('overview')
  const [userName, setUserName] = useState('Golfer')
  const [changingCharity, setChangingCharity] = useState(false)
  const [charityChangeLoading, setCharityChangeLoading] = useState(false)
  const [charityChangeMsg, setCharityChangeMsg] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, scoresRes, subRes, drawRes, resultsRes, contribRes, charitiesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('golf_scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(5),
      // Fetch subscription WITHOUT the join — we handle charity separately below
      supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('draw_months').select('*').in('status', ['upcoming', 'open']).order('month_year', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('draw_results').select('*, draw:draw_months(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('charity_contributions').select('amount').eq('user_id', user.id),
      supabase.from('charities').select('id, name, short_description, total_raised, is_featured').eq('is_active', true).order('name'),
    ])

    if (profileRes.data) setUserName(profileRes.data.full_name?.split(' ')[0] || 'Golfer')
    if (scoresRes.data) setScores(scoresRes.data)

    if (subRes.data) {
      setSubscription(subRes.data as any)
      // Fetch charity separately to avoid join shape issues
      if (subRes.data.charity_id) {
        const { data: charityData } = await supabase
          .from('charities')
          .select('*')
          .eq('id', subRes.data.charity_id)
          .maybeSingle()
        setCurrentCharity(charityData)
      }
    }

    if (drawRes.data) setUpcomingDraw(drawRes.data)
    if (resultsRes.data) {
      setRecentResults(resultsRes.data as any)
      setTotalWinnings(resultsRes.data.reduce((sum: number, r: any) => sum + (r.payout_status === 'paid' ? Number(r.prize_amount) : 0), 0))
    }
    if (contribRes.data) {
      setCharityTotal(contribRes.data.reduce((sum, c) => sum + Number(c.amount), 0))
    }
    if (charitiesRes.data) setAllCharities(charitiesRes.data)

    setLoading(false)
  }

  async function handleChangeCharity(newCharityId: string) {
    if (!subscription) return
    setCharityChangeLoading(true)
    setCharityChangeMsg('')
    const { error } = await supabase
      .from('subscriptions')
      .update({ charity_id: newCharityId })
      .eq('id', subscription.id)

    if (error) {
      setCharityChangeMsg('Failed to update charity. Please try again.')
    } else {
      localStorage.setItem('selected_charity_id', newCharityId)
      setCharityChangeMsg('Charity updated successfully!')
      setChangingCharity(false)
      await loadDashboardData()
    }
    setCharityChangeLoading(false)
  }

  async function handleAddScore(score: number, date: string, course?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check for existing score on this date
    const { data: existing } = await supabase
      .from('golf_scores')
      .select('id')
      .eq('user_id', user.id)
      .eq('score_date', date)
      .maybeSingle()

    if (existing) {
      throw new Error('You already have a score for this date. Please edit the existing entry.')
    }

    // Check rolling 5-score limit — delete oldest if needed
    if (scores.length >= 5) {
      const oldest = [...scores].sort(
        (a, b) => new Date(a.score_date).getTime() - new Date(b.score_date).getTime()
      )[0]
      await supabase.from('golf_scores').delete().eq('id', oldest.id)
    }

    const { error } = await supabase.from('golf_scores').insert({
      user_id: user.id,
      score,
      score_date: date,
      course_name: course || null,
    })

    if (error) throw new Error(error.message)

    setShowAddScore(false)
    await loadDashboardData()
  }

  async function handleUpdateScore(scoreId: string, score: number, date: string, course?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check date uniqueness (excluding current score's id)
    const { data: conflict } = await supabase
      .from('golf_scores')
      .select('id')
      .eq('user_id', user.id)
      .eq('score_date', date)
      .neq('id', scoreId)
      .maybeSingle()

    if (conflict) {
      throw new Error('Another score already exists for this date.')
    }

    const { error } = await supabase
      .from('golf_scores')
      .update({ score, score_date: date, course_name: course || null })
      .eq('id', scoreId)

    if (error) throw new Error(error.message)
    setEditingScore(null)
    await loadDashboardData()
  }

  async function handleDeleteScore(scoreId: string) {
    await supabase.from('golf_scores').delete().eq('id', scoreId)
    await loadDashboardData()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Welcome back, {userName}</h1>
            <p className="text-sm text-slate-400">
              {subscription?.status === 'active' ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Active {subscription.plan} subscription
                </span>
              ) : (
                <span className="text-amber-400">Subscription required</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {currentCharity && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                <Heart className="w-4 h-4 text-pink-400" />
                {currentCharity.name}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pb-0">
          {(['overview', 'scores', 'charity', 'draws'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Subscription',
                  value: subscription?.status === 'active' ? 'Active' : 'Inactive',
                  sub: subscription?.current_period_end ? `Renews ${formatDate(subscription.current_period_end)}` : 'Not subscribed',
                  icon: CreditCard,
                  color: subscription?.status === 'active' ? 'emerald' : 'amber',
                },
                {
                  label: 'Total winnings',
                  value: `£${totalWinnings.toFixed(2)}`,
                  sub: `${recentResults.filter(r => r.payout_status === 'paid').length} prizes claimed`,
                  icon: Trophy,
                  color: 'amber',
                },
                {
                  label: 'Charity total',
                  value: charityTotal > 0 ? `£${charityTotal.toFixed(2)}` : '—',
                  sub: currentCharity ? currentCharity.name : 'No charity selected',
                  icon: Heart,
                  color: 'pink',
                },
                {
                  label: 'Scores logged',
                  value: scores.length.toString() + ' / 5',
                  sub: scores.length < 5 ? `Need ${5 - scores.length} more to enter draw` : 'Ready for next draw!',
                  icon: Target,
                  color: 'blue',
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs text-slate-500 font-medium">{card.label}</span>
                    <card.icon className={`w-4 h-4 text-${card.color}-400`} />
                  </div>
                  <div className="text-xl font-bold mb-1">{card.value}</div>
                  <div className="text-xs text-slate-500">{card.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Upcoming draw + scores side by side */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upcoming draw */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    Next draw
                  </h3>
                  {upcomingDraw && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {upcomingDraw.month_year}
                    </span>
                  )}
                </div>
                {upcomingDraw ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Jackpot', value: `£${upcomingDraw.jackpot_pool.toFixed(0)}`, color: 'amber' },
                        { label: 'Match 4', value: `£${upcomingDraw.match4_pool.toFixed(0)}`, color: 'purple' },
                        { label: 'Match 3', value: `£${upcomingDraw.match3_pool.toFixed(0)}`, color: 'teal' },
                      ].map((prize, i) => (
                        <div key={i} className="bg-slate-800/60 rounded-xl p-3 text-center">
                          <div className={`text-lg font-bold text-${prize.color}-400`}>{prize.value}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{prize.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-slate-400">
                      {scores.length >= 5 ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle className="w-4 h-4" />
                          You're entered! Your numbers: {scores.map(s => s.score).join(', ')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertCircle className="w-4 h-4" />
                          Add {5 - scores.length} more score(s) to enter this draw
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No upcoming draw configured yet</p>
                )}
              </div>

              {/* My scores preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    My scores
                  </h3>
                  <button
                    onClick={() => setActiveTab('scores')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    Manage <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {scores.length > 0 ? (
                  <div className="space-y-2">
                    {scores.slice(0, 3).map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                        <div>
                          <span className="text-sm font-medium">{formatDate(s.score_date)}</span>
                          {s.course_name && <span className="text-xs text-slate-500 ml-2">{s.course_name}</span>}
                        </div>
                        <ScoreBadge score={s.score} />
                      </div>
                    ))}
                    {scores.length > 3 && (
                      <p className="text-xs text-slate-500 text-center pt-1">+{scores.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-500 text-sm mb-3">No scores yet</p>
                    <button
                      onClick={() => setActiveTab('scores')}
                      className="text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      Add your first score →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent winnings */}
            {recentResults.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Recent results
                </h3>
                <div className="space-y-3">
                  {recentResults.map(result => (
                    <div key={result.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          result.match_type === 'match5' ? 'bg-amber-400' :
                          result.match_type === 'match4' ? 'bg-purple-400' : 'bg-emerald-400'
                        }`} />
                        <div>
                          <div className="text-sm font-medium">
                            {result.match_type === 'match5' ? 'Jackpot winner! 🎉' :
                             result.match_type === 'match4' ? 'Match 4 winner' : 'Match 3 winner'}
                          </div>
                          <div className="text-xs text-slate-500">{(result.draw as any)?.month_year}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-400">£{result.prize_amount.toFixed(2)}</div>
                        <div className={`text-xs ${
                          result.payout_status === 'paid' ? 'text-emerald-400' :
                          result.payout_status === 'processing' ? 'text-blue-400' : 'text-slate-500'
                        }`}>
                          {result.payout_status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SCORES TAB */}
        {activeTab === 'scores' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold mb-1">My golf scores</h2>
              <p className="text-slate-400 text-sm">
                Your 5 most recent scores are your lottery numbers. One score per date — new scores replace your oldest automatically.
              </p>
            </div>

            {/* Add score button / form */}
            <AnimatePresence>
              {showAddScore ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6"
                >
                  <h3 className="font-semibold mb-4 text-emerald-400">Add a score</h3>
                  <ScoreEntryForm
                    onSave={handleAddScore}
                    onCancel={() => setShowAddScore(false)}
                  />
                </motion.div>
              ) : (
                <button
                  onClick={() => setShowAddScore(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl text-slate-400 hover:text-emerald-400 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add a score
                </button>
              )}
            </AnimatePresence>

            {/* Scores list */}
            <div className="space-y-3">
              {scores.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No scores yet. Add your first score above.
                </div>
              ) : (
                scores.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                  >
                    {editingScore?.id === s.id ? (
                      <div className="p-5">
                        <h4 className="text-sm text-slate-400 mb-3">Edit score</h4>
                        <ScoreEntryForm
                          existingScore={s}
                          onSave={async (score, date, course) => {
                            await handleUpdateScore(s.id, score, date, course)
                          }}
                          onCancel={() => setEditingScore(null)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                          <ScoreBadge score={s.score} />
                          <div>
                            <div className="font-medium">{formatDate(s.score_date)}</div>
                            {s.course_name && (
                              <div className="text-sm text-slate-500">{s.course_name}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Latest
                            </span>
                          )}
                          <button
                            onClick={() => setEditingScore(s)}
                            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteScore(s.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {scores.length > 0 && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Your draw numbers</h4>
                <div className="flex flex-wrap gap-2">
                  {scores.map(s => (
                    <span
                      key={s.id}
                      className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center"
                    >
                      {s.score}
                    </span>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - scores.length) }).map((_, i) => (
                    <span
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-dashed border-slate-700 text-slate-600 text-xs flex items-center justify-center"
                    >
                      ?
                    </span>
                  ))}
                </div>
                {scores.length < 5 && (
                  <p className="text-xs text-amber-400/80 mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Add {5 - scores.length} more score(s) to enter the monthly draw
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* CHARITY TAB */}
        {activeTab === 'charity' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold mb-1">Your charity impact</h2>
              <p className="text-slate-400 text-sm">Track your contributions and change your chosen cause anytime.</p>
            </div>

            {charityChangeMsg && (
              <div className={`text-sm px-4 py-3 rounded-xl border ${
                charityChangeMsg.includes('Failed')
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {charityChangeMsg}
              </div>
            )}

            {/* Current charity card */}
            {currentCharity ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{currentCharity.name}</div>
                      <div className="text-sm text-slate-400">{currentCharity.short_description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setChangingCharity(!changingCharity); setCharityChangeMsg('') }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
                  >
                    {changingCharity ? 'Cancel' : 'Change'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <div className="text-2xl font-bold text-pink-400">
                      £{charityTotal > 0 ? charityTotal.toFixed(2) : ((subscription?.amount_pence || 0) / 100 * (subscription?.charity_percentage || 10) / 100).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {charityTotal > 0 ? 'Your total contribution' : 'Est. first contribution'}
                    </div>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <div className="text-2xl font-bold text-emerald-400">
                      {subscription?.charity_percentage || 10}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Of your subscription</div>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  £{(((subscription?.amount_pence || 0) / 100) * ((subscription?.charity_percentage || 10) / 100)).toFixed(2)} goes to {currentCharity.name} each {subscription?.plan === 'yearly' ? 'year' : 'month'}.
                </p>

                {/* Change charity picker */}
                {changingCharity && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-5 pt-5 border-t border-slate-800"
                  >
                    <p className="text-sm text-slate-400 mb-3">Select a new charity:</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {allCharities.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleChangeCharity(c.id)}
                          disabled={charityChangeLoading || c.id === currentCharity.id}
                          className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all disabled:opacity-60 ${
                            c.id === currentCharity.id
                              ? 'border-emerald-500/40 bg-emerald-500/5'
                              : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/40'
                          }`}
                        >
                          <Heart className={`w-4 h-4 flex-shrink-0 ${c.id === currentCharity.id ? 'text-pink-400' : 'text-slate-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{c.name}</div>
                            <div className="text-xs text-slate-500 truncate">{c.short_description}</div>
                          </div>
                          {c.id === currentCharity.id && (
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                          {charityChangeLoading && c.id !== currentCharity.id && (
                            <Clock className="w-4 h-4 text-slate-600 flex-shrink-0 animate-spin" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* No charity selected */
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-300">No charity selected</p>
                    <p className="text-sm text-slate-400">Choose one below and we'll donate {subscription?.charity_percentage || 10}% of your subscription to them.</p>
                  </div>
                </div>

                {allCharities.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allCharities.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleChangeCharity(c.id)}
                        disabled={charityChangeLoading}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all disabled:opacity-60"
                      >
                        <Heart className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-slate-500 truncate">{c.short_description}</div>
                        </div>
                        <span className="text-xs text-emerald-400 flex-shrink-0">Select →</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Link href="/charities" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                    Browse charities →
                  </Link>
                )}
              </div>
            )}

            {/* Platform-wide impact */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold mb-1 text-slate-300">Platform-wide impact</h3>
              <p className="text-xs text-slate-500 mb-4">Total raised by all GolfHero members combined</p>
              <div className="text-4xl font-black text-white mb-1">
                £{allCharities.reduce((s, c) => s + Number(c.total_raised || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-emerald-400/70">
                across {allCharities.length} charit{allCharities.length === 1 ? 'y' : 'ies'}
              </div>
            </div>

            <Link
              href="/charities"
              className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl py-3 transition-all"
            >
              <Heart className="w-4 h-4 text-pink-400" />
              Browse all charities
            </Link>
          </motion.div>
        )}

        {/* DRAWS TAB */}
        {activeTab === 'draws' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold mb-1">Draw participation</h2>
              <p className="text-slate-400 text-sm">Your draw history and upcoming entries.</p>
            </div>

            {/* Participation summary */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Draws entered', value: recentResults.length + 8 },
                { label: 'Times won', value: recentResults.length },
                { label: 'Total prizes', value: `£${totalWinnings.toFixed(0)}` },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Winner verification section */}
            {recentResults.some(r => r.verification_status === 'pending' && Number(r.prize_amount) > 0) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                <h3 className="font-semibold text-amber-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Action required: Winner verification
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Upload a screenshot of your scores from your golf tracking platform to claim your prize.
                </p>
                {recentResults
                  .filter(r => r.verification_status === 'pending' && Number(r.prize_amount) > 0)
                  .map(result => (
                    <ProofUploader key={result.id} result={result} onDone={loadDashboardData} />
                  ))
                }
              </div>
            )}

            {/* Draw history */}
            <div>
              <h3 className="font-semibold text-slate-300 mb-3">Draw history</h3>
              {recentResults.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No draw results yet. Keep logging scores to enter!
                </div>
              ) : (
                <div className="space-y-3">
                  {recentResults.map(result => (
                    <div key={result.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className={`w-5 h-5 ${
                          result.match_type === 'match5' ? 'text-amber-400' :
                          result.match_type === 'match4' ? 'text-purple-400' : 'text-emerald-400'
                        }`} />
                        <div>
                          <div className="font-medium text-sm">
                            {result.match_type === 'match5' ? '5-match Jackpot' :
                             result.match_type === 'match4' ? '4-match win' : '3-match win'}
                          </div>
                          <div className="text-xs text-slate-500">{(result.draw as any)?.month_year}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">£{result.prize_amount.toFixed(2)}</div>
                        <div className={`text-xs capitalize ${
                          result.payout_status === 'paid' ? 'text-emerald-400' : 'text-slate-500'
                        }`}>{result.payout_status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
