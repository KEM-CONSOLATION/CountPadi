-- =====================================================
-- RESTRICT SUPERADMIN OPERATIONS
-- =====================================================
-- This migration restricts superadmins to VIEW-only access
-- for operational data (restocking, sales, opening/closing stock)
-- Superadmins can only VIEW metrics, not perform operations
-- =====================================================

-- Update opening_stock policies - superadmins can only VIEW
DROP POLICY IF EXISTS "Users can insert opening stock in their organization or superadmins can insert anywhere" ON public.opening_stock;
CREATE POLICY "Users can insert opening stock in their organization"
  ON public.opening_stock FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid()) AND 
    auth.uid() IS NOT NULL AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update opening stock in their organization or superadmins can update all" ON public.opening_stock;
CREATE POLICY "Admins can update opening stock in their organization"
  ON public.opening_stock FOR UPDATE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can delete opening stock in their organization or superadmins can delete all" ON public.opening_stock;
CREATE POLICY "Admins can delete opening stock in their organization"
  ON public.opening_stock FOR DELETE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

-- Update closing_stock policies - superadmins can only VIEW
DROP POLICY IF EXISTS "Users can insert closing stock in their organization or superadmins can insert anywhere" ON public.closing_stock;
CREATE POLICY "Users can insert closing stock in their organization"
  ON public.closing_stock FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid()) AND 
    auth.uid() IS NOT NULL AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update closing stock in their organization or superadmins can update all" ON public.closing_stock;
CREATE POLICY "Admins can update closing stock in their organization"
  ON public.closing_stock FOR UPDATE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can delete closing stock in their organization or superadmins can delete all" ON public.closing_stock;
CREATE POLICY "Admins can delete closing stock in their organization"
  ON public.closing_stock FOR DELETE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

-- Update sales policies - superadmins can only VIEW
DROP POLICY IF EXISTS "Users can insert sales in their organization or superadmins can insert anywhere" ON public.sales;
CREATE POLICY "Users can insert sales in their organization"
  ON public.sales FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid()) AND 
    auth.uid() IS NOT NULL AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update sales in their organization or superadmins can update all" ON public.sales;
CREATE POLICY "Admins can update sales in their organization"
  ON public.sales FOR UPDATE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can delete sales in their organization or superadmins can delete all" ON public.sales;
CREATE POLICY "Admins can delete sales in their organization"
  ON public.sales FOR DELETE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

-- Update expenses policies - superadmins can only VIEW
DROP POLICY IF EXISTS "Users can insert expenses in their organization or superadmins can insert anywhere" ON public.expenses;
CREATE POLICY "Users can insert expenses in their organization"
  ON public.expenses FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid()) AND 
    auth.uid() IS NOT NULL AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update expenses in their organization or superadmins can update all" ON public.expenses;
CREATE POLICY "Admins can update expenses in their organization"
  ON public.expenses FOR UPDATE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can delete expenses in their organization or superadmins can delete all" ON public.expenses;
CREATE POLICY "Admins can delete expenses in their organization"
  ON public.expenses FOR DELETE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

-- Update items policies - superadmins can only VIEW (they shouldn't manage items)
DROP POLICY IF EXISTS "Admins can insert items in their organization or superadmins can insert anywhere" ON public.items;
CREATE POLICY "Admins can insert items in their organization"
  ON public.items FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update items in their organization or superadmins can update all" ON public.items;
CREATE POLICY "Admins can update items in their organization"
  ON public.items FOR UPDATE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can delete items in their organization or superadmins can delete all" ON public.items;
CREATE POLICY "Admins can delete items in their organization"
  ON public.items FOR DELETE
  USING (
    organization_id = public.get_user_organization_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
    NOT public.is_superadmin(auth.uid())
  );

-- Restocking policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restocking') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can insert restocking in their organization or superadmins can insert anywhere" ON public.restocking;
    DROP POLICY IF EXISTS "Admins can update restocking in their organization or superadmins can update all" ON public.restocking;
    DROP POLICY IF EXISTS "Admins can delete restocking in their organization or superadmins can delete all" ON public.restocking;
    
    -- Create restricted policies
    CREATE POLICY "Users can insert restocking in their organization"
      ON public.restocking FOR INSERT
      WITH CHECK (
        organization_id = public.get_user_organization_id(auth.uid()) AND 
        auth.uid() IS NOT NULL AND
        NOT public.is_superadmin(auth.uid())
      );

    CREATE POLICY "Admins can update restocking in their organization"
      ON public.restocking FOR UPDATE
      USING (
        organization_id = public.get_user_organization_id(auth.uid()) AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
        NOT public.is_superadmin(auth.uid())
      );

    CREATE POLICY "Admins can delete restocking in their organization"
      ON public.restocking FOR DELETE
      USING (
        organization_id = public.get_user_organization_id(auth.uid()) AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
        NOT public.is_superadmin(auth.uid())
      );
  END IF;
END $$;

-- Waste/Spoilage policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waste_spoilage') THEN
    DROP POLICY IF EXISTS "Users can insert waste_spoilage in their organization or superadmins can insert anywhere" ON public.waste_spoilage;
    DROP POLICY IF EXISTS "Admins can update waste_spoilage in their organization or superadmins can update all" ON public.waste_spoilage;
    DROP POLICY IF EXISTS "Admins can delete waste_spoilage in their organization or superadmins can delete all" ON public.waste_spoilage;
    
    CREATE POLICY "Users can insert waste_spoilage in their organization"
      ON public.waste_spoilage FOR INSERT
      WITH CHECK (
        organization_id = public.get_user_organization_id(auth.uid()) AND 
        auth.uid() IS NOT NULL AND
        NOT public.is_superadmin(auth.uid())
      );

    CREATE POLICY "Admins can update waste_spoilage in their organization"
      ON public.waste_spoilage FOR UPDATE
      USING (
        organization_id = public.get_user_organization_id(auth.uid()) AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
        NOT public.is_superadmin(auth.uid())
      );

    CREATE POLICY "Admins can delete waste_spoilage in their organization"
      ON public.waste_spoilage FOR DELETE
      USING (
        organization_id = public.get_user_organization_id(auth.uid()) AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role) AND
        NOT public.is_superadmin(auth.uid())
      );
  END IF;
END $$;

