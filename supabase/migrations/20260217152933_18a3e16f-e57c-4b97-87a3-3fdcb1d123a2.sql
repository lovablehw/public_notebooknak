-- Drop the old unique constraint that prevents re-consenting after withdrawal
ALTER TABLE public.user_consents DROP CONSTRAINT user_consents_user_id_consent_version_id_key;

-- Add a partial unique index: only one active (non-withdrawn) consent per user per version
CREATE UNIQUE INDEX user_consents_active_unique ON public.user_consents (user_id, consent_version_id) WHERE withdrawn_at IS NULL;

-- Allow users to delete their own withdrawn consents (needed for re-consenting)
CREATE POLICY "Users can delete own withdrawn consents"
ON public.user_consents
FOR DELETE
USING (auth.uid() = user_id AND withdrawn_at IS NOT NULL);