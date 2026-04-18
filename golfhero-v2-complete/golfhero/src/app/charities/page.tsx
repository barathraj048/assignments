'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Search, ExternalLink, Star, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Charity } from '@/types'

export default function CharitiesPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .then(({ data }) => {
        if (data) setCharities(data)
        setLoading(false)
      })
  }, [])

  const featured = charities.filter(c => c.is_featured)
  const filtered = charities.filter(
    c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.short_description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-pink-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-20 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-pink-400 text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Our charities
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Play for a cause</h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Every GolfHero subscription supports a charity you choose. Browse our verified partners below.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        {/* Search */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search charities..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 pl-12 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Featured */}
        {!search && featured.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest">Featured this month</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {featured.map((charity, i) => (
                <motion.div
                  key={charity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-br from-pink-900/20 to-slate-900/80 border border-pink-500/20 rounded-3xl p-7 hover:border-pink-500/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-pink-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-pink-400">£{charity.total_raised.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">raised by our members</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{charity.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{charity.description?.slice(0, 150)}...</p>
                  <div className="flex items-center justify-between">
                    {charity.website_url && (
                      <a
                        href={charity.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        Visit website <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link
                      href={`/signup?charity=${charity.id}`}
                      className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      Support this charity →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All charities */}
        <div>
          {!search && <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-5">All charities</h2>}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-900 rounded-2xl p-6 h-48 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((charity, i) => (
                <motion.div
                  key={charity.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-pink-400" />
                    </div>
                    {charity.is_featured && (
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <h3 className="font-semibold mb-2">{charity.name}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{charity.short_description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-emerald-400">
                      £{charity.total_raised.toLocaleString()}
                      <span className="text-xs text-slate-500 font-normal ml-1">raised</span>
                    </div>
                    <Link
                      href={`/signup?charity=${charity.id}`}
                      className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Support →
                    </Link>
                  </div>

                  {/* Events */}
                  {charity.events && charity.events.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                        <Calendar className="w-3 h-3" />
                        Upcoming events
                      </div>
                      {charity.events.slice(0, 1).map((event: any) => (
                        <div key={event.id} className="text-xs text-slate-400">
                          <span className="font-medium">{event.title}</span>
                          {event.date && <span className="text-slate-600 ml-2">{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
