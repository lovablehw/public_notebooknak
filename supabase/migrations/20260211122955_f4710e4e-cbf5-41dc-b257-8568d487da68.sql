-- 1. user_groups: restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can read user groups" ON public.user_groups;
CREATE POLICY "Authenticated users can read user groups"
ON public.user_groups FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. consent_versions: restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can read consent versions" ON public.consent_versions;
CREATE POLICY "Authenticated users can read consent versions"
ON public.consent_versions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. challenge_types: restrict to authenticated users (keep service admin override)
DROP POLICY IF EXISTS "Anyone can read active challenge types" ON public.challenge_types;
CREATE POLICY "Authenticated users can read active challenge types"
ON public.challenge_types FOR SELECT
USING ((auth.uid() IS NOT NULL AND is_active = true) OR is_service_admin());

-- 4. button_configs: restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can read button configs" ON public.button_configs;
CREATE POLICY "Authenticated users can read button configs"
ON public.button_configs FOR SELECT
USING (auth.uid() IS NOT NULL);