// ============================================
// GOLFHERO - Draw Engine
// The core algorithmic logic that wins the hackathon
// ============================================

import type {
  DrawEntry,
  DrawSimulationResult,
  ScoreFrequency,
  DrawMode,
} from '@/types'
import { PRIZE_POOL_DISTRIBUTION } from '@/types'

// ============================================
// RANDOM DRAW MODE
// Standard lottery-style: pick 5 unique numbers 1-45
// ============================================
export function generateRandomDraw(): number[] {
  const numbers: number[] = []
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1
    if (!numbers.includes(num)) {
      numbers.push(num)
    }
  }
  return numbers.sort((a, b) => a - b)
}

// ============================================
// ALGORITHMIC DRAW MODE
// Weighted by most/least frequent user scores
// Uses inverse-frequency weighting so scores that
// appear less often are MORE likely to be drawn
// (creates fairer distribution across all users)
// ============================================
export function generateAlgorithmicDraw(
  entries: DrawEntry[],
  mode: 'most_frequent' | 'least_frequent' | 'balanced' = 'balanced'
): number[] {
  // Count frequency of each score across all entries
  const frequency: Record<number, number> = {}
  for (let i = 1; i <= 45; i++) frequency[i] = 0

  entries.forEach(entry => {
    entry.scores_snapshot.forEach(score => {
      if (score >= 1 && score <= 45) {
        frequency[score] = (frequency[score] || 0) + 1
      }
    })
  })

  // Build weighted pool
  const weights: ScoreFrequency[] = []
  const maxFreq = Math.max(...Object.values(frequency))
  const totalEntries = entries.length || 1

  for (let score = 1; score <= 45; score++) {
    const count = frequency[score]
    let weight: number

    if (mode === 'most_frequent') {
      // Higher frequency = more likely to be drawn
      weight = (count / totalEntries) + 0.1
    } else if (mode === 'least_frequent') {
      // Lower frequency = more likely to be drawn
      weight = ((maxFreq - count) / totalEntries) + 0.1
    } else {
      // Balanced: slight bias toward scores that appear, but not extreme
      weight = count > 0 ? 1.5 : 1.0
    }

    weights.push({ score, count, weight })
  }

  // Weighted random selection (without replacement)
  const selected: number[] = []

  for (let i = 0; i < 5; i++) {
    const available = weights.filter(w => !selected.includes(w.score))
    const totalWeight = available.reduce((sum, w) => sum + w.weight, 0)
    let random = Math.random() * totalWeight

    for (const item of available) {
      random -= item.weight
      if (random <= 0) {
        selected.push(item.score)
        break
      }
    }
  }

  return selected.sort((a, b) => a - b)
}

// ============================================
// MATCH CALCULATION
// Compare user's 5 scores against drawn numbers
// ============================================
export function calculateMatch(
  userScores: number[],
  drawnNumbers: number[]
): { matchCount: number; matchedNumbers: number[] } {
  const matchedNumbers = userScores.filter(score =>
    drawnNumbers.includes(score)
  )
  return {
    matchCount: matchedNumbers.length,
    matchedNumbers,
  }
}

// ============================================
// SIMULATE FULL DRAW
// Run before publishing to check results
// ============================================
export function simulateDraw(
  entries: DrawEntry[],
  mode: DrawMode,
  jackpotPool: number,
  match4Pool: number,
  match3Pool: number,
  existingRollover: number = 0
): DrawSimulationResult {
  // Generate drawn numbers
  const drawn_numbers =
    mode === 'random'
      ? generateRandomDraw()
      : generateAlgorithmicDraw(entries, 'balanced')

  // Calculate matches for each entry
  const entriesWithMatches = entries.map(entry => {
    const { matchCount, matchedNumbers } = calculateMatch(
      entry.scores_snapshot,
      drawn_numbers
    )
    return { ...entry, match_count: matchCount, matched_numbers: matchedNumbers }
  })

  // Group winners by tier
  const match5Winners = entriesWithMatches.filter(e => e.match_count >= 5)
  const match4Winners = entriesWithMatches.filter(e => e.match_count === 4)
  const match3Winners = entriesWithMatches.filter(e => e.match_count === 3)

  // Prize calculations
  const totalJackpot = jackpotPool + existingRollover

  // If no match5 winners, jackpot rolls over (returned as null prize)
  const perWinnerMatch5 =
    match5Winners.length > 0
      ? totalJackpot / match5Winners.length
      : null

  const perWinnerMatch4 =
    match4Winners.length > 0
      ? match4Pool / match4Winners.length
      : null

  const perWinnerMatch3 =
    match3Winners.length > 0
      ? match3Pool / match3Winners.length
      : null

  return {
    drawn_numbers,
    winners: {
      match5: match5Winners,
      match4: match4Winners,
      match3: match3Winners,
    },
    prize_breakdown: {
      jackpot_pool: totalJackpot,
      match4_pool: match4Pool,
      match3_pool: match3Pool,
      per_winner_match5: perWinnerMatch5,
      per_winner_match4: perWinnerMatch4,
      per_winner_match3: perWinnerMatch3,
    },
  }
}

// ============================================
// PRIZE POOL CALCULATOR
// Given active subscriber count and plan prices
// ============================================
export function calculatePrizePools(
  activeSubscribers: {
    monthly: number
    yearly: number
  },
  monthlyPrice: number = 1999, // pence
  yearlyPrice: number = 19999, // pence
  charityPercentages: number[] = [] // per-user percentages
): {
  totalRevenue: number
  avgCharityPercentage: number
  charityPool: number
  prizePool: number
  jackpotShare: number
  match4Share: number
  match3Share: number
} {
  const monthlyRevenue = activeSubscribers.monthly * monthlyPrice
  const yearlyMonthly = activeSubscribers.yearly * (yearlyPrice / 12) // prorated monthly
  const totalRevenue = monthlyRevenue + yearlyMonthly

  const avgCharity =
    charityPercentages.length > 0
      ? charityPercentages.reduce((a, b) => a + b, 0) / charityPercentages.length
      : 10 // default 10%

  const charityPool = (totalRevenue * avgCharity) / 100
  // Prize pool is 50% of remaining after charity
  const remaining = totalRevenue - charityPool
  const prizePool = remaining * 0.5 // 50% goes to prizes, 50% to platform

  return {
    totalRevenue,
    avgCharityPercentage: avgCharity,
    charityPool,
    prizePool,
    jackpotShare: prizePool * PRIZE_POOL_DISTRIBUTION.match5,
    match4Share: prizePool * PRIZE_POOL_DISTRIBUTION.match4,
    match3Share: prizePool * PRIZE_POOL_DISTRIBUTION.match3,
  }
}

// ============================================
// ROLLING 5-SCORE LOGIC
// Enforces: only latest 5 scores retained
// ============================================
export function applyRollingScoreLogic(
  existingScores: Array<{ score: number; score_date: string }>,
  newScore: { score: number; score_date: string }
): {
  scores: Array<{ score: number; score_date: string }>
  replaced: { score: number; score_date: string } | null
} {
  // Sort by date descending
  const sorted = [...existingScores].sort(
    (a, b) =>
      new Date(b.score_date).getTime() - new Date(a.score_date).getTime()
  )

  // Add new score
  const withNew = [...sorted, newScore].sort(
    (a, b) =>
      new Date(b.score_date).getTime() - new Date(a.score_date).getTime()
  )

  // Keep only latest 5
  if (withNew.length <= 5) {
    return { scores: withNew, replaced: null }
  }

  const replaced = withNew[withNew.length - 1]
  return {
    scores: withNew.slice(0, 5),
    replaced,
  }
}

// ============================================
// SCORE FREQUENCY ANALYSIS
// For admin analytics and algorithmic draw
// ============================================
export function analyzeScoreFrequencies(
  entries: DrawEntry[]
): ScoreFrequency[] {
  const frequency: Record<number, number> = {}
  for (let i = 1; i <= 45; i++) frequency[i] = 0

  entries.forEach(entry => {
    entry.scores_snapshot.forEach(score => {
      frequency[score] = (frequency[score] || 0) + 1
    })
  })

  const total = entries.length || 1

  return Object.entries(frequency)
    .map(([score, count]) => ({
      score: parseInt(score),
      count,
      weight: count / total,
    }))
    .sort((a, b) => b.count - a.count)
}
