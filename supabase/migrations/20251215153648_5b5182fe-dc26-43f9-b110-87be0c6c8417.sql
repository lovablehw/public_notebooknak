-- Allow admins to insert audit events
CREATE POLICY "Admins can insert audit events" 
ON public.audit_events 
FOR INSERT 
WITH CHECK (is_admin());