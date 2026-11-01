-- Server-only order tracking RPC.
-- Returns only order progress and line items; customer contact details,
-- delivery address, payment references, and internal event notes stay private.

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

NOTIFY pgrst, 'reload schema';
