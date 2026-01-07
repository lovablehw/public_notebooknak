-- Add INSERT policy to prevent direct client-side inserts
-- Points should only be inserted via the add_user_points or award_activity_points RPC functions
CREATE POLICY "Only backend can insert points" 
ON public.user_points 
FOR INSERT 
WITH CHECK (false);