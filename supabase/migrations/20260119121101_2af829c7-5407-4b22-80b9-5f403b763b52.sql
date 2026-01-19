-- Fix 1: Profiles table - Only super_admins can view other users' health data
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;

-- Create restrictive policy: users see own, only super_admin sees all
CREATE POLICY "Users can view own profile or super admin view all"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR is_super_admin());

-- Fix 2: user_consents table - Already has proper RLS but let's verify/tighten
-- The current policy correctly uses (auth.uid() = user_id) OR is_admin()
-- This is acceptable as consent management requires admin oversight
-- No change needed - the RLS is already correctly scoped

-- Fix 3: admin_users table - Restrict full email access to super_admins only
-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create policy: only super_admins can view full admin user details
CREATE POLICY "Super admins can view admin users"
ON public.admin_users FOR SELECT
USING (is_super_admin());

-- Create a secure RPC function for service_admins to see masked email list
CREATE OR REPLACE FUNCTION public.get_admin_list_masked()
RETURNS TABLE(
  id uuid,
  masked_email text,
  created_at timestamptz,
  has_user_id boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    regexp_replace(au.email, '^(.).+@', '\1***@') as masked_email,
    au.created_at,
    au.user_id IS NOT NULL as has_user_id
  FROM admin_users au
  WHERE is_service_admin()
  ORDER BY au.created_at DESC
$$;