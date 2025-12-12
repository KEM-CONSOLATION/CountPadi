-- Check sales for specific organization and date
-- Replace the organization_id with the actual UUID (without "eq." prefix)

SELECT 
  COUNT(*) as total_sales,
  branch_id,
  COUNT(CASE WHEN branch_id IS NULL THEN 1 END) as null_branch_count
FROM sales
WHERE organization_id = '0dacd07c-9074-4fc9-a034-1d95dc4aa05a'  -- Remove "eq." prefix!
  AND date = '2025-12-11'
GROUP BY branch_id;

-- Also check all sales for this organization
SELECT 
  date,
  COUNT(*) as sales_count,
  branch_id
FROM sales
WHERE organization_id = '0dacd07c-9074-4fc9-a034-1d95dc4aa05a'
GROUP BY date, branch_id
ORDER BY date DESC
LIMIT 20;
