# Storefront

Production-quality online storefront for the POS/ERP app with ultra-modern glass UI effects.

The storefront represents **Al Haq Farms & Meats**. Its brand identity and
public contact details are maintained in `lib/brand.ts` from
[alhaqfarms.com.pk](https://www.alhaqfarms.com.pk); no public Supabase brand
settings view is required.

## Tech Stack

- **Next.js 15** (App Router)
- **React 18**
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **Framer Motion** (animations)
- **Lucide React** (icons)
- **Zod** (validation)
- **Supabase** (database & auth)
- **@opennextjs/cloudflare** (Cloudflare Workers adapter)
- **wrangler** (Cloudflare CLI)

## Deployment

Target: **Cloudflare Workers** (start with `shop.alhaqfarms.com.pk`, move to `alhaqfarms.com.pk` after testing)

### Quick Start

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build

# Preview with Cloudflare adapter
npm run preview

# Deploy to Cloudflare
npm run deploy
```

### Environment Variables

Copy `.env.local.example` to `.env.local` for local development. Set the public Supabase URL, anon key, and final `NEXT_PUBLIC_SITE_URL` in the build environment as well. Keep the service-role key, Turnstile secret, and checkout hash secret server-side only.

Sample catalog data is used only when public Supabase credentials are absent or, in development only, when the storefront schema/views are not installed or exposed. Production stays strict and does not silently substitute sample inventory. Secure checkout and order tracking also require the service-role key and a random `CHECKOUT_HASH_SECRET` of at least 32 characters; checkout additionally requires Turnstile site/secret keys.

### Cloudflare Workers Setup

1. Provide `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` as build-time variables and as plaintext Worker variables (the server runtime also reads the URL).
2. Configure server-only Cloudflare secrets:
   ```bash
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put TURNSTILE_SECRET_KEY
   wrangler secret put CHECKOUT_HASH_SECRET
   ```
   Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` as a public Worker variable.
3. Preview/deploy only after the owner has applied the implemented Supabase migrations:
   ```bash
   npm run preview
   ```

Configuration files:
- `wrangler.jsonc` - Worker configuration (name: `alhaqfarms-storefront`)
- `open-next.config.ts` - OpenNext adapter configuration

## Current Status

The storefront includes the catalog, cart, checkout flow, WhatsApp contact handoff,
order confirmation, order tracking endpoint/UI, policy pages, SEO routes, and an
installable-app manifest. Production use is still blocked on owner-controlled
Supabase configuration and review:

- Storefront migrations `002`–`008` are implemented in `supabase/migrations/`.
  Apply them to the shared Supabase project, review the shared
  `public.web_orders` changes against the desktop app, then expose the
  `storefront` schema in Supabase Project Settings → API. Apply
  [`202611020001_category_images.sql`](./supabase/migrations/202611020001_category_images.sql)
  after the desktop app has category image sync enabled to expose
  `categories.image_path` to the storefront.
- Configure storefront delivery areas, COD rules, payment accounts, private
  receipt storage, Supabase credentials, Cloudflare Turnstile, and server-only
  secrets before accepting real orders.
- Set `NEXT_PUBLIC_SITE_URL` to the final storefront origin before deployment.
- The policy copy is draft text and needs owner/legal review.
- Urdu/RTL content has not been implemented.
- No production build or deployment has been run.

## Implemented Supabase Migrations

The checkout and tracking migrations are implemented in `supabase/migrations/`.
Review them against the live schema and apply `002`–`008` in order before using
online checkout:

Customer wishlists and account order history additionally require the tracked
[`supabase/migrations/202611010001_customer_wishlist_order_history.sql`](./supabase/migrations/202611010001_customer_wishlist_order_history.sql)
migration after `002`–`008` have been applied. It creates
a private per-user wishlist and associates only newly placed, signed-in
storefront orders with their Supabase Auth user. Existing guest orders and the
desktop app's receivables customer records are not automatically linked.

Order history also uses the server-only
[`supabase/migrations/202611070001_customer_order_history_rpc.sql`](./supabase/migrations/202611070001_customer_order_history_rpc.sql)
RPC. Apply it after the customer association migration and expose only this
function in the Supabase Data API; the storefront does not require the order
tables themselves to be exposed.

The tracked
[`supabase/migrations/202611010002_branch_delivery_areas.sql`](./supabase/migrations/202611010002_branch_delivery_areas.sql)
migration creates branch-linked delivery-area records using the shared
`public.branches.id` UUID, backfills existing area names, and keeps checkout's
existing settings view compatible. Apply it after `002`–`008` and
`202611010001_customer_wishlist_order_history.sql`. The owner must configure
branch delivery areas, COD rules, and payment accounts before those options
become available. Storefront reservations do not lock stock against
simultaneous desktop POS sales; enforcing shared reservations requires a
desktop-app change and is intentionally out of scope.

The tracked
[`supabase/migrations/202611010003_hq_synced_checkout_settings.sql`](./supabase/migrations/202611010003_hq_synced_checkout_settings.sql)
migration moves delivery-area pricing, COD area eligibility, and payment
accounts to synced public tables managed from the AlhaqFM app. Apply the
desktop app's `database/supabase/migrations/0023_storefront_checkout_settings.sql`
first (do not apply the desktop app's full `schema.sql` bundle to an existing
project), then apply migration `003`; it backfills the existing storefront
settings and keeps the checkout views and server-side validation compatible. Thereafter use the
desktop app's HQ-only **Settings → Storefront checkout** tab to make changes.

See [`supabase/README.md`](./supabase/README.md) for migration details.

## Shared Supabase architecture

The storefront shares the desktop app's Supabase project and live catalog.
Its settings, safe catalog views, rate-limit data, and RPCs are isolated in the
`storefront` schema; `public.web_orders` remains shared so the desktop app can
process website orders. Configure `storefront` under Supabase API → Exposed
schemas after applying approved SQL. This schema boundary reduces cross-app
schema and permission conflicts, but it does not isolate a project-wide outage
or resource exhaustion. The storefront must never run migrations automatically.
