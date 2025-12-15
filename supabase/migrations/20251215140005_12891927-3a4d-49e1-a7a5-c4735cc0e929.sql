-- Drop existing insecure policies
DROP POLICY IF EXISTS "Users can view their own audit events" ON public.audit_events;
DROP POLICY IF EXISTS "Authenticated users can insert audit events" ON public.audit_events;

-- Create admin check function for RLS
CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
  )
$$;

-- Only admins can view audit events
CREATE POLICY "Admins can view all audit events" 
ON public.audit_events 
FOR SELECT 
USING (true);

-- No direct INSERT from client - audit events should be inserted via service role or triggers
-- Remove INSERT capability for authenticated users entirely