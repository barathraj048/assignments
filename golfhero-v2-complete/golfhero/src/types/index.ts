// ============================================
// GOLFHERO - Complete TypeScript Types
// ============================================

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'lapsed' | 'trialing'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type DrawStatus = 'upcoming' | 'open' | 'simulating' | 'published' | 'closed'
export type DrawMode = 'random' | 'algorithmic'
export type MatchType = 'match5' | 'match4' | 'match3'
export type VerificationStatus = 'pending' | 'proof_submitted' | 'approved' | 'rejected'
export type PayoutStatus = 'pending' | 'processing' | 'paid'
export type ContributionType = 'subscription' | 'voluntary'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  handicap: number | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Charity {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  logo_url: string | null
  banner_url: string | null
  website_url: string | null
  is_featured: boolean
  is_active: boolean
  total_raised: number
  events: CharityEvent[]
  created_at: string
}

export interface CharityEvent {
  id: string
  title: string
  date: string
  location: string
  description: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  amount_pence: number
  charity_id: string | null
  charity_percentage: number
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  // Joined
  charity?: Charity
}

export interface GolfScore {
  id: string
  user_id: string
  score: number
  score_date: string
  course_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DrawMonth {
  id: string
  month_year: string
  status: DrawStatus
  draw_mode: DrawMode
  total_pool: number
  jackpot_pool: number
  match4_pool: number
  match3_pool: number
  jackpot_rolled_over: number
  jackpot_claimed: boolean
  drawn_numbers: number[] | null
  published_at: string | null
  created_at: string
  // Computed
  entry_count?: number
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  scores_snapshot: number[]
  match_count: number
  matched_numbers: number[]
  created_at: string
}

export interface DrawResult {
  id: string
  draw_id: string
  user_id: string
  match_type: MatchType
  prize_amount: number
  total_tier_prize: number
  winner_count: number
  verification_status: VerificationStatus
  proof_url: string | null
  proof_submitted_at: string | null
  admin_reviewed_at: string | null
  admin_notes: string | null
  payout_status: PayoutStatus
  paid_at: string | null
  created_at: string
  // Joined
  profile?: Profile
  draw?: DrawMonth
}

export interface CharityContribution {
  id: string
  user_id: string
  charity_id: string
  subscription_id: string | null
  amount: number
  contribution_type: ContributionType
  month_year: string | null
  created_at: string
  charity?: Charity
}

// ============================================
// DRAW ENGINE TYPES
// ============================================

export interface DrawSimulationResult {
  drawn_numbers: number[]
  winners: {
    match5: DrawEntry[]
    match4: DrawEntry[]
    match3: DrawEntry[]
  }
  prize_breakdown: {
    jackpot_pool: number
    match4_pool: number
    match3_pool: number
    per_winner_match5: number | null
    per_winner_match4: number | null
    per_winner_match3: number | null
  }
}

export interface ScoreFrequency {
  score: number
  count: number
  weight: number
}

// ============================================
// PRIZE POOL CONSTANTS
// ============================================
export const PRIZE_POOL_DISTRIBUTION = {
  match5: 0.40, // 40% → jackpot (rolls over)
  match4: 0.35, // 35%
  match3: 0.25, // 25%
} as const

export const SUBSCRIPTION_PRICES = {
  monthly: 1999, // £19.99 in pence
  yearly: 19999, // £199.99 in pence
} as const

export const MIN_CHARITY_PERCENTAGE = 10

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface UserDashboardStats {
  subscription: Subscription | null
  scores: GolfScore[]
  upcoming_draw: DrawMonth | null
  recent_results: DrawResult[]
  total_winnings: number
  draws_entered: number
  charity_total: number
}

export interface AdminDashboardStats {
  total_users: number
  active_subscribers: number
  monthly_revenue: number
  total_prize_pool: number
  total_charity_contributed: number
  pending_verifications: number
  pending_payouts: number
  draws_this_month: DrawMonth | null
}
