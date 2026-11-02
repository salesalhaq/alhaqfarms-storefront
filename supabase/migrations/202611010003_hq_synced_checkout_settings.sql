-- The desktop app's synced public tables are the canonical checkout settings.
-- Apply the regenerated AlhaqFM Supabase schema before this migration.

CREATE UNIQUE INDEX IF NOT EXISTS ux_storefront_delivery_areas_branch_name
  ON public.storefront_delivery_areas (branch_id, lower(btrim(area_name)))
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_storefront_cod_settings_branch
  ON public.storefront_cod_settings (branch_id)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_storefront_cod_areas_setting_area
  ON public.storefront_cod_areas (cod_setting_id, delivery_area_id)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_storefront_payment_accounts_method
  ON public.storefront_payment_accounts (payment_method)
  WHERE deleted_at IS NULL;

INSERT INTO public.storefront_delivery_areas (
  id, branch_id, area_name, delivery_charge_paisa, free_delivery_threshold_paisa,
  sort_order, is_active, created_at, updated_at, deleted_at
)
SELECT area.id, area.branch_id, area.area_name,
       COALESCE(settings.delivery_charge_paisa, 0),
       COALESCE(settings.free_delivery_threshold_paisa, 500000),
       area.sort_order, area.is_active AND COALESCE(settings.is_enabled, true),
       area.created_at, area.updated_at, area.deleted_at
FROM storefront.storefront_delivery_areas AS area
LEFT JOIN storefront.storefront_delivery_settings AS settings
  ON settings.branch_id = area.branch_id
ON CONFLICT DO NOTHING;

INSERT INTO public.storefront_delivery_areas (
  id, branch_id, area_name, delivery_charge_paisa, free_delivery_threshold_paisa,
  sort_order, is_active
)
SELECT gen_random_uuid(), settings.branch_id, btrim(legacy_area.area_name),
       settings.delivery_charge_paisa, settings.free_delivery_threshold_paisa,
       row_number() OVER (PARTITION BY settings.branch_id ORDER BY lower(btrim(legacy_area.area_name)))::INTEGER,
       settings.is_enabled
FROM storefront.storefront_delivery_settings AS settings
CROSS JOIN LATERAL unnest(settings.allowed_cities) AS legacy_area(area_name)
WHERE settings.deleted_at IS NULL
  AND btrim(legacy_area.area_name) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.storefront_delivery_areas AS current_area
    WHERE current_area.branch_id = settings.branch_id
      AND lower(btrim(current_area.area_name)) = lower(btrim(legacy_area.area_name))
      AND current_area.deleted_at IS NULL
  )
  AND NOT EXISTS (
    SELECT 1
    FROM storefront.storefront_delivery_areas AS legacy_area_row
    WHERE legacy_area_row.branch_id = settings.branch_id
      AND lower(btrim(legacy_area_row.area_name)) = lower(btrim(legacy_area.area_name))
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.storefront_cod_settings (
  id, branch_id, is_active, max_order_amount_paisa, notes, created_at, updated_at, deleted_at
)
SELECT id, branch_id, is_enabled, max_order_amount_paisa, notes, created_at, updated_at, deleted_at
FROM storefront.storefront_cod_settings
ON CONFLICT DO NOTHING;

INSERT INTO public.storefront_cod_areas (
  id, branch_id, cod_setting_id, delivery_area_id, is_active
)
SELECT gen_random_uuid(), cod.branch_id, cod.id, area.id, area.is_active
FROM public.storefront_cod_settings AS cod
JOIN storefront.storefront_cod_settings AS legacy_cod
  ON legacy_cod.id = cod.id
JOIN public.storefront_delivery_areas AS area
  ON area.branch_id = cod.branch_id
WHERE cod.deleted_at IS NULL
  AND area.deleted_at IS NULL
  AND (
    legacy_cod.allowed_cities IS NULL
    OR cardinality(legacy_cod.allowed_cities) = 0
    OR EXISTS (
      SELECT 1
      FROM unnest(legacy_cod.allowed_cities) AS allowed(city)
      WHERE lower(btrim(allowed.city)) = lower(btrim(area.area_name))
    )
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.storefront_payment_accounts (
  id, payment_method, account_title, account_number, instructions, qr_code_data_url,
  is_active, created_at, updated_at
)
SELECT id, payment_method, account_title, account_number, instructions, qr_code_data_url,
       is_enabled, updated_at, updated_at
FROM storefront.storefront_payment_account_settings
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "storefront_delivery_settings_admin_write"
  ON storefront.storefront_delivery_settings;
DROP POLICY IF EXISTS "storefront_delivery_areas_hq_admin"
  ON storefront.storefront_delivery_areas;
DROP POLICY IF EXISTS "storefront_cod_settings_admin_write"
  ON storefront.storefront_cod_settings;
DROP POLICY IF EXISTS "storefront_payment_account_settings_admin_write"
  ON storefront.storefront_payment_account_settings;
REVOKE INSERT, UPDATE, DELETE ON storefront.storefront_delivery_settings FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON storefront.storefront_delivery_areas FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON storefront.storefront_cod_settings FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON storefront.storefront_payment_account_settings FROM authenticated;

CREATE OR REPLACE VIEW storefront.storefront_delivery_settings_view AS
SELECT area.branch_id,
       array_agg(area.area_name ORDER BY area.sort_order, area.area_name) AS allowed_cities,
       0::INTEGER AS delivery_charge_paisa,
       0::INTEGER AS free_delivery_threshold_paisa,
       jsonb_agg(jsonb_build_object(
         'area_name', area.area_name,
         'delivery_charge_paisa', area.delivery_charge_paisa,
         'free_delivery_threshold_paisa', area.free_delivery_threshold_paisa
       ) ORDER BY area.sort_order, area.area_name) AS area_settings
FROM public.storefront_delivery_areas AS area
JOIN public.branches AS branch
  ON branch.id = area.branch_id AND branch.is_active = true AND branch.deleted_at IS NULL
WHERE area.is_active = true AND area.deleted_at IS NULL
GROUP BY area.branch_id;

CREATE OR REPLACE VIEW storefront.storefront_cod_settings_view AS
SELECT cod.branch_id,
       array_agg(area.area_name ORDER BY area.sort_order, area.area_name) AS allowed_cities,
       true AS is_enabled,
       cod.max_order_amount_paisa::INTEGER AS max_order_amount_paisa
FROM public.storefront_cod_settings AS cod
JOIN public.storefront_cod_areas AS cod_area
  ON cod_area.cod_setting_id = cod.id
  AND cod_area.branch_id = cod.branch_id
  AND cod_area.is_active = true
  AND cod_area.deleted_at IS NULL
JOIN public.storefront_delivery_areas AS area
  ON area.id = cod_area.delivery_area_id
  AND area.branch_id = cod.branch_id
  AND area.is_active = true
  AND area.deleted_at IS NULL
JOIN public.branches AS branch
  ON branch.id = cod.branch_id AND branch.is_active = true AND branch.deleted_at IS NULL
WHERE cod.is_active = true AND cod.deleted_at IS NULL
GROUP BY cod.branch_id, cod.max_order_amount_paisa;

CREATE OR REPLACE VIEW storefront.storefront_payment_accounts_view AS
SELECT payment_method, account_title, account_number, instructions, qr_code_data_url
FROM public.storefront_payment_accounts
WHERE is_active = true AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION storefront.storefront_get_delivery_charge(
  p_branch_id UUID,
  p_city TEXT,
  p_order_total_paisa BIGINT
)
RETURNS INTEGER AS $$
DECLARE
  v_area public.storefront_delivery_areas%ROWTYPE;
BEGIN
  SELECT area.* INTO v_area
  FROM public.storefront_delivery_areas AS area
  JOIN public.branches AS branch
    ON branch.id = area.branch_id AND branch.is_active = true AND branch.deleted_at IS NULL
  WHERE area.branch_id = p_branch_id
    AND area.is_active = true
    AND area.deleted_at IS NULL
    AND lower(btrim(area.area_name)) = lower(btrim(p_city));

  IF NOT FOUND OR p_city IS NULL THEN
    RAISE EXCEPTION 'Delivery is unavailable for this branch and area.';
  END IF;

  IF p_order_total_paisa >= v_area.free_delivery_threshold_paisa THEN
    RETURN 0;
  END IF;

  RETURN v_area.delivery_charge_paisa::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, storefront;

CREATE OR REPLACE FUNCTION storefront.storefront_is_cod_available(
  p_branch_id UUID,
  p_city TEXT,
  p_order_total_paisa BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_cod public.storefront_cod_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_cod
  FROM public.storefront_cod_settings
  WHERE branch_id = p_branch_id
    AND is_active = true
    AND deleted_at IS NULL;

  IF NOT FOUND OR p_city IS NULL
     OR (v_cod.max_order_amount_paisa IS NOT NULL
         AND p_order_total_paisa > v_cod.max_order_amount_paisa) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.storefront_cod_areas AS cod_area
    JOIN public.storefront_delivery_areas AS area
      ON area.id = cod_area.delivery_area_id
     AND area.branch_id = p_branch_id
     AND area.is_active = true
     AND area.deleted_at IS NULL
    WHERE cod_area.cod_setting_id = v_cod.id
      AND cod_area.branch_id = p_branch_id
      AND cod_area.is_active = true
      AND cod_area.deleted_at IS NULL
      AND lower(btrim(area.area_name)) = lower(btrim(p_city))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, storefront;

CREATE OR REPLACE FUNCTION storefront.storefront_get_payment_account_details(p_payment_method TEXT)
RETURNS TABLE (
  account_title TEXT,
  account_number TEXT,
  instructions TEXT,
  qr_code_data_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT account.account_title, account.account_number, account.instructions, account.qr_code_data_url
  FROM public.storefront_payment_accounts AS account
  WHERE account.payment_method = p_payment_method
    AND account.is_active = true
    AND account.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, storefront;

CREATE OR REPLACE FUNCTION storefront.storefront_sync_payment_account_compatibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storefront
AS $$
BEGIN
  INSERT INTO storefront.storefront_payment_account_settings (
    id, payment_method, account_title, account_number, instructions, qr_code_data_url,
    is_enabled, updated_at
  ) VALUES (
    NEW.id, NEW.payment_method, NEW.account_title, NEW.account_number, NEW.instructions,
    NEW.qr_code_data_url, NEW.is_active AND NEW.deleted_at IS NULL, NEW.updated_at
  )
  ON CONFLICT (payment_method) DO UPDATE SET
    id = EXCLUDED.id,
    account_title = EXCLUDED.account_title,
    account_number = EXCLUDED.account_number,
    instructions = EXCLUDED.instructions,
    qr_code_data_url = EXCLUDED.qr_code_data_url,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS storefront_payment_account_compatibility
  ON public.storefront_payment_accounts;
CREATE TRIGGER storefront_payment_account_compatibility
AFTER INSERT OR UPDATE ON public.storefront_payment_accounts
FOR EACH ROW EXECUTE FUNCTION storefront.storefront_sync_payment_account_compatibility();
REVOKE ALL ON FUNCTION storefront.storefront_sync_payment_account_compatibility()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION storefront.storefront_get_delivery_charge(UUID, TEXT, BIGINT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_get_delivery_charge(UUID, TEXT, BIGINT) TO service_role;
REVOKE ALL ON FUNCTION storefront.storefront_is_cod_available(UUID, TEXT, BIGINT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_is_cod_available(UUID, TEXT, BIGINT) TO service_role;
REVOKE ALL ON FUNCTION storefront.storefront_get_payment_account_details(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_get_payment_account_details(TEXT) TO service_role;
REVOKE ALL ON FUNCTION storefront.storefront_quote_web_order(UUID, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_quote_web_order(UUID, TEXT, TEXT, JSONB)
  TO service_role;

GRANT SELECT ON storefront.storefront_delivery_settings_view TO anon, authenticated;
GRANT SELECT ON storefront.storefront_cod_settings_view TO anon, authenticated;
GRANT SELECT ON storefront.storefront_payment_accounts_view TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
