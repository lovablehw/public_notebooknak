-- Fix 1: Add explicit restrictive INSERT policy on user_achievements
-- This ensures achievements can only be granted through the add_user_points() SECURITY DEFINER function
CREATE POLICY "Only backend can insert achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (false);

-- Fix 2: Create a secure audit logging function that only service role or triggers can use
-- First, drop the current admin INSERT policy
DROP POLICY IF EXISTS "Admins can insert audit events" ON public.audit_events;

-- Create a SECURITY DEFINER function for audit logging
-- This function logs audit events securely from server-side only
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  
  -- Validate event_type
  IF p_event_type IS NULL OR length(trim(p_event_type)) = 0 THEN
    RAISE EXCEPTION 'Event type is required';
  END IF;
  
  -- Validate event_type length
  IF length(p_event_type) > 100 THEN
    RAISE EXCEPTION 'Event type must be less than 100 characters';
  END IF;
  
  -- Get user email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Check if the user is an admin before allowing audit log insertion
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can log audit events';
  END IF;
  
  -- Insert the audit event
  INSERT INTO public.audit_events (
    event_type,
    actor_user_id,
    actor_email,
    metadata
  ) VALUES (
    p_event_type,
    v_user_id,
    v_user_email,
    p_metadata
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, jsonb) TO authenticated;