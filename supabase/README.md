# Storefront Supabase Migrations

These migration files implement the storefront's delivery, COD, payment,
checkout, tracking, and rate-limiting database features. Apply them to the
shared Supabase project in the documented order after reviewing compatibility
with the live schema.

## Files

Apply in numeric order after reviewing against a backup or staging database:

1. **002_delivery_settings.sql** - Delivery areas, zones, rates, and free delivery threshold
2. **003_cod_settings.sql** - Cash on Delivery settings (on/off, limits, restrictions)
3. **004_payment_account_settings.sql** - EasyPaisa/JazzCash account details and QR codes
4. **005_web_order_creation_rpc.sql** - Server-only quote/order RPCs and transfer receipt hashes
5. **006_public_order_tracking.sql** - Server-only order tracking with minimized customer data
6. **007_anon_read_policies.sql** - Safe storefront views for product, category, branch, and stock data
7. **008_checkout_rate_limiting.sql** - Server-only hashed checkout, quote, and tracking limits

After those migrations, apply the tracked follow-on migrations in this order:

1. **202611010001_customer_wishlist_order_history.sql** - Private customer wishlist and signed-in order association
2. **202611010002_branch_delivery_areas.sql** - Branch-linked delivery-area records; backfills existing `allowed_cities` values

## Checkout prerequisites

- Review and back up the existing Supabase schema before applying migrations.
- Checkout and tracking need `002`–`008`, in numeric order.
- Apply the two follow-on migrations above after `002`–`008`. The delivery-area migration uses the UUID primary key in `public.branches` and preserves the existing checkout view/API shape.
- Add `storefront` to Supabase Project Settings → API → Exposed schemas after the migrations, then reload the API schema cache. The migrations grant schema usage but do not change dashboard exposure settings.
- `005_web_order_creation_rpc.sql` creates a unique index on `web_orders.order_number`; check for existing duplicate order numbers before applying it.
- The private `web-order-payment-proofs` Storage bucket must exist and remain private. The desktop app reads proofs from this bucket.
- The server limits order attempts to five per phone hash and twenty per IP hash per hour, and quote requests to 120 per IP hash per hour. Only HMAC hashes are stored.
- Order tracking is served through a server-only RPC and limited to 30 requests per IP hash per hour. Its response excludes customer name, phone, delivery address, payment reference, and internal event notes.
- Configure at least one branch's delivery settings, eligible COD settings, and/or an enabled payment account. Options without active settings are not offered.
- Delivery areas are stored in `storefront.storefront_delivery_areas`, linked to `public.branches.id`; existing branch area arrays are copied during migration. The `storefront_delivery_areas_hq_admin` RLS policy allows authenticated HQ admins to manage those rows.
- Configure Cloudflare Turnstile and server-only secrets in the storefront environment. Never put the Supabase service-role key or checkout hash secret in a browser variable.
- Supabase tax preferences are local-only in the desktop app. The storefront uses each product's tax rate and the desktop-compatible inclusive, per-line calculation; non-default local tax preferences are not synchronized.

Do not run the SQL automatically from the storefront. Apply the reviewed files through the Supabase SQL Editor or the project's migration workflow.

## Shared app/storefront database

The storefront intentionally uses the same Supabase project as the desktop app
for live catalog, inventory and `web_orders` compatibility. New storefront
settings, rate-limit data, views, and RPCs are placed in the dedicated
`storefront` schema. The existing public catalog, stock ledger, and web-order
tables are read or written only where sharing is required. Migration `005`
adds payment-review/proof columns and an order-number index to the shared
`public.web_orders` table; review that change against the desktop app before
applying it.

The schema boundary reduces naming, permissions, and migration conflicts, but
does not provide infrastructure isolation: database-wide outages, locks, or
resource exhaustion can affect both clients. A separate Supabase project would
require an explicit sync service and changes to the desktop app and is not part
of this storefront-only scope.

## Important stock limitation

The order RPC locks products and accounts for active, unpacked web orders when checking storefront stock. The desktop app does not account for these web reservations during POS sales, so simultaneous storefront and POS orders can still oversell. Preventing that requires a coordinated desktop-app change, which is outside the authorized storefront-only scope.

The implemented migrations are not a guarantee of compatibility with every
live database. Validate them against a backup/staging project and the deployed
desktop schema before production use.
