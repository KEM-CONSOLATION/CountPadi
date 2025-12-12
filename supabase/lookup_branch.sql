-- Quick lookup: Which branch is this?
-- Just shows the branch name and basic info

SELECT 
  b.id as branch_id,
  b.name as branch_name,
  o.name as organization_name,
  o.id as organization_id,
  b.created_at,
  CASE 
    WHEN b.id = (
      SELECT id FROM branches 
      WHERE organization_id = b.organization_id 
      ORDER BY created_at ASC 
      LIMIT 1
    ) THEN '✓ Main Branch'
    ELSE 'Branch'
  END as branch_type
FROM branches b
LEFT JOIN organizations o ON o.id = b.organization_id
WHERE b.id = '2e1ddf06-5915-49fa-94f9-42e4cc8d6bf4'::UUID;  -- ⬅️ Branch ID to check
