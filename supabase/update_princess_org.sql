-- =====================================================
-- UPDATE PRINCESSOKBUSINESS@GMAIL.COM TO ADMIN
-- =====================================================
-- Sets princessokbusiness@gmail.com as admin
-- Creates "La-Cuisine Restaurant" organization if it doesn't exist
-- Assigns user to that organization
-- =====================================================

DO $$
DECLARE
  princess_user_id UUID;
  la_cuisine_org_id UUID;
  default_org_id UUID;
BEGIN
  -- Find princessokbusiness@gmail.com user
  SELECT id INTO princess_user_id
  FROM auth.users
  WHERE email = 'princessokbusiness@gmail.com'
  LIMIT 1;

  IF princess_user_id IS NULL THEN
    RAISE NOTICE 'User princessokbusiness@gmail.com not found';
    RETURN;
  END IF;

  -- Check if "La-Cuisine Restaurant" organization exists
  SELECT id INTO la_cuisine_org_id
  FROM public.organizations
  WHERE slug = 'la-cuisine-restaurant' OR name = 'La-Cuisine Restaurant'
  LIMIT 1;

  -- Create organization if it doesn't exist
  IF la_cuisine_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug, created_by)
    VALUES ('La-Cuisine Restaurant', 'la-cuisine-restaurant', princess_user_id)
    RETURNING id INTO la_cuisine_org_id;
    
    RAISE NOTICE 'Created organization: La-Cuisine Restaurant';
  ELSE
    RAISE NOTICE 'Organization already exists: La-Cuisine Restaurant';
  END IF;

  -- Update user's profile: set role to admin and assign to organization
  UPDATE public.profiles
  SET 
    role = 'admin'::user_role,
    organization_id = la_cuisine_org_id
  WHERE id = princess_user_id;

  RAISE NOTICE 'Updated princessokbusiness@gmail.com to admin in La-Cuisine Restaurant';

  -- Move any existing data from default org to La-Cuisine Restaurant
  -- (if user had data in default org)
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE slug = 'default-org'
  LIMIT 1;

  IF default_org_id IS NOT NULL AND la_cuisine_org_id IS NOT NULL THEN
    -- Move user's items
    UPDATE public.items
    SET organization_id = la_cuisine_org_id
    WHERE organization_id = default_org_id
    AND EXISTS (
      SELECT 1 FROM public.opening_stock 
      WHERE item_id = items.id 
      AND organization_id = default_org_id
      LIMIT 1
    );

    -- Move opening stock
    UPDATE public.opening_stock
    SET organization_id = la_cuisine_org_id
    WHERE organization_id = default_org_id
    AND recorded_by = princess_user_id;

    -- Move closing stock
    UPDATE public.closing_stock
    SET organization_id = la_cuisine_org_id
    WHERE organization_id = default_org_id
    AND recorded_by = princess_user_id;

    -- Move sales
    UPDATE public.sales
    SET organization_id = la_cuisine_org_id
    WHERE organization_id = default_org_id
    AND recorded_by = princess_user_id;

    -- Move expenses
    UPDATE public.expenses
    SET organization_id = la_cuisine_org_id
    WHERE organization_id = default_org_id
    AND recorded_by = princess_user_id;

    RAISE NOTICE 'Moved user data to La-Cuisine Restaurant organization';
  END IF;

END $$;

