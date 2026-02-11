-- Create masked audit events RPC that masks emails for non-super-admins
CREATE OR REPLACE FUNCTION public.get_audit_events_masked(p_limit integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  event_type text,
  actor_user_id uuid,
  masked_email text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ae.id,
    ae.event_type,
    ae.actor_user_id,
    CASE 
      WHEN is_super_admin() THEN ae.actor_email
      ELSE regexp_replace(ae.actor_email, '^(.).+@', '\1***@')
    END as masked_email,
    ae.metadata,
    ae.created_at
  FROM audit_events ae
  WHERE is_admin()
  ORDER BY ae.created_at DESC
  LIMIT p_limit
$$;