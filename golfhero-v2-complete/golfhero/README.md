# GolfHero 🏌️

> **Play Golf. Change Lives. Win Big.**

A subscription-driven web platform combining golf performance tracking, charity fundraising, and a monthly draw-based prize engine.

---

## 🏆 Hackathon Deliverables Checklist

| Requirement | Status |
|---|---|
| Live Website (Vercel) | ✅ Deploy with instructions below |
| User Panel (signup/login/dashboard) | ✅ Complete |
| Admin Panel (draws/users/charities/winners) | ✅ Complete |
| Stripe subscription (monthly + yearly) | ✅ With webhooks |
| Score entry — rolling 5-score logic | ✅ With date uniqueness |
| Draw system (random + algorithmic) | ✅ With simulation mode |
| Jackpot rollover | ✅ Automated |
| Charity selection & contributions | ✅ Per-user % |
| Winner verification flow | ✅ Proof upload + admin review |
| Payout tracking (pending → paid) | ✅ |
| Responsive mobile-first design | ✅ |
| Supabase backend with schema | ✅ |
| Error handling & edge cases | ✅ |

---

## 🚀 Quick Start (15-minute setup)

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New project (use a **new** project, not personal)
2. In SQL Editor, run `supabase/schema.sql` (this creates all tables + seed data)
3. Then run `supabase/functions.sql` (RPC functions + views)
4. Copy your Project URL and API keys from Settings → API

### 2. Stripe Setup

1. Go to [stripe.com](https://stripe.com) → New account
2. Create two products:
   - **GolfHero Monthly** → £19.99/month recurring → note the Price ID
   - **GolfHero Yearly** → £199.99/year recurring → note the Price ID
3. Enable test mode (toggle at top of Stripe dashboard)
4. Get your Secret Key and Publishable Key
5. For webhooks: Dashboard → Webhooks → Add endpoint
   - URL: `https://your-vercel-url.vercel.app/api/stripe/webhook`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
# Fill in all values from Supabase and Stripe dashboards
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel (use a NEW account, not personal)
vercel login

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
# Project Settings → Environment Variables
```

### 5. Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## 🏗️ Architecture

```
golfhero/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Homepage (emotion-first design)
│   │   ├── login/              # Auth pages
│   │   ├── signup/             # Multi-step onboarding
│   │   ├── subscribe/          # Subscription & charity % selection
│   │   ├── dashboard/          # User dashboard (4 tabs)
│   │   ├── charities/          # Charity directory
│   │   ├── admin/              # Admin dashboard (6 tabs)
│   │   └── api/
│   │       └── stripe/         # Checkout + webhook handlers
│   ├── lib/
│   │   ├── draw-engine.ts      # ⭐ Core draw algorithm
│   │   └── supabase/           # Client + server clients
│   ├── types/                  # TypeScript interfaces
│   └── middleware.ts           # Auth + subscription validation
└── supabase/
    ├── schema.sql              # Full DB schema + RLS + seed data
    └── functions.sql           # RPC functions + admin views
```

---

## 🎯 Key Technical Decisions

### Draw Engine (the differentiator)
Two draw modes implemented in `src/lib/draw-engine.ts`:

**Random mode**: Standard 5-number lottery from 1–45

**Algorithmic mode**: Inverse-frequency weighted selection — numbers that appear less often in user scores get higher draw probability, creating fairer distribution across the subscriber base

Both modes support:
- Simulation / pre-publish preview
- Multi-winner prize splitting (correct per-winner amounts)
- Jackpot rollover when no match-5 winner

### Score Validation
- Database-level `UNIQUE(user_id, score_date)` prevents duplicate dates
- Application-level check with user-friendly error message
- Rolling 5-score: oldest automatically replaced when 6th score added
- Score range: 1–45 (Stableford format) enforced at DB and UI level

### Subscription Validation
`middleware.ts` validates subscription status on **every** dashboard request — not just login. Matches PRD requirement for real-time subscription checks.

### Prize Pool Math
Each invoice payment triggers:
1. Charity contribution recorded (user's % of payment)
2. Remaining split: 50% to prize pool, 50% to platform
3. Prize pool split: 40% jackpot / 35% match-4 / 25% match-3

---

## 🧪 Test Credentials

After deploying, create test users:

```
User: testuser@example.com / Password: testpass123
Admin: Set ADMIN_EMAILS=youremail@example.com in env vars
```

**Stripe test cards:**
- `4242 4242 4242 4242` — Success
- `4000 0000 0000 0002` — Declined

---

## 📱 Pages

| Route | Description |
|---|---|
| `/` | Homepage — emotion-first, charity-led |
| `/signup` | 3-step onboarding (account → charity → subscribe) |
| `/login` | Login |
| `/subscribe` | Plan selection with charity % picker |
| `/dashboard` | User dashboard (overview, scores, charity, draws) |
| `/charities` | Charity directory with search |
| `/admin` | Admin panel (users, draws, charities, winners, reports) |

---

## 🔑 Admin Operations

1. Navigate to `/admin` (must be logged in with email in `ADMIN_EMAILS`)
2. **Create draw**: Draws tab → New draw
3. **Run simulation**: Select draw → Choose mode → Simulate
4. **Publish**: Review simulation results → Publish (creates winner records automatically)
5. **Verify winners**: Winners tab → Review proof uploads → Approve/Reject
6. **Mark paid**: Approved winners → Mark as paid

---

## 💡 Edge Cases Handled

- One score per date per user (DB constraint + app validation)
- Jackpot rollover to next month when no match-5 winner
- Multi-winner prize splitting (amounts divided equally)
- Subscription validation on every authenticated request
- Lapsed subscription restricts dashboard access
- Algorithmic draw falls back gracefully with no entries
- Score date uniqueness on edit (excludes current record's ID)

---

Built for Digital Heroes hackathon — GolfHero © 2024
