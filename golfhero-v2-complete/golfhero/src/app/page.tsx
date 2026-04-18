'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowRight, Heart, Trophy, Target, Users, ChevronDown, Star } from 'lucide-react'

const CHARITIES = [
  { name: 'Golf Foundation', raised: '£142,000', color: '#10b981' },
  { name: 'Cancer Research UK', raised: '£89,400', color: '#6366f1' },
  { name: 'Macmillan Cancer Support', raised: '£67,200', color: '#f59e0b' },
  { name: 'Mind UK', raised: '£54,100', color: '#ec4899' },
]

const STATS = [
  { value: '4,821', label: 'Active members' },
  { value: '£352K', label: 'Raised for charity' },
  { value: '£84,200', label: 'Current jackpot' },
  { value: '23', label: 'Charities supported' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Subscribe & choose your cause',
    desc: 'Pick a plan from £19.99/month. Select a charity close to your heart — at least 10% of every payment goes directly to them.',
    icon: Heart,
    color: '#ec4899',
  },
  {
    step: '02',
    title: 'Enter your golf scores',
    desc: 'Log your latest Stableford scores (1–45). We keep your 5 most recent — they become your lottery numbers.',
    icon: Target,
    color: '#6366f1',
  },
  {
    step: '03',
    title: 'Win every month',
    desc: 'A draw runs each month. Match 3, 4 or all 5 of your scores to win your share of the prize pool.',
    icon: Trophy,
    color: '#f59e0b',
  },
]

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  const [currentCharity, setCurrentCharity] = useState(0)
  const [jackpotValue, setJackpotValue] = useState(84200)
  const [countersStarted, setCountersStarted] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCharity(prev => (prev + 1) % CHARITIES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Animate jackpot ticker
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setJackpotValue(prev => {
          const next = prev + Math.floor(Math.random() * 3)
          return next
        })
      }, 2000)
      return () => clearInterval(interval)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden" ref={containerRef}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">GH</span>
          </div>
          <span className="font-semibold tracking-tight text-white">GolfHero</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <Link href="/charities" className="hover:text-white transition-colors">Charities</Link>
          <Link href="/draws" className="hover:text-white transition-colors">How it works</Link>
          <Link href="/winners" className="hover:text-white transition-colors">Winners</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
          >
            Join now
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20"
      >
        {/* Ambient background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-teal-500/8 rounded-full blur-[100px]" />
        </div>

        {/* Live jackpot ticker */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-300 font-medium">
            Current jackpot: <span className="text-white font-bold">£{jackpotValue.toLocaleString()}</span>
          </span>
          <span className="text-emerald-500/60 text-xs">• Live</span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight max-w-5xl"
        >
          Play golf.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Change lives.
          </span>
          <br />
          Win big.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-lg sm:text-xl text-white/50 text-center max-w-2xl leading-relaxed"
        >
          Subscribe, enter your scores, and join a monthly prize draw — while supporting a charity you care about. Golf with purpose.
        </motion.p>

        {/* Charity cycling pill */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex items-center gap-3 text-sm"
        >
          <span className="text-white/40">Currently supporting</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCharity}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: `${CHARITIES[currentCharity].color}20`, border: `1px solid ${CHARITIES[currentCharity].color}40` }}
            >
              <Heart className="w-3.5 h-3.5" style={{ color: CHARITIES[currentCharity].color }} />
              <span style={{ color: CHARITIES[currentCharity].color }} className="font-medium">
                {CHARITIES[currentCharity].name}
              </span>
              <span className="text-white/40">· {CHARITIES[currentCharity].raised}</span>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/signup"
            className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
          >
            Start your subscription
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/how-it-works"
            className="flex items-center gap-2 text-white/60 hover:text-white px-6 py-4 rounded-full border border-white/10 hover:border-white/30 transition-all text-base"
          >
            See how it works
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl"
        >
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 flex flex-col items-center gap-2 text-white/30"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </motion.section>

      {/* How it works */}
      <section className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-emerald-400 text-sm font-medium tracking-widest uppercase">The mechanics</span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">Three steps to winning</h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">Simple as golf should be. Powerful as the charities you support.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-3xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] transition-all group"
              >
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${item.color}10 0%, transparent 70%)` }}
                />
                <div className="text-6xl font-black text-white/5 mb-6 font-mono">{item.step}</div>
                <item.icon className="w-7 h-7 mb-4" style={{ color: item.color }} />
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize pool visualization */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-amber-400 text-sm font-medium tracking-widest uppercase">Prize structure</span>
            <h2 className="mt-4 text-4xl font-bold">How the pool is split</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              { label: 'Match 5 — Jackpot', share: '40%', desc: 'Rolls over if unclaimed', color: '#f59e0b', width: '100%' },
              { label: 'Match 4', share: '35%', desc: 'Split equally among all match-4 winners', color: '#6366f1', width: '87.5%' },
              { label: 'Match 3', share: '25%', desc: 'Split equally among all match-3 winners', color: '#10b981', width: '62.5%' },
            ].map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden"
              >
                <motion.div
                  className="absolute inset-y-0 left-0 opacity-10 rounded-2xl"
                  style={{ background: tier.color }}
                  initial={{ width: '0%' }}
                  whileInView={{ width: tier.width }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 1, ease: 'easeOut' }}
                />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{tier.label}</div>
                    <div className="text-sm text-white/40 mt-1">{tier.desc}</div>
                  </div>
                  <div className="text-3xl font-black" style={{ color: tier.color }}>{tier.share}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center text-white/30 text-sm"
          >
            Prize pool grows with every new subscriber. No jackpot winner = bigger pot next month.
          </motion.p>
        </div>
      </section>

      {/* Charity spotlight */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/10 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-emerald-400 text-sm font-medium tracking-widest uppercase">Our charities</span>
            <h2 className="mt-4 text-4xl font-bold">Play for something bigger</h2>
            <p className="mt-4 text-white/50">Every subscription supports a cause you choose.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CHARITIES.map((charity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="p-6 rounded-2xl border border-white/8 bg-white/[0.03] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full mb-4 flex items-center justify-center"
                  style={{ background: `${charity.color}20` }}>
                  <Heart className="w-5 h-5" style={{ color: charity.color }} />
                </div>
                <h3 className="font-semibold mb-1">{charity.name}</h3>
                <div className="text-sm" style={{ color: charity.color }}>{charity.raised} raised</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <Link href="/charities" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 justify-center">
              Browse all charities <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-8">
            <Trophy className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Ready to play with purpose?
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Join 4,821 golfers already winning prizes and funding causes that matter.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-full font-semibold text-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(16,185,129,0.4)]"
          >
            Subscribe from £19.99/month
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="mt-4 text-white/30 text-sm">Cancel anytime. At least 10% always goes to charity.</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600" />
            <span className="text-sm text-white/40">GolfHero © 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-white/30">
            <Link href="/privacy" className="hover:text-white/60">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60">Terms</Link>
            <Link href="/contact" className="hover:text-white/60">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
