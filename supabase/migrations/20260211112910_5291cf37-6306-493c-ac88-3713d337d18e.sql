
-- Rate limiting table for tracking RPC call frequency
CREATE TABLE public.rpc_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  called_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_rpc_rate_limits_lookup ON public.rpc_rate_limits (user_id, function_name, called_at DESC);

-- Enable RLS
ALTER TABLE public.rpc_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access - only via SECURITY DEFINER functions
CREATE POLICY "No direct access to rate limits" ON public.rpc_rate_limits FOR ALL USING (false) WITH CHECK (false);

-- Cleanup function to purge old entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.rpc_rate_limits WHERE called_at < now() - interval '1 hour';
$$;

-- Helper: check rate limit (returns true if allowed, false if rate limited)
-- max_calls within window_seconds
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_function_name text,
  p_max_calls integer DEFAULT 10,
  p_window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Count recent calls within window
  SELECT COUNT(*) INTO v_count
  FROM public.rpc_rate_limits
  WHERE user_id = v_user_id
    AND function_name = p_function_name
    AND called_at > now() - (p_window_seconds || ' seconds')::interval;

  IF v_count >= p_max_calls THEN
    RETURN false;
  END IF;

  -- Record this call
  INSERT INTO public.rpc_rate_limits (user_id, function_name)
  VALUES (v_user_id, p_function_name);

  -- Opportunistic cleanup (1% chance)
  IF random() < 0.01 THEN
    PERFORM public.cleanup_old_rate_limits();
  END IF;

  RETURN true;
END;
$$;

-- Update add_user_points with rate limiting (max 20 calls per 60 seconds)
CREATE OR REPLACE FUNCTION public.add_user_points(p_points integer, p_reason text, p_questionnaire_id text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_total_points INTEGER;
  v_new_achievements json[];
  v_achievement RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Rate limit: max 20 calls per 60 seconds
  IF NOT public.check_rate_limit('add_user_points', 20, 60) THEN
    RETURN json_build_object('success', false, 'error', 'Too many requests, please try again later');
  END IF;
  
  IF p_points <= 0 OR p_points > 1000 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid points value');
  END IF;
  
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Reason is required');
  END IF;
  
  IF length(p_reason) > 500 THEN
    RETURN json_build_object('success', false, 'error', 'Reason too long');
  END IF;
  
  IF p_questionnaire_id IS NOT NULL THEN
    IF length(p_questionnaire_id) > 100 THEN
      RETURN json_build_object('success', false, 'error', 'Questionnaire ID too long');
    END IF;
    IF p_questionnaire_id !~ '^[a-zA-Z0-9_-]+$' THEN
      RETURN json_build_object('success', false, 'error', 'Invalid questionnaire ID format');
    END IF;
  END IF;
  
  IF p_questionnaire_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.user_points 
      WHERE user_id = v_user_id AND questionnaire_id = p_questionnaire_id
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Points already awarded for this questionnaire');
    END IF;
  END IF;
  
  INSERT INTO public.user_points (user_id, points, reason, questionnaire_id)
  VALUES (v_user_id, p_points, p_reason, p_questionnaire_id);
  
  SELECT COALESCE(SUM(points), 0) INTO v_total_points
  FROM public.user_points WHERE user_id = v_user_id;
  
  v_new_achievements := ARRAY[]::json[];
  
  FOR v_achievement IN 
    SELECT a.* FROM public.achievements a
    WHERE a.points_required <= v_total_points
    AND NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua 
      WHERE ua.user_id = v_user_id AND ua.achievement_id = a.id
    )
  LOOP
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (v_user_id, v_achievement.id);
    
    v_new_achievements := array_append(v_new_achievements, 
      json_build_object('id', v_achievement.id, 'name', v_achievement.name, 
        'description', v_achievement.description, 'icon', v_achievement.icon,
        'points_required', v_achievement.points_required));
  END LOOP;
  
  RETURN json_build_object('success', true, 'total_points', v_total_points, 'new_achievements', v_new_achievements);
END;
$$;

-- Update log_audit_event with rate limiting (max 30 calls per 60 seconds)
CREATE OR REPLACE FUNCTION public.log_audit_event(p_event_type text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to log events';
  END IF;

  -- Rate limit: max 30 calls per 60 seconds
  IF NOT public.check_rate_limit('log_audit_event', 30, 60) THEN
    RAISE EXCEPTION 'Too many requests, please try again later';
  END IF;
  
  IF p_event_type IS NULL OR length(trim(p_event_type)) = 0 THEN
    RAISE EXCEPTION 'Event type is required';
  END IF;
  
  IF length(p_event_type) > 100 THEN
    RAISE EXCEPTION 'Event type must be less than 100 characters';
  END IF;
  
  IF p_event_type !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Event type contains invalid characters';
  END IF;
  
  IF pg_column_size(p_metadata) > 10240 THEN
    RAISE EXCEPTION 'Metadata too large (max 10KB)';
  END IF;
  
  IF (p_event_type LIKE 'admin_%') AND NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin events require admin privileges';
  END IF;
  
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  INSERT INTO public.audit_events (event_type, actor_user_id, actor_email, metadata)
  VALUES (p_event_type, v_user_id, v_user_email, p_metadata);
END;
$$;

-- Also add rate limiting to log_challenge_observation (max 30 calls per 60 seconds)
CREATE OR REPLACE FUNCTION public.log_challenge_observation(p_category text, p_value text, p_numeric_value numeric DEFAULT NULL::numeric, p_note text DEFAULT NULL::text, p_observation_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_observation_id UUID;
  v_challenge RECORD;
  v_result JSON;
  v_transition_occurred BOOLEAN := false;
  v_new_mode challenge_mode;
  v_days_smoke_free INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Rate limit: max 30 calls per 60 seconds
  IF NOT public.check_rate_limit('log_challenge_observation', 30, 60) THEN
    RETURN json_build_object('success', false, 'error', 'Too many requests, please try again later');
  END IF;
  
  IF p_category IS NULL OR length(trim(p_category)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Category is required');
  END IF;
  
  IF length(p_category) > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Category too long');
  END IF;
  
  INSERT INTO public.user_observations (user_id, observation_date, category, value, numeric_value, note)
  VALUES (v_user_id, p_observation_date, p_category, p_value, p_numeric_value, p_note)
  RETURNING id INTO v_observation_id;
  
  IF p_category = 'cigarette_count' AND p_numeric_value = 0 THEN
    FOR v_challenge IN 
      SELECT uc.* FROM user_challenges uc
      JOIN challenge_types ct ON uc.challenge_type_id = ct.id
      WHERE uc.user_id = v_user_id AND uc.status = 'active'
        AND 'cigarette_count' = ANY(ct.required_observation_types)
        AND uc.current_mode IN ('tracking', 'reduction')
    LOOP
      UPDATE user_challenges 
      SET current_mode = 'quitting', quit_date = p_observation_date,
          last_zero_logged_at = now(), current_streak_days = 1
      WHERE id = v_challenge.id;
      v_transition_occurred := true;
      v_new_mode := 'quitting';
    END LOOP;
  END IF;
  
  IF p_category = 'cigarette_count' THEN
    FOR v_challenge IN 
      SELECT uc.* FROM user_challenges uc
      JOIN challenge_types ct ON uc.challenge_type_id = ct.id
      WHERE uc.user_id = v_user_id AND uc.status = 'active'
        AND uc.current_mode = 'quitting'
        AND 'cigarette_count' = ANY(ct.required_observation_types)
    LOOP
      IF p_numeric_value = 0 THEN
        v_days_smoke_free := GREATEST(1, p_observation_date - v_challenge.quit_date + 1);
        UPDATE user_challenges 
        SET current_streak_days = v_days_smoke_free,
            longest_streak_days = GREATEST(longest_streak_days, v_days_smoke_free),
            last_zero_logged_at = now()
        WHERE id = v_challenge.id;
      ELSE
        UPDATE user_challenges 
        SET current_mode = 'reduction', quit_date = NULL, current_streak_days = 0
        WHERE id = v_challenge.id;
        v_transition_occurred := true;
        v_new_mode := 'reduction';
      END IF;
    END LOOP;
  END IF;
  
  BEGIN
    PERFORM award_activity_points('observation_creation'::activity_type, 'Megfigyelés: ' || p_category);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  RETURN json_build_object('success', true, 'observation_id', v_observation_id,
    'transition_occurred', v_transition_occurred, 'new_mode', v_new_mode);
END;
$$;
