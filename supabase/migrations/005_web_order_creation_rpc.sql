-- Storefront order RPCs for the desktop app's existing web_orders schema.
-- These functions are callable only with the server-side service role key.

ALTER TABLE public.web_orders
  ADD COLUMN IF NOT EXISTS payment_proof_path TEXT,
  ADD COLUMN IF NOT EXISTS payment_review_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS payment_rejected_by UUID,
  ADD COLUMN IF NOT EXISTS payment_rejected_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS ux_web_orders_order_number
  ON public.web_orders (order_number);

CREATE TABLE IF NOT EXISTS storefront.storefront_web_order_payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.web_orders(id) ON DELETE RESTRICT,
  transaction_hash TEXT NOT NULL UNIQUE CHECK (transaction_hash ~ '^[0-9a-f]{64}$'),
  screenshot_sha256 TEXT NOT NULL UNIQUE CHECK (screenshot_sha256 ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE storefront.storefront_web_order_payment_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE storefront.storefront_web_order_payment_receipts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE storefront.storefront_web_order_payment_receipts TO service_role;

CREATE OR REPLACE FUNCTION storefront.storefront_quote_web_order(
  p_branch_id UUID,
  p_fulfillment_type TEXT,
  p_city TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storefront
AS $$
DECLARE
  v_item JSONB;
  v_product RECORD;
  v_quantity BIGINT;
  v_unit_price BIGINT;
  v_line_total BIGINT;
  v_line_tax BIGINT;
  v_available BIGINT;
  v_reserved BIGINT;
  v_subtotal BIGINT := 0;
  v_tax BIGINT := 0;
  v_delivery_charge INTEGER := 0;
  v_lines JSONB := '[]'::jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Add between 1 and 50 products to the order.';
  END IF;

  IF p_fulfillment_type IS NULL OR p_fulfillment_type NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Choose delivery or branch pickup.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.branches
    WHERE id = p_branch_id AND is_active = true AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'The selected branch is unavailable.';
  END IF;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_items) AS item(value)
  LOOP
    IF COALESCE(v_item->>'quantityMilli', '') !~ '^[1-9][0-9]{0,8}$'
       OR COALESCE(v_item->>'productId', '') !~*
         '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'An order item has an invalid product or quantity.';
    END IF;

    v_quantity := (v_item->>'quantityMilli')::BIGINT;
    SELECT product.id, product.name, product.sku, product.unit_code,
           product.price_paisa, product.on_sale, product.discounted_price_paisa,
           product.tax_rate_bps
      INTO v_product
      FROM public.products AS product
     WHERE product.id = (v_item->>'productId')::UUID
       AND product.is_active = true
       AND product.deleted_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product in this order is unavailable.';
    END IF;

    SELECT COALESCE(SUM(quantity_delta_milli), 0)
      INTO v_available
      FROM public.stock_movements
     WHERE branch_id = p_branch_id
       AND product_id = v_product.id
       AND deleted_at IS NULL;

    SELECT COALESCE(SUM(item.quantity_milli), 0)
      INTO v_reserved
      FROM public.web_orders AS order_row
      JOIN public.web_order_items AS item ON item.order_id = order_row.id
     WHERE order_row.branch_id = p_branch_id
       AND item.product_id = v_product.id
       AND order_row.deleted_at IS NULL
       AND item.deleted_at IS NULL
       AND order_row.status NOT IN ('cancelled', 'delivered')
       AND order_row.stock_deducted_at IS NULL
       AND COALESCE(order_row.payment_review_status, 'none') <> 'rejected';

    IF v_available - v_reserved < v_quantity THEN
      RAISE EXCEPTION 'There is not enough stock at the selected branch.';
    END IF;

    v_unit_price := CASE
      WHEN v_product.on_sale AND v_product.discounted_price_paisa IS NOT NULL
        THEN v_product.discounted_price_paisa
      ELSE v_product.price_paisa
    END;
    v_line_total := round(v_unit_price::NUMERIC * v_quantity / 1000)::BIGINT;
    v_line_tax := round(
      v_line_total::NUMERIC * COALESCE(v_product.tax_rate_bps, 0)
      / (10000 + COALESCE(v_product.tax_rate_bps, 0))
    )::BIGINT;
    v_subtotal := v_subtotal + v_line_total;
    v_tax := v_tax + v_line_tax;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'productId', v_product.id,
      'productName', v_product.name,
      'sku', v_product.sku,
      'unitCode', v_product.unit_code,
      'quantityMilli', v_quantity,
      'unitPricePaisa', v_unit_price,
      'taxRateBps', COALESCE(v_product.tax_rate_bps, 0),
      'taxPaisa', v_line_tax,
      'lineTotalPaisa', v_line_total
    ));
  END LOOP;

  IF p_fulfillment_type = 'delivery' THEN
    v_delivery_charge := storefront.storefront_get_delivery_charge(p_branch_id, p_city, v_subtotal);
  END IF;

  RETURN jsonb_build_object(
    'subtotalPaisa', v_subtotal,
    'taxPaisa', v_tax,
    'deliveryChargePaisa', v_delivery_charge,
    'totalPaisa', v_subtotal + v_delivery_charge,
    'items', v_lines
  );
END;
$$;

CREATE OR REPLACE FUNCTION storefront.storefront_create_web_order(
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
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storefront
AS $$
DECLARE
  v_existing public.web_orders%ROWTYPE;
  v_item JSONB;
  v_product_id UUID;
  v_available BIGINT;
  v_reserved BIGINT;
  v_requested BIGINT;
  v_quote JSONB;
  v_line JSONB;
  v_payment_status TEXT;
  v_payment_review_status TEXT;
  v_notes TEXT;
  v_item_id UUID;
  v_line_number INTEGER := 0;
BEGIN
  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Checkout attempt is invalid. Please try again.';
  END IF;

  SELECT * INTO v_existing
  FROM public.web_orders
  WHERE id = p_idempotency_key AND deleted_at IS NULL;
  IF FOUND THEN
    IF v_existing.customer_phone <> p_customer_phone THEN
      RAISE EXCEPTION 'This checkout attempt cannot be reused.';
    END IF;
    RETURN jsonb_build_object(
      'orderId', v_existing.id,
      'orderNumber', v_existing.order_number,
      'status', v_existing.status,
      'totalPaisa', v_existing.total_paisa,
      'duplicate', true
    );
  END IF;

  IF p_order_number IS NULL OR p_order_number !~ '^WEB-[0-9]{12}-[0-9A-F]{6}$' THEN
    RAISE EXCEPTION 'The order number is invalid.';
  END IF;

  IF p_customer_name IS NULL OR length(btrim(p_customer_name)) NOT BETWEEN 2 AND 160
     OR p_customer_phone !~ '^\+923[0-9]{9}$' THEN
    RAISE EXCEPTION 'Enter a valid name and Pakistan mobile number.';
  END IF;

  IF p_fulfillment_type = 'delivery'
     AND (p_delivery_address IS NULL OR length(btrim(p_delivery_address)) < 5
          OR length(btrim(p_delivery_address)) > 500) THEN
    RAISE EXCEPTION 'Enter a complete delivery address.';
  END IF;

  IF p_notes IS NOT NULL AND length(p_notes) > 500 THEN
    RAISE EXCEPTION 'Order notes are too long.';
  END IF;

  IF p_payment_method IS NULL
     OR p_payment_method NOT IN ('easypaisa', 'jazzcash', 'cash_on_delivery') THEN
    RAISE EXCEPTION 'Choose an available payment method.';
  END IF;

  IF p_payment_method IN ('easypaisa', 'jazzcash') THEN
    IF p_payment_reference IS NULL
       OR p_payment_reference !~ '^[A-Z0-9._/-]{3,100}$'
       OR p_payment_reference_hash IS NULL
       OR p_payment_reference_hash !~ '^[0-9a-f]{64}$'
       OR p_screenshot_sha256 IS NULL
       OR p_screenshot_sha256 !~ '^[0-9a-f]{64}$'
       OR p_payment_proof_path IS NULL
       OR p_payment_proof_path !~ (
         '^' || p_branch_id::TEXT || '/' || p_order_number
         || '/[A-Za-z0-9][A-Za-z0-9._-]{0,119}$'
       )
       OR p_payment_amount_paisa IS NULL THEN
      RAISE EXCEPTION 'Transfer payment details or receipt are incomplete.';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM storefront.storefront_payment_account_settings
      WHERE payment_method = p_payment_method AND is_enabled = true
    ) THEN
      RAISE EXCEPTION 'This transfer method is not enabled.';
    END IF;
  ELSIF p_payment_reference IS NOT NULL OR p_payment_proof_path IS NOT NULL
        OR p_payment_reference_hash IS NOT NULL OR p_screenshot_sha256 IS NOT NULL
        OR p_payment_amount_paisa IS NOT NULL THEN
    RAISE EXCEPTION 'Cash on delivery does not use transfer details.';
  END IF;

  FOR v_product_id IN
    SELECT DISTINCT (value->>'productId')::UUID
    FROM jsonb_array_elements(p_items) AS item(value)
    ORDER BY 1
  LOOP
    PERFORM 1
    FROM public.products
    WHERE id = v_product_id AND is_active = true AND deleted_at IS NULL
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product in this order is unavailable.';
    END IF;

    SELECT COALESCE(SUM(quantity_delta_milli), 0)
      INTO v_available
      FROM public.stock_movements
     WHERE branch_id = p_branch_id
       AND product_id = v_product_id
       AND deleted_at IS NULL;

    SELECT COALESCE(SUM(item.quantity_milli), 0)
      INTO v_reserved
      FROM public.web_orders AS order_row
      JOIN public.web_order_items AS item ON item.order_id = order_row.id
     WHERE order_row.branch_id = p_branch_id
       AND item.product_id = v_product_id
       AND order_row.deleted_at IS NULL
       AND item.deleted_at IS NULL
       AND order_row.status NOT IN ('cancelled', 'delivered')
       AND order_row.stock_deducted_at IS NULL
       AND COALESCE(order_row.payment_review_status, 'none') <> 'rejected';

    SELECT COALESCE(SUM((value->>'quantityMilli')::BIGINT), 0)
      INTO v_requested
      FROM jsonb_array_elements(p_items) AS item(value)
     WHERE (value->>'productId')::UUID = v_product_id;

    IF v_available - v_reserved < v_requested THEN
      RAISE EXCEPTION 'There is not enough stock at the selected branch.';
    END IF;
  END LOOP;

  v_quote := storefront.storefront_quote_web_order(
    p_branch_id, p_fulfillment_type, p_city, p_items
  );

  IF p_payment_method IN ('easypaisa', 'jazzcash')
     AND abs(p_payment_amount_paisa - (v_quote->>'totalPaisa')::BIGINT) > 1 THEN
    RAISE EXCEPTION 'The transfer amount does not match the order total.';
  END IF;

  IF p_payment_method = 'cash_on_delivery'
     AND (p_fulfillment_type <> 'delivery'
          OR NOT storefront.storefront_is_cod_available(
            p_branch_id, p_city, (v_quote->>'totalPaisa')::BIGINT
          )) THEN
    RAISE EXCEPTION 'Cash on delivery is unavailable for this order.';
  END IF;

  v_payment_status := CASE
    WHEN p_payment_method IN ('easypaisa', 'jazzcash') THEN 'pending_verification'
    ELSE 'unpaid'
  END;
  v_payment_review_status := CASE
    WHEN p_payment_method IN ('easypaisa', 'jazzcash') THEN 'awaiting_review'
    ELSE 'none'
  END;
  v_notes := CASE
    WHEN p_payment_method = 'cash_on_delivery' THEN
      concat_ws(E'\n', NULLIF(btrim(p_notes), ''),
        'Please confirm the customer phone number before preparation.')
    ELSE NULLIF(btrim(p_notes), '')
  END;

  INSERT INTO public.web_orders (
    id, order_number, branch_id, status, fulfillment_type,
    customer_name, customer_phone, delivery_address,
    payment_method, payment_status, payment_reference, payment_proof_path,
    payment_review_status, subtotal_paisa, tax_paisa, total_paisa, notes
  ) VALUES (
    p_idempotency_key, p_order_number, p_branch_id, 'pending', p_fulfillment_type,
    btrim(p_customer_name), p_customer_phone, NULLIF(btrim(p_delivery_address), ''),
    p_payment_method, v_payment_status, p_payment_reference, p_payment_proof_path,
    v_payment_review_status,
    (v_quote->>'subtotalPaisa')::BIGINT,
    (v_quote->>'taxPaisa')::BIGINT,
    (v_quote->>'totalPaisa')::BIGINT,
    v_notes
  );

  FOR v_line IN
    SELECT value FROM jsonb_array_elements(v_quote->'items') AS item(value)
  LOOP
    v_line_number := v_line_number + 1;
    v_item_id := gen_random_uuid();
    INSERT INTO public.web_order_items (
      id, order_id, line_number, product_id, product_name, sku, unit_code,
      quantity_milli, unit_price_paisa, unit_cost_paisa, tax_rate_bps,
      tax_paisa, line_total_paisa
    )
    SELECT
      v_item_id,
      p_idempotency_key,
      v_line_number,
      product.id,
      v_line->>'productName',
      v_line->>'sku',
      v_line->>'unitCode',
      (v_line->>'quantityMilli')::BIGINT,
      (v_line->>'unitPricePaisa')::BIGINT,
      product.cost_price_paisa,
      (v_line->>'taxRateBps')::BIGINT,
      (v_line->>'taxPaisa')::BIGINT,
      (v_line->>'lineTotalPaisa')::BIGINT
    FROM public.products AS product
    WHERE product.id = (v_line->>'productId')::UUID;
  END LOOP;

  IF p_payment_method IN ('easypaisa', 'jazzcash') THEN
    INSERT INTO storefront.storefront_web_order_payment_receipts (
      order_id, transaction_hash, screenshot_sha256
    ) VALUES (
      p_idempotency_key, p_payment_reference_hash, p_screenshot_sha256
    );
  END IF;

  RETURN jsonb_build_object(
    'orderId', p_idempotency_key,
    'orderNumber', p_order_number,
    'status', 'pending',
    'paymentStatus', v_payment_status,
    'subtotalPaisa', v_quote->>'subtotalPaisa',
    'taxPaisa', v_quote->>'taxPaisa',
    'deliveryChargePaisa', v_quote->>'deliveryChargePaisa',
    'totalPaisa', v_quote->>'totalPaisa',
    'duplicate', false
  );
END;
$$;

REVOKE ALL ON FUNCTION storefront.storefront_quote_web_order(UUID, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION storefront.storefront_create_web_order(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT,
  TEXT, TEXT, TEXT, JSONB, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION storefront.storefront_quote_web_order(UUID, TEXT, TEXT, JSONB)
  TO service_role;
GRANT EXECUTE ON FUNCTION storefront.storefront_create_web_order(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT,
  TEXT, TEXT, TEXT, JSONB, TEXT
) TO service_role;

NOTIFY pgrst, 'reload schema';
