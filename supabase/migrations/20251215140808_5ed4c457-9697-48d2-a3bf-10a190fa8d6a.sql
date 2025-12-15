-- Add RLS policy for admin_users - only admins can view
CREATE POLICY "Admins can view admin users"
ON public.admin_users FOR SELECT
USING (public.is_admin());