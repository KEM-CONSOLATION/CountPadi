-- Fix infinite recursion in RLS policies
-- The "Admins can view all profiles" policy was causing recursion
-- This replaces it with a function-based approach

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policy using the function (avoids recursion)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_admin(auth.uid())
  );

-- Also fix the update policy to avoid recursion
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.is_admin(auth.uid())
  );

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;

