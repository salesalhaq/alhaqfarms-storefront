-- Make synced category images available to the public storefront catalog.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_path TEXT;

CREATE OR REPLACE VIEW storefront.storefront_categories_view AS
SELECT id, name, description, sort_order, image_path
FROM public.categories
WHERE is_active = true AND deleted_at IS NULL;

GRANT SELECT ON storefront.storefront_categories_view TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
