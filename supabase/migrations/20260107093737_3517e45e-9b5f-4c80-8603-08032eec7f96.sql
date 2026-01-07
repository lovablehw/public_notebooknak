-- Add explicit deny-all INSERT policy for upload_rewards table
-- This matches the pattern used for user_achievements and provides defense-in-depth
CREATE POLICY "Only backend can insert upload rewards"
ON public.upload_rewards
FOR INSERT
WITH CHECK (false);