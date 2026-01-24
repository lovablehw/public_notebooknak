-- Fix: Remove service admin access to individual user_questionnaire_progress records
-- Instead, provide aggregate statistics function for admin reporting

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_questionnaire_progress;

-- Create new policy that only allows users to view their own progress (no service admin bypass)
CREATE POLICY "Users can view own progress" 
ON public.user_questionnaire_progress 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a secure RPC function for service admins to get aggregate statistics only
CREATE OR REPLACE FUNCTION public.get_questionnaire_progress_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total_started', (SELECT COUNT(*) FROM user_questionnaire_progress WHERE status = 'in_progress'),
    'total_completed', (SELECT COUNT(*) FROM user_questionnaire_progress WHERE status = 'completed'),
    'total_not_started', (SELECT COUNT(*) FROM user_questionnaire_progress WHERE status = 'not_started'),
    'unique_users_with_progress', (SELECT COUNT(DISTINCT user_id) FROM user_questionnaire_progress),
    'completions_by_questionnaire', (
      SELECT json_agg(json_build_object(
        'questionnaire_id', questionnaire_id,
        'completed_count', completed_count
      ))
      FROM (
        SELECT questionnaire_id, COUNT(*) as completed_count
        FROM user_questionnaire_progress
        WHERE status = 'completed'
        GROUP BY questionnaire_id
      ) sub
    )
  )
  WHERE is_service_admin()
$$;