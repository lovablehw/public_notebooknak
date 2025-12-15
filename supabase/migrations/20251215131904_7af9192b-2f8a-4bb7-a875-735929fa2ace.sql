-- Create audit_events table for admin log functionality
CREATE TABLE public.audit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to insert (for logging events)
CREATE POLICY "Authenticated users can insert audit events"
ON public.audit_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins will read via service role or we'll create a function
-- For now, allow authenticated users to read their own events
CREATE POLICY "Users can view their own audit events"
ON public.audit_events
FOR SELECT
TO authenticated
USING (actor_user_id = auth.uid());

-- Add index for faster queries
CREATE INDEX idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX idx_audit_events_event_type ON public.audit_events(event_type);

-- Enable realtime for audit_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_events;