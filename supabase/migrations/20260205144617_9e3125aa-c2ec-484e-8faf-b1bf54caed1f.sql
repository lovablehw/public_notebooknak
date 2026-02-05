-- Add explicit INSERT policy to audit_events to make security intent clear
-- All inserts MUST go through the log_audit_event() SECURITY DEFINER function
CREATE POLICY "No direct insert to audit events"
ON public.audit_events
FOR INSERT
WITH CHECK (false);