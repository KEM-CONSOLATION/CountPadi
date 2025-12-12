-- Complete Opening Stock Check - Returns table results
-- Easy to read in Supabase SQL Editor Results tab
-- 
-- INSTRUCTIONS:
-- 1. Change the date in the config CTE below (line 8)
-- 2. Optionally set your organization_id and branch_id
-- 3. Run the script
-- 4. Results will appear in the Results tab

WITH config AS (
  SELECT 
    '2025-12-12'::DATE as check_date,  -- ⬅️ CHANGE THIS DATE
    NULL::UUID as check_org_id,        -- ⬅️ Your org ID (or NULL for all)
    NULL::UUID as check_branch_id      -- ⬅️ Your branch ID (or NULL for all)
),
summary AS (
  SELECT 
    COUNT(DISTINCT i.id) as total_items,
    COUNT(DISTINCT CASE WHEN os.id IS NOT NULL THEN i.id END) as items_with_opening_stock,
    COUNT(DISTINCT CASE WHEN os.id IS NULL THEN i.id END) as items_without_opening_stock
  FROM config c
  CROSS JOIN items i
  LEFT JOIN opening_stock os ON os.item_id = i.id 
    AND os.date = c.check_date
    AND (c.check_org_id IS NULL OR os.organization_id = c.check_org_id)
    AND (
      c.check_branch_id IS NULL 
      OR os.branch_id = c.check_branch_id 
      OR os.branch_id IS NULL
    )
  WHERE (c.check_org_id IS NULL OR i.organization_id = c.check_org_id)
    AND (c.check_branch_id IS NULL OR i.branch_id = c.check_branch_id OR i.branch_id IS NULL)
)
-- Items WITH Opening Stock
SELECT 
  'WITH Opening Stock' as category,
  i.name as item_name,
  i.unit,
  os.quantity,
  CASE 
    WHEN os.branch_id IS NULL THEN 'NULL (Legacy)'
    ELSE os.branch_id::TEXT
  END as branch_id,
  CASE 
    WHEN os.quantity IS NULL THEN '⚠️ NULL Quantity'
    WHEN os.quantity = 0 THEN '⚠️ Zero Quantity'
    ELSE '✓ OK'
  END as status,
  s.total_items,
  s.items_with_opening_stock,
  s.items_without_opening_stock
FROM config c
CROSS JOIN summary s
INNER JOIN items i ON (c.check_org_id IS NULL OR i.organization_id = c.check_org_id)
  AND (c.check_branch_id IS NULL OR i.branch_id = c.check_branch_id OR i.branch_id IS NULL)
INNER JOIN opening_stock os ON os.item_id = i.id
WHERE os.date = c.check_date
  AND (c.check_org_id IS NULL OR os.organization_id = c.check_org_id)
  AND (
    c.check_branch_id IS NULL 
    OR os.branch_id = c.check_branch_id 
    OR os.branch_id IS NULL
  )

UNION ALL

-- Items WITHOUT Opening Stock
SELECT 
  'WITHOUT Opening Stock' as category,
  i.name as item_name,
  i.unit,
  NULL::NUMERIC as quantity,
  CASE 
    WHEN i.branch_id IS NULL THEN 'NULL (Legacy)'
    ELSE i.branch_id::TEXT
  END as branch_id,
  '✗ Missing' as status,
  s.total_items,
  s.items_with_opening_stock,
  s.items_without_opening_stock
FROM config c
CROSS JOIN summary s
INNER JOIN items i ON (c.check_org_id IS NULL OR i.organization_id = c.check_org_id)
  AND (c.check_branch_id IS NULL OR i.branch_id = c.check_branch_id OR i.branch_id IS NULL)
WHERE NOT EXISTS (
  SELECT 1 
  FROM opening_stock os 
  WHERE os.item_id = i.id 
    AND os.date = c.check_date
    AND (c.check_org_id IS NULL OR os.organization_id = c.check_org_id)
    AND (
      c.check_branch_id IS NULL 
      OR os.branch_id = c.check_branch_id 
      OR os.branch_id IS NULL
    )
)
ORDER BY category, item_name;
