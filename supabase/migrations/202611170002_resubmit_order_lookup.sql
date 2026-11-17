-- The resubmit route has to read the order's branch/state before it uploads the
-- corrected receipt (the storage path starts with the branch id). Reading
-- public.web_orders straight from the API with the server key depends on table
-- grants in the public schema, which the storefront never uses anywhere else.
-- This SECURITY DEFINER function keeps the lookup beside the other storefront
-- RPCs and returns only the fields the route needs.

CREATE OR REPLACE FUNCTION storefront.storefront_resubmit_order_state(
  p_order_number TEXT,
  p_customer_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storefront
AS $$
DECLARE
  v_order RECORD;
BEGIN
  IF p_order_number IS NULL
     OR p_order_number !~ '^WEB-[0-9]{12}-[0-9A-F]{6}$'
     OR p_customer_phone IS NULL
     OR p_customer_phone !~ '^\+923[0-9]{9}$' THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT
    wo.branch_id,
    wo.status,
    wo.payment_method,
    wo.payment_status,
    COALESCE(wo.payment_review_status, 'none') AS payment_review_status
  INTO v_order
  FROM public.web_orders AS wo
  WHERE wo.order_number = p_order_number
    AND wo.customer_phone = p_customer_phone
    AND wo.deleted_at IS NULL
  ORDER BY wo.created_at DESC
  LIMIT 1;

  IF v_order.branch_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  RETURN jsonb_build_object(
    'branchId', v_order.branch_id,
    'status', v_order.status,
    'paymentMethod', v_order.payment_method,
    'paymentStatus', v_order.payment_status,
    'paymentReviewStatus', v_order.payment_review_status
  );
END;
$$;

REVOKE ALL ON FUNCTION storefront.storefront_resubmit_order_state(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_resubmit_order_state(TEXT, TEXT)
  TO service_role;

NOTIFY pgrst, 'reload schema';
