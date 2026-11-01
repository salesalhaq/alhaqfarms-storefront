-- Payment account settings for EasyPaisa and JazzCash
-- Stores account details, instructions, and QR codes for manual transfers

CREATE TABLE IF NOT EXISTS storefront.storefront_payment_account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('easypaisa', 'jazzcash')),
  account_title TEXT NOT NULL,
  account_number TEXT NOT NULL,
  instructions TEXT,
  qr_code_data_url TEXT, -- Base64 data URL for QR code image
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  server_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_storefront_payment_account_settings_method ON storefront.storefront_payment_account_settings(payment_method);

-- Enable RLS
ALTER TABLE storefront.storefront_payment_account_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "storefront_payment_account_settings_authenticated_read" ON storefront.storefront_payment_account_settings;
DROP POLICY IF EXISTS "storefront_payment_account_settings_admin_read" ON storefront.storefront_payment_account_settings;
CREATE POLICY "storefront_payment_account_settings_admin_read" ON storefront.storefront_payment_account_settings
  FOR SELECT TO authenticated USING (public.is_hq_admin());

DROP POLICY IF EXISTS "storefront_payment_account_settings_admin_write" ON storefront.storefront_payment_account_settings;
CREATE POLICY "storefront_payment_account_settings_admin_write" ON storefront.storefront_payment_account_settings
  FOR ALL TO authenticated
  USING (public.is_hq_admin())
  WITH CHECK (public.is_hq_admin());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON storefront.storefront_payment_account_settings TO authenticated;

CREATE OR REPLACE VIEW storefront.storefront_payment_accounts_view AS
SELECT payment_method, account_title, account_number, instructions, qr_code_data_url
FROM storefront.storefront_payment_account_settings
WHERE is_enabled = true;

GRANT SELECT ON storefront.storefront_payment_accounts_view TO anon, authenticated;

CREATE OR REPLACE FUNCTION storefront.storefront_get_payment_account_details(p_payment_method TEXT)
RETURNS TABLE (
  account_title TEXT,
  account_number TEXT,
  instructions TEXT,
  qr_code_data_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    account_title,
    account_number,
    instructions,
    qr_code_data_url
  FROM storefront.storefront_payment_account_settings
  WHERE payment_method = p_payment_method
    AND is_enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, storefront;

REVOKE ALL ON FUNCTION storefront.storefront_get_payment_account_details(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_get_payment_account_details(TEXT) TO service_role;
