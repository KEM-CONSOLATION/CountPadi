-- =====================================================
-- CREATE ADMIN FOR ORGANIZATION
-- =====================================================
-- This script makes the organization creator an admin
-- and assigns them to the organization and main branch
-- =====================================================

-- Replace 'user-email@example.com' with the email used to create the organization
DO $$
DECLARE
  user_email TEXT := 'user-email@example.com';  -- CHANGE THIS
  org_name TEXT := 'La Cuisine';  -- CHANGE THIS if different
  user_id UUID;
  org_id UUID;
  branch_id UUID;
  user_profile RECORD;
BEGIN
  -- STEP 1: Get user ID
  SELECT id INTO user_id
  FROM profiles
  WHERE email = user_email
  LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;
  
  RAISE NOTICE 'User ID: %', user_id;
  RAISE NOTICE 'User Email: %', user_email;
  
  -- STEP 2: Get organization ID (by name or by created_by)
  -- Try by name first
  SELECT id INTO org_id
  FROM organizations
  WHERE name = org_name
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If not found by name, try by created_by
  IF org_id IS NULL THEN
    SELECT id INTO org_id
    FROM organizations
    WHERE created_by = user_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found for: %', org_name;
  END IF;
  
  RAISE NOTICE 'Organization ID: %', org_id;
  
  -- STEP 3: Get main branch ID
  SELECT id INTO branch_id
  FROM branches
  WHERE organization_id = org_id
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF branch_id IS NULL THEN
    RAISE EXCEPTION 'Branch not found for organization: %', org_id;
  END IF;
  
  RAISE NOTICE 'Branch ID: %', branch_id;
  RAISE NOTICE '';
  
  -- STEP 4: Update user profile to be admin
  UPDATE profiles
  SET 
    organization_id = org_id,
    branch_id = branch_id,
    default_branch_id = branch_id,
    role = 'admin'  -- Set role to admin
  WHERE id = user_id;
  
  -- STEP 5: Verify the update
  SELECT 
    p.id,
    p.email,
    p.role,
    p.organization_id,
    p.branch_id,
    o.name as organization_name,
    b.name as branch_name
  INTO user_profile
  FROM profiles p
  LEFT JOIN organizations o ON p.organization_id = o.id
  LEFT JOIN branches b ON p.branch_id = b.id
  WHERE p.id = user_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ADMIN CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', user_profile.email;
  RAISE NOTICE 'Role: %', user_profile.role;
  RAISE NOTICE 'Organization: %', user_profile.organization_name;
  RAISE NOTICE 'Branch: %', user_profile.branch_name;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'User can now log in as admin!';
  
END $$;

-- =====================================================
-- VERIFICATION: Check admin was created
-- =====================================================

-- View the updated profile
SELECT 
  p.email,
  p.role,
  o.name as organization_name,
  b.name as branch_name,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Admin'
    ELSE '❌ Not Admin'
  END as status
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN branches b ON p.branch_id = b.id
WHERE p.email = 'user-email@example.com';  -- CHANGE THIS

-- =====================================================
-- HELPER QUERIES
-- =====================================================

-- Find organization by name
SELECT 
  id,
  name,
  created_by,
  created_at
FROM organizations
WHERE name = 'La Cuisine'  -- CHANGE THIS
ORDER BY created_at DESC;

-- Find user by email
SELECT 
  id,
  email,
  role,
  organization_id
FROM profiles
WHERE email = 'user-email@example.com';  -- CHANGE THIS

-- Get main branch for organization
SELECT 
  b.id,
  b.name,
  b.organization_id,
  o.name as organization_name
FROM branches b
JOIN organizations o ON b.organization_id = o.id
WHERE o.name = 'La Cuisine'  -- CHANGE THIS
ORDER BY b.created_at ASC
LIMIT 1;
