# GolfHero 🏌️ — Full Setup Guide

> Play Golf. Change Lives. Win Big.

---

## ⚡ Complete Setup in Order

### Step 1 — Supabase (new project)

1. Go to **supabase.com** → New project (must be a fresh project)
2. Wait for it to provision, then go to **SQL Editor**
3. Run these 3 files **in order**:
   - Paste and run `supabase/schema.sql`
   - Paste and run `supabase/functions.sql`  
   - Paste and run `supabase/fixes.sql`
4. Go to **Storage** → New bucket → name: `winner-proofs` → toggle **Public** ON → Save
5. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 2 — Stripe (new account)

1. Go to **stripe.com** → create account → stay in **Test mode**
2. Go to **Products** → Add product:
   - Name: `GolfHero Monthly` → £19.99 → Recurring → Monthly → Save → copy Price ID
   - Name: `GolfHero Yearly` → £199.99 → Recurring → Yearly → Save → copy Price ID
3. Go to **Developers → API keys** → copy Secret key + Publishable key
4. Go to **Developers → Webhooks** → Add endpoint:
   - URL: `https://YOUR-VERCEL-URL.vercel.app/api/stripe/webhook`
   - Select these events:
     - `checkout.session.completed` ← **critical, don't miss this one**
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Save → copy the **Signing secret** (starts with `whsec_`)

### Step 3 — Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_...

NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_EMAILS=your@email.com
```

### Step 4 — Run locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Step 5 — Test locally with Stripe webhooks

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook secret it shows you and put it in .env.local as STRIPE_WEBHOOK_SECRET
```

### Step 6 — Deploy to Vercel (new account)

```bash
npm i -g vercel
vercel login   # use a NEW Vercel account, not personal
vercel --prod
```

Then in Vercel dashboard → Project Settings → Environment Variables → add all vars from `.env.local`.

Update `NEXT_PUBLIC_BASE_URL` to your actual Vercel URL.

Update your Stripe webhook URL to the Vercel URL.

---

## 🔑 Test Credentials

After setup, create a test user via `/signup`.

**Stripe test card:** `4242 4242 4242 4242` · Any future date · Any CVC

**Admin access:** The email you set in `ADMIN_EMAILS`. Log in normally then visit `/admin`.

---

## 🔁 Complete Payment Flow (what was fixed)

The post-payment flow works like this:

```
User pays on Stripe
      ↓
Stripe fires: checkout.session.completed (immediate)
      ↓
Our webhook writes subscription to Supabase (~1-3 seconds)
      ↓
User lands on /dashboard/welcome (polls every 1.5s)
      ↓
Subscription detected → "Go to dashboard" button appears
      ↓
User clicks → /dashboard (subscription confirmed, no redirect)
```

**Old broken flow:** success_url went straight to `/dashboard` → middleware checked subscription → not in DB yet → redirected to `/subscribe` → loop.

**Fixed by:** success_url now goes to `/dashboard/welcome` which is whitelisted in middleware. It polls until subscription appears.

---

## 🗺️ All Pages

| Route | Who sees it | Description |
|---|---|---|
| `/` | Everyone | Homepage |
| `/draws` | Everyone | How draws work + past results |
| `/winners` | Everyone | Hall of fame |
| `/charities` | Everyone | Charity directory |
| `/donate` | Everyone | One-off donation |
| `/signup` | Public | 3-step signup |
| `/login` | Public | Login |
| `/subscribe` | Logged in | Choose plan + charity % |
| `/dashboard` | Active subscriber | Main dashboard (4 tabs) |
| `/dashboard/welcome` | Just paid | Post-payment activation screen |
| `/admin` | Admin email only | Admin panel (6 tabs) |

---

## 🧪 Testing checklist

- [ ] Signup → verify email → login works
- [ ] Subscribe → Stripe checkout → welcome page activates → dashboard accessible
- [ ] Add score (1–45) → duplicate date rejected → 5-score rolling works
- [ ] Admin: create draw → simulate → publish
- [ ] Admin: winners tab shows results, approve/reject verification
- [ ] Mark payout as paid
- [ ] Cancel subscription → dashboard redirects to /subscribe
- [ ] /draws and /winners pages load with no 404

---

## 📁 Key files

| File | Purpose |
|---|---|
| `src/middleware.ts` | Auth + subscription validation on every request |
| `src/lib/draw-engine.ts` | Random + algorithmic draw logic |
| `src/app/api/stripe/webhook/route.ts` | Handles all Stripe events |
| `src/app/api/stripe/create-checkout/route.ts` | Creates Stripe checkout session |
| `src/app/dashboard/welcome/page.tsx` | Post-payment polling page |
| `supabase/schema.sql` | Full DB schema + RLS + seed data |
| `supabase/functions.sql` | SQL functions + views |
| `supabase/fixes.sql` | Unique constraints + additional policies |
