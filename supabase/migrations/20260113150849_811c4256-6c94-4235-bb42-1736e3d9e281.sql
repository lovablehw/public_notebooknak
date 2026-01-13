-- Add comprehensive input validation to all SECURITY DEFINER RPC functions

-- 1. Update add_user_points with text length validation
CREATE OR REPLACE FUNCTION public.add_user_points(p_points integer, p_reason text, p_questionnaire_id text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_total_points INTEGER;
  v_new_achievements json[];
  v_achievement RECORD;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate points (must be positive and reasonable)
  IF p_points <= 0 OR p_points > 1000 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid points value');
  END IF;
  
  -- Validate reason (must not be empty and max 500 chars)
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Reason is required');
  END IF;
  
  IF length(p_reason) > 500 THEN
    RETURN json_build_object('success', false, 'error', 'Reason too long');
  END IF;
  
  -- Validate questionnaire_id if provided (max 100 chars, alphanumeric with dashes/underscores)
  IF p_questionnaire_id IS NOT NULL THEN
    IF length(p_questionnaire_id) > 100 THEN
      RETURN json_build_object('success', false, 'error', 'Questionnaire ID too long');
    END IF;
    
    IF p_questionnaire_id !~ '^[a-zA-Z0-9_-]+$' THEN
      RETURN json_build_object('success', false, 'error', 'Invalid questionnaire ID format');
    END IF;
  END IF;
  
  -- Check if this questionnaire was already completed (prevent duplicate submissions)
  IF p_questionnaire_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.user_points 
      WHERE user_id = v_user_id 
      AND questionnaire_id = p_questionnaire_id
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Points already awarded for this questionnaire');
    END IF;
  END IF;
  
  -- Insert the points
  INSERT INTO public.user_points (user_id, points, reason, questionnaire_id)
  VALUES (v_user_id, p_points, p_reason, p_questionnaire_id);
  
  -- Calculate total points
  SELECT COALESCE(SUM(points), 0) INTO v_total_points
  FROM public.user_points
  WHERE user_id = v_user_id;
  
  -- Check and unlock new achievements
  v_new_achievements := ARRAY[]::json[];
  
  FOR v_achievement IN 
    SELECT a.* FROM public.achievements a
    WHERE a.points_required <= v_total_points
    AND NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua 
      WHERE ua.user_id = v_user_id AND ua.achievement_id = a.id
    )
  LOOP
    -- Insert the achievement
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (v_user_id, v_achievement.id);
    
    -- Add to new achievements array
    v_new_achievements := array_append(
      v_new_achievements, 
      json_build_object(
        'id', v_achievement.id,
        'name', v_achievement.name,
        'description', v_achievement.description,
        'icon', v_achievement.icon,
        'points_required', v_achievement.points_required
      )
    );
  END LOOP;
  
  RETURN json_build_object(
    'success', true, 
    'total_points', v_total_points,
    'new_achievements', v_new_achievements
  );
END;
$function$;

-- 2. Update award_activity_points with description validation
CREATE OR REPLACE FUNCTION public.award_activity_points(p_activity_type activity_type, p_description text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_rule RECORD;
  v_activity_count RECORD;
  v_today DATE;
  v_can_reward BOOLEAN := false;
  v_total_points INTEGER;
  v_new_achievements json[];
  v_achievement RECORD;
  v_condition_met BOOLEAN;
  v_all_conditions_met BOOLEAN;
  v_description text;
BEGIN
  v_user_id := auth.uid();
  v_today := CURRENT_DATE;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate p_description if provided (max 500 chars)
  IF p_description IS NOT NULL AND length(p_description) > 500 THEN
    RETURN json_build_object('success', false, 'error', 'Description too long');
  END IF;
  
  -- Get the reward rule for this activity type
  SELECT * INTO v_rule FROM public.reward_rules 
  WHERE activity_type = p_activity_type AND is_active = true;
  
  IF v_rule IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No active reward rule for this activity');
  END IF;
  
  -- Get or create activity count record
  SELECT * INTO v_activity_count FROM public.user_activity_counts
  WHERE user_id = v_user_id AND activity_type = p_activity_type;
  
  -- Check frequency rules
  IF v_rule.frequency = 'per_event' THEN
    v_can_reward := true;
  ELSIF v_rule.frequency = 'daily' THEN
    IF v_activity_count IS NULL OR v_activity_count.last_activity_date IS NULL OR v_activity_count.last_activity_date < v_today THEN
      v_can_reward := true;
    END IF;
  ELSIF v_rule.frequency = 'once_total' THEN
    IF v_activity_count IS NULL OR v_activity_count.total_count = 0 THEN
      v_can_reward := true;
    END IF;
  END IF;
  
  -- Update activity count (always, regardless of reward)
  IF v_activity_count IS NULL THEN
    INSERT INTO public.user_activity_counts (user_id, activity_type, total_count, last_activity_date)
    VALUES (v_user_id, p_activity_type, 1, v_today);
  ELSE
    UPDATE public.user_activity_counts 
    SET total_count = total_count + 1, 
        last_activity_date = v_today,
        updated_at = now()
    WHERE id = v_activity_count.id;
  END IF;
  
  -- Award points if eligible
  IF v_can_reward THEN
    -- Build description (use provided or default, already validated for length)
    v_description := COALESCE(p_description, 
      CASE p_activity_type
        WHEN 'questionnaire_completion' THEN 'Kérdőív kitöltése'
        WHEN 'lab_upload' THEN 'Laboreredmény feltöltése'
        WHEN 'discharge_upload' THEN 'Zárójelentés feltöltése'
        WHEN 'patient_summary_upload' THEN 'Betegösszefoglaló feltöltése'
        WHEN 'observation_creation' THEN 'Saját megfigyelés rögzítése'
      END
    );
    
    -- Insert points
    INSERT INTO public.user_points (user_id, points, reason)
    VALUES (v_user_id, v_rule.points, v_description);
    
    -- Calculate total points
    SELECT COALESCE(SUM(points), 0) INTO v_total_points
    FROM public.user_points
    WHERE user_id = v_user_id;
    
    -- Check and unlock achievements based on activity conditions
    v_new_achievements := ARRAY[]::json[];
    
    FOR v_achievement IN 
      SELECT a.* FROM public.achievements a
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua 
        WHERE ua.user_id = v_user_id AND ua.achievement_id = a.id
      )
    LOOP
      v_all_conditions_met := true;
      
      -- Check points threshold if set
      IF v_achievement.min_points_threshold IS NOT NULL AND v_total_points < v_achievement.min_points_threshold THEN
        v_all_conditions_met := false;
      END IF;
      
      -- Check legacy points_required
      IF v_achievement.points_required > 0 AND v_total_points < v_achievement.points_required THEN
        v_all_conditions_met := false;
      END IF;
      
      -- Check activity-based conditions
      IF v_all_conditions_met THEN
        FOR v_condition_met IN 
          SELECT 
            COALESCE(uac.total_count, 0) >= bc.required_count as met
          FROM public.badge_conditions bc
          LEFT JOIN public.user_activity_counts uac 
            ON uac.user_id = v_user_id AND uac.activity_type = bc.activity_type
          WHERE bc.achievement_id = v_achievement.id
        LOOP
          IF NOT v_condition_met.met THEN
            v_all_conditions_met := false;
            EXIT;
          END IF;
        END LOOP;
      END IF;
      
      -- Unlock achievement if all conditions met
      IF v_all_conditions_met THEN
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (v_user_id, v_achievement.id);
        
        v_new_achievements := array_append(
          v_new_achievements, 
          json_build_object(
            'id', v_achievement.id,
            'name', v_achievement.name,
            'description', v_achievement.description,
            'icon', v_achievement.icon
          )
        );
      END IF;
    END LOOP;
    
    RETURN json_build_object(
      'success', true,
      'points_awarded', v_rule.points,
      'total_points', v_total_points,
      'new_achievements', v_new_achievements
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Already rewarded based on frequency rule',
      'already_rewarded', true
    );
  END IF;
END;
$function$;

-- 3. Update award_upload_points with upload_type validation
CREATE OR REPLACE FUNCTION public.award_upload_points(p_upload_type text, p_points integer DEFAULT 30)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_today DATE;
  v_already_rewarded BOOLEAN;
  v_result json;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  v_today := CURRENT_DATE;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate upload_type (required, max 50 chars, alphanumeric with underscores)
  IF p_upload_type IS NULL OR length(trim(p_upload_type)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Upload type is required');
  END IF;
  
  IF length(p_upload_type) > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Upload type too long');
  END IF;
  
  IF p_upload_type !~ '^[a-zA-Z0-9_-]+$' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid upload type format');
  END IF;
  
  -- Validate points (must be positive and reasonable)
  IF p_points <= 0 OR p_points > 1000 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid points value');
  END IF;
  
  -- Check if already rewarded today for this upload type
  SELECT EXISTS (
    SELECT 1 FROM public.upload_rewards 
    WHERE user_id = v_user_id 
    AND upload_type = p_upload_type
    AND upload_date = v_today
  ) INTO v_already_rewarded;
  
  IF v_already_rewarded THEN
    RETURN json_build_object('success', false, 'error', 'Already rewarded today for this upload type', 'already_rewarded', true);
  END IF;
  
  -- Record the upload reward
  INSERT INTO public.upload_rewards (user_id, upload_type, upload_date, points_awarded)
  VALUES (v_user_id, p_upload_type, v_today, p_points);
  
  -- Award points using the existing add_user_points function
  SELECT public.add_user_points(p_points, 'Dokumentum feltöltés: ' || p_upload_type, NULL) INTO v_result;
  
  RETURN json_build_object(
    'success', true,
    'points_awarded', p_points,
    'add_points_result', v_result
  );
END;
$function$;

-- 4. Update log_audit_event with metadata size validation
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
  
  -- Check if the user is an admin before allowing audit log insertion
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can log audit events';
  END IF;
  
  -- Insert the audit event
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