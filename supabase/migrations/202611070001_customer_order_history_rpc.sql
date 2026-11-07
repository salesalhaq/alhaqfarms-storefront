CREATE OR REPLACE FUNCTION storefront.storefront_customer_order_history(
  p_customer_user_id UUID
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public, storefront
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', order_row.id,
        'orderNumber', order_row.order_number,
        'status', order_row.status,
        'fulfillmentType', order_row.fulfillment_type,
        'paymentStatus', order_row.payment_status,
        'totalPaisa', order_row.total_paisa,
        'createdAt', order_row.created_at,
        'branchName', COALESCE(branch.name, 'Store'),
        'items', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'name', item.product_name,
                'unitCode', item.unit_code,
                'quantityMilli', item.quantity_milli,
                'lineTotalPaisa', item.line_total_paisa
              )
              ORDER BY item.line_number
            )
            FROM public.web_order_items AS item
            WHERE item.order_id = order_row.id
              AND item.deleted_at IS NULL
          ),
          '[]'::JSONB
        )
      )
      ORDER BY order_row.created_at DESC
    ),
    '[]'::JSONB
  )
  FROM (
    SELECT *
    FROM public.web_orders
    WHERE customer_user_id = p_customer_user_id
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 50
  ) AS order_row
  LEFT JOIN public.branches AS branch ON branch.id = order_row.branch_id;
$$;

REVOKE ALL ON FUNCTION storefront.storefront_customer_order_history(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION storefront.storefront_customer_order_history(UUID)
  TO service_role;

NOTIFY pgrst, 'reload schema';
