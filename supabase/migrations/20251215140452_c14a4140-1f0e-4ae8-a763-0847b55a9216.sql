-- Create admin_users table to store admin emails securely
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users (only service role can manage)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop the old is_admin_email function and create a better one
DROP FUNCTION IF EXISTS public.is_admin_email();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN auth.users u ON lower(u.email) = lower(au.email)
    WHERE u.id = auth.uid()
  )
$$;

-- Update profiles policy: users see own, admins see all
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

-- Update user_consents policy: users see own, admins see all
DROP POLICY IF EXISTS "Users can view their own consents" ON public.user_consents;
CREATE POLICY "Users can view own consents or admins view all"
ON public.user_consents FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- Update user_points policy: users see own, admins see all
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
CREATE POLICY "Users can view own points or admins view all"
ON public.user_points FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- Update user_achievements policy: users see own, admins see all
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements or admins view all"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- Add INSERT policy for consent_versions (admins only)
CREATE POLICY "Admins can create consent versions"
ON public.consent_versions FOR INSERT
WITH CHECK (public.is_admin());

-- Add UPDATE policy for consent_versions (admins only)
CREATE POLICY "Admins can update consent versions"
ON public.consent_versions FOR UPDATE
USING (public.is_admin());

-- Update audit_events to allow admin SELECT
DROP POLICY IF EXISTS "Admins can view all audit events" ON public.audit_events;
CREATE POLICY "Admins can view all audit events"
ON public.audit_events FOR SELECT
USING (public.is_admin());