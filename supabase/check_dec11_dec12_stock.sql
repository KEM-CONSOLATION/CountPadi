-- Check December 11 Closing Stock and December 12 Opening Stock
-- This helps identify why December 12 shows 0 opening stock

WITH config AS (
  SELECT 
    '53f33d01-ae13-47b6-8ec4-9660410ec092'::UUID as check_org_id,
    '6c08e576-c903-4c97-a8cc-f946d3bf517d'::UUID as check_branch_id,
    '2025-12-11'::DATE as dec11_date,
    '2025-12-12'::DATE as dec12_date
)
-- December 11 Closing Stock
SELECT 
  'Dec 11 Closing Stock' as category,
  i.name as item_name,
  i.unit,
  cs.quantity as closing_stock_quantity,
  cs.date,
  cs.branch_id,
  CASE 
    WHEN cs.id IS NULL THEN '⚠️ Missing - Needs to be calculated'
    ELSE '✓ Exists'
  END as status
FROM config c
INNER JOIN items i ON i.organization_id = c.check_org_id
  AND (i.branch_id = c.check_branch_id OR i.branch_id IS NULL)
LEFT JOIN closing_stock cs ON cs.item_id = i.id
  AND cs.date = c.dec11_date
  AND cs.organization_id = c.check_org_id
  AND (cs.branch_id = c.check_branch_id OR cs.branch_id IS NULL)
WHERE EXISTS (
  SELECT 1 FROM opening_stock os 
  WHERE os.item_id = i.id 
    AND os.date = c.dec11_date
    AND os.organization_id = c.check_org_id
    AND (os.branch_id = c.check_branch_id OR os.branch_id IS NULL)
)

UNION ALL

-- December 12 Opening Stock
SELECT 
  'Dec 12 Opening Stock' as category,
  i.name as item_name,
  i.unit,
  os.quantity as opening_stock_quantity,
  os.date,
  os.branch_id,
  CASE 
    WHEN os.id IS NULL THEN '⚠️ Missing - Should be from Dec 11 closing'
    WHEN os.quantity = 0 THEN '⚠️ Zero - Should be from Dec 11 closing'
    ELSE '✓ Exists'
  END as status
FROM config c
INNER JOIN items i ON i.organization_id = c.check_org_id
  AND (i.branch_id = c.check_branch_id OR i.branch_id IS NULL)
LEFT JOIN opening_stock os ON os.item_id = i.id
  AND os.date = c.dec12_date
  AND os.organization_id = c.check_org_id
  AND (os.branch_id = c.check_branch_id OR os.branch_id IS NULL)
WHERE EXISTS (
  SELECT 1 FROM opening_stock os2 
  WHERE os2.item_id = i.id 
    AND os2.date = c.dec11_date
    AND os2.organization_id = c.check_org_id
    AND (os2.branch_id = c.check_branch_id OR os2.branch_id IS NULL)
)
ORDER BY category, item_name;
