ALTER TABLE public.web_orders
  ADD COLUMN IF NOT EXISTS customer_user_id UUID
    REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_web_orders_customer_user_created
  ON public.web_orders (customer_user_id, created_at DESC)
  WHERE customer_user_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS storefront.storefront_customer_wishlist (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE storefront.storefront_customer_wishlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE storefront.storefront_customer_wishlist
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE storefront.storefront_customer_wishlist
  TO service_role;

CREATE OR REPLACE FUNCTION storefront.storefront_create_web_order_for_customer(
  p_idempotency_key UUID,
  p_order_number TEXT,
  p_branch_id UUID,
  p_fulfillment_type TEXT,
  p_city TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_delivery_address TEXT,
  p_payment_method TEXT,
  p_payment_reference TEXT,
  p_payment_amount_paisa BIGINT,
  p_payment_proof_path TEXT,
  p_payment_reference_hash TEXT,
  p_screenshot_sha256 TEXT,
  p_items JSONB,
  p_notes TEXT,
  p_customer_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storefront
AS $$
DECLARE
  v_result JSONB;
  v_existing_user_id UUID;
BEGIN
  IF p_customer_user_id IS NULL THEN
    RAISE EXCEPTION 'A signed-in customer is required.';
  END IF;

  v_result := storefront.storefront_create_web_order(
    p_idempotency_key,
    p_order_number,
    p_branch_id,
    p_fulfillment_type,
    p_city,
    p_customer_name,
    p_customer_phone,
    p_delivery_address,
    p_payment_method,
    p_payment_reference,
    p_payment_amount_paisa,
    p_payment_proof_path,
    p_payment_reference_hash,
    p_screenshot_sha256,
    p_items,
    p_notes
  );

  IF COALESCE((v_result->>'duplicate')::BOOLEAN, false) THEN
    SELECT customer_user_id
      INTO v_existing_user_id
      FROM public.web_orders
     WHERE id = p_idempotency_key
       AND deleted_at IS NULL;

    IF NOT FOUND OR v_existing_user_id IS DISTINCT FROM p_customer_user_id THEN
      RAISE EXCEPTION 'This checkout attempt cannot be reused by this account.';
    END IF;
  ELSE
    UPDATE public.web_orders
       SET customer_user_id = p_customer_user_id
     WHERE id = p_idempotency_key
       AND deleted_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'The order could not be linked to this account.';
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION storefront.storefront_create_web_order_for_customer(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT,
  TEXT, TEXT, TEXT, JSONB, TEXT, UUID
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION storefront.storefront_create_web_order_for_customer(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT,
  TEXT, TEXT, TEXT, JSONB, TEXT, UUID
) TO service_role;

NOTIFY pgrst, 'reload schema';
