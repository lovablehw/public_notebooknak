-- Create a SECURITY DEFINER function to add points with validation
-- This function validates the input and inserts points server-side
CREATE OR REPLACE FUNCTION public.add_user_points(
  p_points INTEGER,
  p_reason TEXT,
  p_questionnaire_id TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Validate reason (must not be empty)
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Reason is required');
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
$$;

-- Drop existing INSERT policies on user_points and user_achievements
DROP POLICY IF EXISTS "Users can insert their own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.add_user_points TO authenticated;