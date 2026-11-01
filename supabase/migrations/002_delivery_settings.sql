-- Delivery settings for web orders
-- Per-branch delivery charge and free delivery threshold
-- Each branch serves its own area only

CREATE SCHEMA IF NOT EXISTS storefront;
REVOKE CREATE ON SCHEMA storefront FROM PUBLIC;
GRANT USAGE ON SCHEMA storefront TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS storefront.storefront_delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  allowed_cities TEXT[] NOT NULL DEFAULT '{}',
  delivery_charge_paisa INTEGER NOT NULL CHECK (delivery_charge_paisa >= 0),
  free_delivery_threshold_paisa INTEGER NOT NULL DEFAULT 500000 CHECK (free_delivery_threshold_paisa >= 0), -- Rs 5,000 default
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id)
);

ALTER TABLE storefront.storefront_delivery_settings
  ADD COLUMN IF NOT EXISTS allowed_cities TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS ix_storefront_delivery_settings_server_updated ON storefront.storefront_delivery_settings(server_updated_at);
CREATE INDEX IF NOT EXISTS ix_storefront_delivery_settings_deleted ON storefront.storefront_delivery_settings(deleted_at) WHERE deleted_at IS NOT NULL;

-- Enable RLS
ALTER TABLE storefront.storefront_delivery_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "storefront_delivery_settings_authenticated_read" ON storefront.storefront_delivery_settings;
DROP POLICY IF EXISTS "storefront_delivery_settings_admin_read" ON storefront.storefront_delivery_settings;
CREATE POLICY "storefront_delivery_settings_admin_read" ON storefront.storefront_delivery_settings
  FOR SELECT TO authenticated USING (public.is_hq_admin());

DROP POLICY IF EXISTS "storefront_delivery_settings_admin_write" ON storefront.storefront_delivery_settings;
CREATE POLICY "storefront_delivery_settings_admin_write" ON storefront.storefront_delivery_settings
  FOR ALL TO authenticated
  USING (public.is_hq_admin())
  WITH CHECK (public.is_hq_admin());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON storefront.storefront_delivery_settings TO authenticated;

CREATE OR REPLACE VIEW storefront.storefront_delivery_settings_view AS
SELECT branch_id, allowed_cities, delivery_charge_paisa, free_delivery_threshold_paisa
FROM storefront.storefront_delivery_settings
WHERE is_enabled = true AND deleted_at IS NULL;

GRANT SELECT ON storefront.storefront_delivery_settings_view TO anon, authenticated;

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
  WHERE branch_id = p_branch_id
    AND settings.is_enabled = true
    AND settings.deleted_at IS NULL;

  IF NOT FOUND OR p_city IS NULL OR NOT EXISTS (
    SELECT 1
    FROM unnest(v_settings.allowed_cities) AS allowed(city)
    WHERE lower(btrim(allowed.city)) = lower(btrim(p_city))
  ) THEN
    RAISE EXCEPTION 'Delivery is unavailable for this branch and city.';
  END IF;

  IF p_order_total_paisa >= v_settings.free_delivery_threshold_paisa THEN
    RETURN 0;
  END IF;

  RETURN v_settings.delivery_charge_paisa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, storefront;

REVOKE ALL ON FUNCTION storefront.storefront_get_delivery_charge(UUID, TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_get_delivery_charge(UUID, TEXT, BIGINT) TO service_role;
