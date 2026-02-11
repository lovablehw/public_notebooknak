-- Restrict admin access to user_consents to super_admin only (protects IP/user_agent data)
DROP POLICY IF EXISTS "Users can view own consents or admins view all" ON public.user_consents;
CREATE POLICY "Users can view own consents or super admins view all"
ON public.user_consents FOR SELECT
USING (auth.uid() = user_id OR is_super_admin());