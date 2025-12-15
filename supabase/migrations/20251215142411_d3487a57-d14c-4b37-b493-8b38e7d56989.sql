-- Create RPC function to check admin status (wrapper around is_admin)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_is_admin TO authenticated;