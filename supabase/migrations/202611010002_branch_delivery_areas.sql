-- Store delivery areas as branch-linked records instead of an array on settings.
-- public.branches.id is the UUID primary key shared with the AlhaqFM app.

CREATE TABLE IF NOT EXISTS storefront.storefront_delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL CHECK (length(btrim(area_name)) BETWEEN 1 AND 120),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_storefront_delivery_areas_branch_order
  ON storefront.storefront_delivery_areas (branch_id, sort_order, area_name)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_storefront_delivery_areas_branch_name
  ON storefront.storefront_delivery_areas (branch_id, lower(btrim(area_name)))
  WHERE deleted_at IS NULL;

ALTER TABLE storefront.storefront_delivery_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "storefront_delivery_areas_hq_admin" ON storefront.storefront_delivery_areas;
CREATE POLICY "storefront_delivery_areas_hq_admin"
  ON storefront.storefront_delivery_areas
  FOR ALL TO authenticated
  USING (public.is_hq_admin())
  WITH CHECK (public.is_hq_admin());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON storefront.storefront_delivery_areas TO authenticated;

-- Preserve the existing configured areas when upgrading from the array field.
INSERT INTO storefront.storefront_delivery_areas (branch_id, area_name)
SELECT DISTINCT ON (settings.branch_id, lower(btrim(area.name)))
       settings.branch_id,
       btrim(area.name)
FROM storefront.storefront_delivery_settings AS settings
CROSS JOIN LATERAL unnest(settings.allowed_cities) AS area(name)
WHERE settings.deleted_at IS NULL
  AND btrim(area.name) <> ''
ORDER BY settings.branch_id, lower(btrim(area.name)), btrim(area.name)
ON CONFLICT DO NOTHING;

-- Keep the existing storefront API shape while sourcing its options from rows.
CREATE OR REPLACE VIEW storefront.storefront_delivery_settings_view AS
SELECT
  settings.branch_id,
  COALESCE(
    array_agg(area.area_name ORDER BY area.sort_order, area.area_name)
      FILTER (WHERE area.id IS NOT NULL),
    '{}'::TEXT[]
  ) AS allowed_cities,
  settings.delivery_charge_paisa,
  settings.free_delivery_threshold_paisa
FROM storefront.storefront_delivery_settings AS settings
LEFT JOIN storefront.storefront_delivery_areas AS area
  ON area.branch_id = settings.branch_id
  AND area.is_active = true
  AND area.deleted_at IS NULL
WHERE settings.is_enabled = true
  AND settings.deleted_at IS NULL
GROUP BY
  settings.branch_id,
  settings.delivery_charge_paisa,
  settings.free_delivery_threshold_paisa;

CREATE OR REPLACE FUNCTION storefront.storefront_get_delivery_charge(
  p_branch_id UUID,
  p_city TEXT,
  p_order_total_paisa BIGINT
)
RETURNS INTEGER AS $$
DECLARE
  v_settings storefront.storefront_delivery_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_settings
  FROM storefront.storefront_delivery_settings AS settings
  WHERE settings.branch_id = p_branch_id
    AND settings.is_enabled = true
    AND settings.deleted_at IS NULL;

  IF NOT FOUND OR p_city IS NULL OR NOT EXISTS (
    SELECT 1
    FROM storefront.storefront_delivery_areas AS area
    WHERE area.branch_id = p_branch_id
      AND area.is_active = true
      AND area.deleted_at IS NULL
      AND lower(btrim(area.area_name)) = lower(btrim(p_city))
  ) THEN
    RAISE EXCEPTION 'Delivery is unavailable for this branch and area.';
  END IF;

  IF p_order_total_paisa >= v_settings.free_delivery_threshold_paisa THEN
    RETURN 0;
  END IF;

  RETURN v_settings.delivery_charge_paisa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, storefront;

REVOKE ALL ON FUNCTION storefront.storefront_get_delivery_charge(UUID, TEXT, BIGINT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_get_delivery_charge(UUID, TEXT, BIGINT)
  TO service_role;

NOTIFY pgrst, 'reload schema';
