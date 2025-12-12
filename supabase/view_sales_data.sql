-- Simple Sales Data Check for Your Branch
-- Shows all sales records with details

SELECT 
  s.id as sale_id,
  s.date,
  i.name as item_name,
  i.unit,
  s.quantity,
  s.price_per_unit,
  s.total_price,
  s.branch_id,
  CASE 
    WHEN s.branch_id IS NULL THEN '⚠️ NULL - Should be assigned to your branch'
    WHEN s.branch_id = '6c08e576-c903-4c97-a8cc-f946d3bf517d'::UUID THEN '✓ Your branch'
    ELSE '⚠️ Wrong branch: ' || s.branch_id::TEXT
  END as branch_status,
  s.payment_mode,
  s.description,
  s.created_at
FROM sales s
LEFT JOIN items i ON i.id = s.item_id
WHERE s.organization_id = '53f33d01-ae13-47b6-8ec4-9660410ec092'::UUID  -- ⬅️ Your org ID
  AND s.date >= CURRENT_DATE - INTERVAL '30 days'  -- ⬅️ Change date range as needed
ORDER BY s.date DESC, s.created_at DESC;
