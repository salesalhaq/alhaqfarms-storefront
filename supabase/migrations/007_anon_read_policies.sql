-- Read-only storefront views over the desktop app's public schema.
-- Do not grant the anon role access to the underlying stock ledger or cost data.

CREATE OR REPLACE VIEW storefront.storefront_branches_view AS
SELECT id, code, name, address, phone, is_default
FROM public.branches
WHERE is_active = true AND deleted_at IS NULL;

CREATE OR REPLACE VIEW storefront.storefront_categories_view AS
SELECT id, name, description, sort_order
FROM public.categories
WHERE is_active = true AND deleted_at IS NULL;

CREATE OR REPLACE VIEW storefront.product_catalog_view AS
SELECT
  product.id,
  product.category_id,
  category.name AS category_name,
  product.name,
  product.sku,
  product.unit_code,
  product.price_paisa,
  product.on_sale,
  product.discounted_price_paisa,
  product.tax_rate_bps,
  product.image_path,
  product.is_active
FROM public.products AS product
LEFT JOIN public.categories AS category
  ON category.id = product.category_id
  AND category.is_active = true
  AND category.deleted_at IS NULL
WHERE product.is_active = true AND product.deleted_at IS NULL;

CREATE OR REPLACE VIEW storefront.branch_stock_view AS
WITH ledger AS (
  SELECT branch_id, product_id, SUM(quantity_delta_milli) AS quantity_milli
  FROM public.stock_movements
  WHERE deleted_at IS NULL
  GROUP BY branch_id, product_id
),
reservations AS (
  SELECT order_row.branch_id, item.product_id, SUM(item.quantity_milli) AS quantity_milli
  FROM public.web_orders AS order_row
  JOIN public.web_order_items AS item ON item.order_id = order_row.id
  WHERE order_row.deleted_at IS NULL
    AND item.deleted_at IS NULL
    AND order_row.status NOT IN ('cancelled', 'delivered')
    AND order_row.stock_deducted_at IS NULL
    AND COALESCE(order_row.payment_review_status, 'none') <> 'rejected'
    AND item.product_id IS NOT NULL
  GROUP BY order_row.branch_id, item.product_id
)
SELECT
  branch.id AS branch_id,
  product.id AS product_id,
  COALESCE(ledger.quantity_milli, 0) - COALESCE(reservations.quantity_milli, 0) AS stock_milli
FROM public.branches AS branch
CROSS JOIN public.products AS product
LEFT JOIN ledger
  ON ledger.branch_id = branch.id AND ledger.product_id = product.id
LEFT JOIN reservations
  ON reservations.branch_id = branch.id AND reservations.product_id = product.id
WHERE branch.is_active = true
  AND branch.deleted_at IS NULL
  AND product.is_active = true
  AND product.deleted_at IS NULL;

GRANT SELECT ON storefront.storefront_branches_view TO anon, authenticated;
GRANT SELECT ON storefront.storefront_categories_view TO anon, authenticated;
GRANT SELECT ON storefront.product_catalog_view TO anon, authenticated;
GRANT SELECT ON storefront.branch_stock_view TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
