-- Update log_audit_event function to allow ALL authenticated users (not just admins)
-- This enables global activity logging for page_load, button_click, and auth events

CREATE OR REPLACE FUNCTION public.log_audit_event(p_event_type text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  
  -- Require authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to log events';
  END IF;
  
  -- Validate event_type
  IF p_event_type IS NULL OR length(trim(p_event_type)) = 0 THEN
    RAISE EXCEPTION 'Event type is required';
  END IF;
  
  -- Validate event_type length
  IF length(p_event_type) > 100 THEN
    RAISE EXCEPTION 'Event type must be less than 100 characters';
  END IF;
  
  -- Validate event_type format (alphanumeric with underscores)
  IF p_event_type !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Event type contains invalid characters';
  END IF;
  
  -- Validate metadata size (max 10KB)
  IF pg_column_size(p_metadata) > 10240 THEN
    RAISE EXCEPTION 'Metadata too large (max 10KB)';
  END IF;
  
  -- Get user email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Insert the audit event (removed admin check - now allows all authenticated users)
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
$function$;