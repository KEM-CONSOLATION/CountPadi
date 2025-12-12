-- Simple script to list all branches for an organization
-- Just change the organization_id below

SELECT 
  b.id as branch_id,
  b.name as branch_name,
  b.organization_id,
  b.created_at,
  b.updated_at,
  -- Additional info
  (SELECT COUNT(*) FROM items WHERE branch_id = b.id) as items_count,
  (SELECT COUNT(*) FROM opening_stock WHERE branch_id = b.id) as opening_stock_count,
  (SELECT COUNT(*) FROM sales WHERE branch_id = b.id) as sales_count
FROM branches b
WHERE b.organization_id = '53f33d01-ae13-47b6-8ec4-9660410ec092'::UUID  -- ⬅️ Change this to your org ID
ORDER BY b.created_at ASC;
