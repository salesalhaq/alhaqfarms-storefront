# Storefront Development - Phase 1 In Progress

## Status: Build & Cloudflare Setup

### 1. ✅ Step 0: Desktop App Inspection & Supabase Proposals

**Proposed SQL files created in `E:\Storefront\supabase-proposed/`:**
- `001_public_brand_settings.sql` - Public brand settings view
- `002_delivery_settings.sql` - **UPDATED:** Per-branch delivery charge & free threshold
- `003_cod_settings.sql` - **UPDATED:** Per-branch COD settings
- `004_payment_account_settings.sql` - EasyPaisa/JazzCash account details
- `005_web_order_creation_rpc.sql` - Secure order creation RPC
- `006_public_order_tracking.sql` - Public order tracking
- `007_anon_read_policies.sql` - Anon read access for products/categories

**Key findings from desktop app:**
- Order number format: Uses branch receipt_prefix + timestamp
- Money: Integer paisa (100 paisa = 1 Rs)
- Quantities: Integer milli-units (10,000 milli = 1 base unit)
- Order statuses: pending, accepted, packed, dispatched, delivered, cancelled
- Payment statuses: unpaid, pending_verification, paid, refunded
- Payment methods: cash_on_delivery, easypaisa, jazzcash, pay_at_store
- Brand settings in local SQLite (NOT synced to Supabase - needs migration)

### 2. ✅ Next.js Project Structure Created

**Tech stack configured:**
- Next.js 15 (App Router)
- React 18
- TypeScript (strict mode)
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)
- Zod (validation)
- Supabase client
- clsx + tailwind-merge (utility functions)

**Components created:**
- `GlassCard` - Glass morphism card component
- `GlassButton` - Glass morphism button with variants
- `ThemeToggle` - Light/dark + glass theme switcher (Ocean, Emerald, Midnight, Sunset)
- `Navbar` - Sticky glass navbar with mobile menu
- `Footer` - Footer with links and contact info
- `SectionHeading` - Section heading component
- `Reveal` - Scroll reveal animation component
- `ProductGrid` - Product grid component
- `SearchBar` - Search bar component
- `ShopClient` - Shop page client component

**Pages created:**
- `app/page.tsx` - Home page with hero, categories, best sellers, services, founder, trust badges
- `app/shop/page.tsx` - Shop page with category filters, search, product grid
- Additional pages: contact, delivery, privacy, terms, returns, track (skeleton)

**Utility functions:**
- `lib/utils.ts` - cn(), formatPaisa(), formatMilliQuantity()
- `lib/supabase.ts` - Supabase client initialization
- `lib/types.ts` - TypeScript interfaces
- `lib/catalog.ts` - Sample catalog data (fake products for dev)
- `lib/brand.ts` - Brand settings with glass theme support
- `content/site.ts` - Site content from storefront-content.md

**Styling:**
- `app/globals.css` - Glass morphism CSS variables, dark theme base
- `tailwind.config.ts` - Custom glass colors, backdrop blur config

### 3. ⏳ Cloudflare Adapter Added

**Files created:**
- `wrangler.jsonc` - Cloudflare Workers configuration
- `open-next.config.ts` - OpenNext adapter configuration
- `package.json` - Updated with Cloudflare scripts and dependencies

**Dependencies to install:**
```bash
npm install -D @opennextjs/cloudflare wrangler
```

## Current Tasks

### User Actions Required:

1. **Apply SQL files to Supabase:**
   - Open your Supabase project's SQL Editor
   - Run each file in order (001-007) from `E:\Storefront\supabase-proposed\`

2. **Install Cloudflare dependencies:**
   ```bash
   cd E:\Storefront
   npm install
   ```

3. **Test local build:**
   ```bash
   npm run build
   ```

4. **Test local dev server:**
   ```bash
   npm run dev
   ```

5. **Take screenshots:**
   - Home page (light/dark, 2 themes, mobile/desktop)
   - Shop page (light/dark, 2 themes, mobile/desktop)

## Deployment Strategy

**Phase 1:** Build and test on `shop.alhaqfarms.com.pk` (subdomain)
**Phase 3:** After testing complete, switch main domain `alhaqfarms.com.pk` to Cloudflare Workers
**Final:** Retire old InfinityFree hosting

## Phase 2 (Pending)

Once Phase 1 is tested and approved:
1. Connect to Supabase for real data (replace sample catalog)
2. Product detail page with scrollytelling
3. Cart drawer with animations
4. Checkout flow (5 steps)
5. Payment integration (EasyPaisa, JazzCash with receipt upload, COD)
6. Order confirmation

## Phase 3 (Pending)

1. Order tracking page
2. Contact page with form
3. Static pages (Privacy, Terms, Delivery, Returns - draft simple versions)
4. Urdu language support with RTL
5. SEO optimization (metadata, sitemap, robots.txt, Open Graph)
6. PWA configuration (manifest, service worker, offline page)
7. Unit tests (calculations, validation, payment rules)
8. E2E tests with Playwright
9. Deploy to Cloudflare production

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Cloudflare secrets (set via `wrangler secret`):
```bash
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```
