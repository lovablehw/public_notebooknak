-- Fix error-level security issues: ensure unauthenticated users cannot access sensitive tables

-- 1. Fix admin_users table: Drop and recreate SELECT policy with explicit auth check
DROP POLICY IF EXISTS "Super admins can view admin users" ON public.admin_users;

CREATE POLICY "Super admins can view admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (is_super_admin());

-- 2. Fix audit_events table: Drop and recreate SELECT policy with explicit auth check
DROP POLICY IF EXISTS "Admins can view all audit events" ON public.audit_events;

CREATE POLICY "Admins can view all audit events"
ON public.audit_events
FOR SELECT
TO authenticated
USING (is_admin());

-- 3. Fix profiles table: Drop and recreate SELECT policy with explicit auth check
DROP POLICY IF EXISTS "Users can view own profile or super admin view all" ON public.profiles;

CREATE POLICY "Users can view own profile or super admin view all"
ON public.profiles
FOR SELECT
TO authenticated
USING ((auth.uid() = id) OR is_super_admin());