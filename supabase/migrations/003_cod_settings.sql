-- Cash on Delivery (COD) settings
-- Per-branch COD availability, limits, and restrictions

CREATE TABLE IF NOT EXISTS storefront.storefront_cod_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  allowed_cities TEXT[],
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  max_order_amount_paisa INTEGER CHECK (max_order_amount_paisa IS NULL OR max_order_amount_paisa >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id)
);

ALTER TABLE storefront.storefront_cod_settings
  ADD COLUMN IF NOT EXISTS allowed_cities TEXT[];

CREATE INDEX IF NOT EXISTS ix_storefront_cod_settings_server_updated ON storefront.storefront_cod_settings(server_updated_at);
CREATE INDEX IF NOT EXISTS ix_storefront_cod_settings_deleted ON storefront.storefront_cod_settings(deleted_at) WHERE deleted_at IS NOT NULL;

-- Enable RLS
ALTER TABLE storefront.storefront_cod_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "storefront_cod_settings_authenticated_read" ON storefront.storefront_cod_settings;
DROP POLICY IF EXISTS "storefront_cod_settings_admin_read" ON storefront.storefront_cod_settings;
CREATE POLICY "storefront_cod_settings_admin_read" ON storefront.storefront_cod_settings
  FOR SELECT TO authenticated USING (public.is_hq_admin());

DROP POLICY IF EXISTS "storefront_cod_settings_admin_write" ON storefront.storefront_cod_settings;
CREATE POLICY "storefront_cod_settings_admin_write" ON storefront.storefront_cod_settings
  FOR ALL TO authenticated
  USING (public.is_hq_admin())
  WITH CHECK (public.is_hq_admin());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON storefront.storefront_cod_settings TO authenticated;

CREATE OR REPLACE VIEW storefront.storefront_cod_settings_view AS
SELECT branch_id, allowed_cities, is_enabled, max_order_amount_paisa
FROM storefront.storefront_cod_settings
WHERE is_enabled = true AND deleted_at IS NULL;

GRANT SELECT ON storefront.storefront_cod_settings_view TO anon, authenticated;

CREATE OR REPLACE FUNCTION storefront.storefront_is_cod_available(
  p_branch_id UUID,
  p_city TEXT,
  p_order_total_paisa BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_settings storefront.storefront_cod_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_settings
  FROM storefront.storefront_cod_settings
  WHERE branch_id = p_branch_id
    AND is_enabled = true
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_settings.allowed_cities IS NOT NULL
     AND cardinality(v_settings.allowed_cities) > 0
     AND (p_city IS NULL OR NOT EXISTS (
       SELECT 1
       FROM unnest(v_settings.allowed_cities) AS allowed(city)
       WHERE lower(btrim(allowed.city)) = lower(btrim(p_city))
     )) THEN
    RETURN false;
  END IF;

  IF v_settings.max_order_amount_paisa IS NOT NULL
     AND p_order_total_paisa > v_settings.max_order_amount_paisa THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, storefront;

REVOKE ALL ON FUNCTION storefront.storefront_is_cod_available(UUID, TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_is_cod_available(UUID, TEXT, BIGINT) TO service_role;
