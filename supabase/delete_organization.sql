-- =====================================================
-- DELETE ORGANIZATION
-- =====================================================
-- This script deletes an organization and all related data
-- Use with caution - this will permanently delete everything!
-- =====================================================

-- Replace 'organization-name-here' with actual organization name
-- Or replace 'organization-id-here' with actual organization ID
DO $$
DECLARE
  org_name TEXT := 'La Cuisine';  -- CHANGE THIS
  org_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Get organization ID
  SELECT id INTO org_id
  FROM organizations
  WHERE name = org_name
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found: %', org_name;
  END IF;
  
  RAISE NOTICE 'Organization ID to delete: %', org_id;
  RAISE NOTICE 'Organization Name: %', org_name;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  WARNING: This will delete ALL related data!';
  RAISE NOTICE '   - All items';
  RAISE NOTICE '   - All sales records';
  RAISE NOTICE '   - All opening/closing stock';
  RAISE NOTICE '   - All branches';
  RAISE NOTICE '   - All users linked to this organization';
  RAISE NOTICE '';
  
  -- Count what will be deleted (for reference)
  SELECT COUNT(*) INTO deleted_count FROM items WHERE organization_id = org_id;
  RAISE NOTICE 'Items to be deleted: %', deleted_count;
  
  SELECT COUNT(*) INTO deleted_count FROM sales WHERE organization_id = org_id;
  RAISE NOTICE 'Sales records to be deleted: %', deleted_count;
  
  SELECT COUNT(*) INTO deleted_count FROM opening_stock WHERE organization_id = org_id;
  RAISE NOTICE 'Opening stock records to be deleted: %', deleted_count;
  
  SELECT COUNT(*) INTO deleted_count FROM closing_stock WHERE organization_id = org_id;
  RAISE NOTICE 'Closing stock records to be deleted: %', deleted_count;
  
  SELECT COUNT(*) INTO deleted_count FROM branches WHERE organization_id = org_id;
  RAISE NOTICE 'Branches to be deleted: %', deleted_count;
  
  SELECT COUNT(*) INTO deleted_count FROM profiles WHERE organization_id = org_id;
  RAISE NOTICE 'User profiles to be unlinked: %', deleted_count;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Deleting organization...';
  
  -- Delete organization (cascades to related records)
  DELETE FROM organizations
  WHERE id = org_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Organization deleted successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now create a new organization manually.';
  RAISE NOTICE 'All related data has been deleted.';
  
END $$;

-- =====================================================
-- VERIFICATION: Check if organization was deleted
-- =====================================================

-- Check if organization still exists
SELECT 
  id,
  name,
  created_at
FROM organizations
WHERE name = 'La Cuisine'  -- CHANGE THIS
ORDER BY created_at DESC;

-- Should return 0 rows if deleted successfully

-- =====================================================
-- ALTERNATIVE: Delete by organization ID directly
-- =====================================================

-- If you know the organization ID, you can use this instead:
-- DELETE FROM organizations WHERE id = 'organization-id-here';

-- =====================================================
-- HELPER: Find organization ID
-- =====================================================

-- Get organization ID by name
SELECT 
  id,
  name,
  created_at,
  created_by
FROM organizations
WHERE name = 'La Cuisine'  -- CHANGE THIS
ORDER BY created_at DESC;
