-- Fix profiles table: Make profile data strictly owner-only access
-- Super admins should not have broad access to sensitive health profile data
-- This protects user privacy for display_name, age_range, and smoking_status

DROP POLICY IF EXISTS "Users can view own profile or super admin view all" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);