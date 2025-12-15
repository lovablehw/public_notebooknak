-- Create function to auto-link admin user_id on login
-- This updates admin_users.user_id when a user with matching email logs in
CREATE OR REPLACE FUNCTION public.link_admin_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update admin_users with user_id where email matches and user_id is null
  UPDATE public.admin_users
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-link admin_users
CREATE TRIGGER on_auth_user_created_link_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_admin_user_id();

-- Also update is_admin to fallback to email check for not-yet-linked admins
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid()
       OR (au.user_id IS NULL AND lower(au.email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())))
  )
$$;