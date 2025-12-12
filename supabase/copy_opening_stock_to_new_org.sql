-- =====================================================
-- COPY OPENING STOCK FROM OLD ORG TO NEW ORG
-- =====================================================
-- This script:
-- 1. Gets opening stock for Dec 11 from old organization
-- 2. Creates items in new organization (if they don't exist)
-- 3. Creates opening stock for Dec 11 in new organization
-- =====================================================

DO $$
DECLARE
  -- NEW ORGANIZATION DETAILS (from the URL you provided)
  new_org_id UUID := '53f33d01-ae13-47b6-8ec4-9660410ec092';  -- New organization ID
  new_branch_id UUID := '6c08e576-c903-4c97-a8cc-f946d3bf517d';  -- New branch ID
  new_org_name TEXT := 'lacuisine';  -- New organization name
  
  -- OLD ORGANIZATION (to copy from)
  old_org_creator_email TEXT := 'princessokbusiness@gmail.com';  -- Email of old organization creator
  
  -- TARGET DATE
  target_date DATE := '2025-12-11';  -- December 11, 2025
  
  -- Variables
  old_org_id UUID;
  old_org_creator_id UUID;
  old_org_name TEXT;
  user_id_for_recording UUID;
  items_created INTEGER := 0;
  items_skipped INTEGER := 0;
  opening_stock_created INTEGER := 0;
  opening_stock_record RECORD;
  new_item_id UUID;
  existing_item_id UUID;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COPYING OPENING STOCK TO NEW ORGANIZATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'New Organization ID: %', new_org_id;
  RAISE NOTICE 'New Branch ID: %', new_branch_id;
  RAISE NOTICE 'New Organization Name: %', new_org_name;
  RAISE NOTICE 'Old Org Creator Email: %', old_org_creator_email;
  RAISE NOTICE 'Target Date: %', target_date;
  RAISE NOTICE '';
  
  -- STEP 1: Verify new organization exists
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = new_org_id) THEN
    RAISE EXCEPTION 'New organization not found: %', new_org_id;
  END IF;
  
  -- STEP 2: Verify new branch exists
  IF NOT EXISTS (SELECT 1 FROM branches WHERE id = new_branch_id AND organization_id = new_org_id) THEN
    RAISE EXCEPTION 'New branch not found or does not belong to organization';
  END IF;
  
  -- STEP 3: Get user_id for recording (from organization creator)
  SELECT created_by INTO user_id_for_recording
  FROM organizations
  WHERE id = new_org_id;
  
  IF user_id_for_recording IS NULL THEN
    -- Fallback: get first admin user for this organization
    SELECT id INTO user_id_for_recording
    FROM profiles
    WHERE organization_id = new_org_id
      AND role IN ('admin', 'tenant_admin')
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  IF user_id_for_recording IS NULL THEN
    RAISE EXCEPTION 'No user found to record opening stock. Please create an admin user first.';
  END IF;
  
  RAISE NOTICE 'User ID for recording: %', user_id_for_recording;
  RAISE NOTICE '';
  
  -- STEP 4: Find old organization by creator's email
  -- First, get the user ID from auth.users
  SELECT id INTO old_org_creator_id
  FROM auth.users
  WHERE email = LOWER(old_org_creator_email)
  LIMIT 1;
  
  IF old_org_creator_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', old_org_creator_email;
  END IF;
  
  RAISE NOTICE 'Old org creator user ID: %', old_org_creator_id;
  
  -- Find organization created by this user (oldest first - the original one)
  SELECT id INTO old_org_id
  FROM organizations
  WHERE created_by = old_org_creator_id
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF old_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found created by: %', old_org_creator_email;
  END IF;
  
  -- Get old organization name for display
  SELECT name INTO old_org_name
  FROM organizations
  WHERE id = old_org_id;
  
  RAISE NOTICE 'Old Organization ID: %', old_org_id;
  RAISE NOTICE 'Old Organization Name: %', old_org_name;
  RAISE NOTICE '';
  RAISE NOTICE 'Starting to copy items and opening stock...';
  RAISE NOTICE '';
  
  -- STEP 5: Get opening stock from old organization for Dec 11
  FOR opening_stock_record IN
    SELECT 
      os.item_id,
      os.quantity,
      os.cost_price,
      os.selling_price,
      os.notes,
      i.name as item_name,
      i.unit as item_unit,
      i.description as item_description
    FROM opening_stock os
    JOIN items i ON os.item_id = i.id
    WHERE os.organization_id = old_org_id
      AND os.date = target_date
      AND os.quantity > 0  -- Only copy items with stock
    ORDER BY i.name
  LOOP
    -- STEP 6: Check if item exists in new organization (by name, case-insensitive)
    SELECT id INTO existing_item_id
    FROM items
    WHERE organization_id = new_org_id
      AND LOWER(TRIM(name)) = LOWER(TRIM(opening_stock_record.item_name))
    LIMIT 1;
    
    IF existing_item_id IS NULL THEN
      -- STEP 7: Create item in new organization
      INSERT INTO items (
        organization_id,
        branch_id,
        name,
        unit,
        description,
        cost_price,
        selling_price
      )
      VALUES (
        new_org_id,
        new_branch_id,
        opening_stock_record.item_name,
        opening_stock_record.item_unit,
        opening_stock_record.item_description,
        opening_stock_record.cost_price,
        opening_stock_record.selling_price
      )
      RETURNING id INTO new_item_id;
      
      items_created := items_created + 1;
      RAISE NOTICE '✅ Created item: % (ID: %)', opening_stock_record.item_name, new_item_id;
    ELSE
      new_item_id := existing_item_id;
      items_skipped := items_skipped + 1;
      RAISE NOTICE '⏭️  Item already exists: % (ID: %)', opening_stock_record.item_name, existing_item_id;
    END IF;
    
    -- STEP 8: Create opening stock for Dec 11 in new organization
    IF NOT EXISTS (
      SELECT 1 FROM opening_stock
      WHERE organization_id = new_org_id
        AND item_id = new_item_id
        AND date = target_date
    ) THEN
      INSERT INTO opening_stock (
        organization_id,
        branch_id,
        item_id,
        quantity,
        cost_price,
        selling_price,
        date,
        recorded_by,
        notes
      )
      VALUES (
        new_org_id,
        new_branch_id,
        new_item_id,
        opening_stock_record.quantity,
        opening_stock_record.cost_price,
        opening_stock_record.selling_price,
        target_date,
        user_id_for_recording,
        COALESCE(opening_stock_record.notes, '') || ' (Copied from old organization)'
      );
      
      opening_stock_created := opening_stock_created + 1;
      RAISE NOTICE '   📦 Created opening stock: Quantity = %', opening_stock_record.quantity;
    ELSE
      RAISE NOTICE '   ⚠️  Opening stock already exists for: % on %', 
        opening_stock_record.item_name, 
        target_date;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUMMARY:';
  RAISE NOTICE '   Items created: %', items_created;
  RAISE NOTICE '   Items skipped (already exist): %', items_skipped;
  RAISE NOTICE '   Opening stock records created: %', opening_stock_created;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Done! Items and opening stock for % have been copied!', target_date;
  RAISE NOTICE '';
  RAISE NOTICE 'New Organization: %', new_org_name;
  RAISE NOTICE 'New Branch ID: %', new_branch_id;
  RAISE NOTICE 'All items and opening stock are now in the new organization!';
  
END $$;

-- =====================================================
-- VERIFICATION: Check what was created
-- =====================================================

-- View items in new organization
SELECT 
  i.id,
  i.name,
  i.unit,
  i.cost_price,
  i.selling_price,
  i.branch_id,
  CASE 
    WHEN i.branch_id = '6c08e576-c903-4c97-a8cc-f946d3bf517d' THEN '✅ Correct Branch'
    ELSE '❌ Wrong Branch'
  END as branch_status
FROM items i
WHERE i.organization_id = '53f33d01-ae13-47b6-8ec4-9660410ec092'
ORDER BY i.name;

-- View opening stock for Dec 11 in new organization
SELECT 
  i.name as item_name,
  i.unit,
  os.quantity,
  os.cost_price,
  os.selling_price,
  os.date,
  os.branch_id,
  CASE 
    WHEN os.branch_id = '6c08e576-c903-4c97-a8cc-f946d3bf517d' THEN '✅ Correct Branch'
    ELSE '❌ Wrong Branch'
  END as branch_status
FROM opening_stock os
JOIN items i ON os.item_id = i.id
WHERE os.organization_id = '53f33d01-ae13-47b6-8ec4-9660410ec092'
  AND os.date = '2025-12-11'
ORDER BY i.name;

-- Count summary
SELECT 
  COUNT(DISTINCT i.id) as total_items,
  COUNT(DISTINCT os.id) as opening_stock_records,
  SUM(os.quantity) as total_quantity
FROM items i
LEFT JOIN opening_stock os ON i.id = os.item_id 
  AND os.organization_id = '53f33d01-ae13-47b6-8ec4-9660410ec092'
  AND os.date = '2025-12-11'
WHERE i.organization_id = '53f33d01-ae13-47b6-8ec4-9660410ec092';

-- =====================================================
-- HELPER: Find old organization
-- =====================================================

-- If you need to find the old organization ID manually:
SELECT 
  id,
  name,
  created_at
FROM organizations
WHERE name LIKE '%Cuisine%'  -- Adjust search term
ORDER BY created_at ASC;
