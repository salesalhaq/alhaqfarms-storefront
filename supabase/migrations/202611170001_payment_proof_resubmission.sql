-- Customers can replace a rejected wallet receipt from the public tracking page.
-- Everything here is server-only: the storefront API verifies the order number
-- and phone before calling these RPCs, and staff still review the new receipt.

CREATE OR REPLACE FUNCTION storefront.storefront_track_order(
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
  v_items JSONB;
  v_events JSONB;
BEGIN
  IF p_order_number IS NULL
     OR p_order_number !~ '^WEB-[0-9]{12}-[0-9A-F]{6}$'
     OR p_customer_phone IS NULL
     OR p_customer_phone !~ '^\+923[0-9]{9}$' THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  SELECT
    wo.id,
    wo.order_number,
    wo.status,
    wo.fulfillment_type,
    wo.payment_status,
    wo.payment_review_status,
    wo.payment_rejection_reason,
    wo.total_paisa,
    wo.created_at,
    b.name AS branch_name
  INTO v_order
  FROM public.web_orders AS wo
  LEFT JOIN public.branches AS b ON b.id = wo.branch_id
  WHERE wo.order_number = p_order_number
    AND wo.customer_phone = p_customer_phone
    AND wo.deleted_at IS NULL
  LIMIT 1;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'productName', item.product_name,
        'unitCode', item.unit_code,
        'quantityMilli', item.quantity_milli,
        'unitPricePaisa', item.unit_price_paisa,
        'lineTotalPaisa', item.line_total_paisa
      )
      ORDER BY item.line_number
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM public.web_order_items AS item
  WHERE item.order_id = v_order.id
    AND item.deleted_at IS NULL;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'eventType', event_row.event_type,
        'previousStatus', event_row.previous_status,
        'nextStatus', event_row.next_status,
        'occurredAt', event_row.occurred_at
      )
      ORDER BY event_row.occurred_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_events
  FROM (
    SELECT event_type, previous_status, next_status, occurred_at
    FROM public.web_order_events
    WHERE order_id = v_order.id
      AND deleted_at IS NULL
    ORDER BY occurred_at DESC
    LIMIT 10
  ) AS event_row;

  RETURN jsonb_build_object(
    'orderNumber', v_order.order_number,
    'status', v_order.status,
    'fulfillmentType', v_order.fulfillment_type,
    'paymentStatus', v_order.payment_status,
    'paymentReviewStatus', COALESCE(v_order.payment_review_status, 'none'),
    'paymentRejectionReason', v_order.payment_rejection_reason,
    'totalPaisa', v_order.total_paisa,
    'createdAt', v_order.created_at,
    'branchName', v_order.branch_name,
    'items', v_items,
    'events', v_events
  );
END;
$$;

REVOKE ALL ON FUNCTION storefront.storefront_track_order(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_track_order(TEXT, TEXT) TO service_role;

-- Rolling per-IP limit for receipt resubmission attempts.
CREATE TABLE IF NOT EXISTS storefront.storefront_resubmit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL CHECK (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_storefront_resubmit_attempts_ip_date
  ON storefront.storefront_resubmit_attempts (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_storefront_resubmit_attempts_created_at
  ON storefront.storefront_resubmit_attempts (created_at);

ALTER TABLE storefront.storefront_resubmit_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE storefront.storefront_resubmit_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE storefront.storefront_resubmit_attempts TO service_role;

CREATE OR REPLACE FUNCTION storefront.consume_storefront_resubmit_attempt(
  p_ip_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storefront
AS $$
DECLARE
  v_count INTEGER;
  v_lock BIGINT;
BEGIN
  IF p_ip_hash IS NULL OR p_ip_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Receipt resubmission could not be verified.';
  END IF;

  v_lock := hashtextextended('resubmit:' || p_ip_hash, 0);
  PERFORM pg_advisory_xact_lock(v_lock);

  DELETE FROM storefront.storefront_resubmit_attempts
  WHERE created_at < now() - INTERVAL '2 days';

  SELECT count(*) INTO v_count
  FROM storefront.storefront_resubmit_attempts
  WHERE ip_hash = p_ip_hash
    AND created_at >= now() - INTERVAL '1 hour';

  IF v_count >= 10 THEN
    RAISE EXCEPTION 'Too many receipt resubmissions. Please try again later.';
  END IF;

  INSERT INTO storefront.storefront_resubmit_attempts (ip_hash)
  VALUES (p_ip_hash);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION storefront.consume_storefront_resubmit_attempt(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.consume_storefront_resubmit_attempt(TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION storefront.storefront_resubmit_payment_proof(
  p_order_number TEXT,
  p_customer_phone TEXT,
  p_payment_reference TEXT,
  p_payment_proof_path TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storefront
AS $$
DECLARE
  v_order RECORD;
  v_reference TEXT := upper(btrim(coalesce(p_payment_reference, '')));
  v_path TEXT := btrim(coalesce(p_payment_proof_path, ''));
  v_attempts INTEGER;
BEGIN
  IF p_order_number IS NULL
     OR p_order_number !~ '^WEB-[0-9]{12}-[0-9A-F]{6}$'
     OR p_customer_phone IS NULL
     OR p_customer_phone !~ '^\+923[0-9]{9}$' THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  IF v_reference !~ '^[A-Z0-9._/-]{3,100}$' THEN
    RETURN jsonb_build_object('error', 'invalid_reference');
  END IF;

  SELECT id, branch_id, order_number, status, payment_method, payment_status,
         payment_review_status
  INTO v_order
  FROM public.web_orders
  WHERE order_number = p_order_number
    AND customer_phone = p_customer_phone
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;
  IF v_order.payment_method NOT IN ('easypaisa', 'jazzcash') THEN
    RETURN jsonb_build_object('error', 'not_wallet');
  END IF;
  IF v_order.status IN ('cancelled', 'delivered') OR v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object('error', 'closed');
  END IF;
  IF coalesce(v_order.payment_review_status, 'none') <> 'rejected' THEN
    RETURN jsonb_build_object('error', 'not_rejected');
  END IF;

  IF v_path = ''
     OR length(v_path) > 300
     OR v_path !~ '^[0-9a-f-]{36}/WEB-[0-9]{12}-[0-9A-F]{6}/receipt-[0-9a-f-]{36}\.jpg$'
     OR split_part(v_path, '/', 1) <> v_order.branch_id::text
     OR split_part(v_path, '/', 2) <> v_order.order_number THEN
    RETURN jsonb_build_object('error', 'invalid_proof');
  END IF;

  SELECT count(*) INTO v_attempts
  FROM public.web_order_events
  WHERE order_id = v_order.id
    AND event_type = 'payment_resubmitted'
    AND deleted_at IS NULL;

  IF v_attempts >= 5 THEN
    RETURN jsonb_build_object('error', 'too_many_resubmissions');
  END IF;

  UPDATE public.web_orders
  SET payment_reference = v_reference,
      payment_proof_path = v_path,
      payment_status = 'pending_verification',
      payment_review_status = 'awaiting_review',
      payment_rejection_reason = NULL,
      payment_rejected_by = NULL,
      payment_rejected_at = NULL,
      updated_at = now()
  WHERE id = v_order.id
    AND coalesce(payment_review_status, 'none') = 'rejected';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_rejected');
  END IF;

  INSERT INTO public.web_order_events (
    id, order_id, branch_id, actor_id, event_type, previous_status, next_status,
    payment_reference, notes, occurred_at, created_at
  ) VALUES (
    gen_random_uuid(), v_order.id, v_order.branch_id, NULL, 'payment_resubmitted',
    v_order.status, v_order.status, v_reference,
    'Customer uploaded a corrected payment receipt.', now(), now()
  );

  RETURN jsonb_build_object(
    'orderNumber', v_order.order_number,
    'paymentStatus', 'pending_verification',
    'paymentReviewStatus', 'awaiting_review'
  );
END;
$$;

REVOKE ALL ON FUNCTION storefront.storefront_resubmit_payment_proof(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_resubmit_payment_proof(TEXT, TEXT, TEXT, TEXT)
  TO service_role;

NOTIFY pgrst, 'reload schema';
