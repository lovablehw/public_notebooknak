-- Create enum for activity types
CREATE TYPE public.activity_type AS ENUM (
  'questionnaire_completion',
  'lab_upload',
  'discharge_upload',
  'patient_summary_upload',
  'observation_creation'
);

-- Create enum for reward frequency
CREATE TYPE public.reward_frequency AS ENUM (
  'per_event',
  'daily',
  'once_total'
);

-- Create reward_rules table for configurable point values
CREATE TABLE public.reward_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type activity_type NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 10,
  frequency reward_frequency NOT NULL DEFAULT 'per_event',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_activity_counts table to track activity frequency
CREATE TABLE public.user_activity_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type activity_type NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_type)
);

-- Create badge_conditions table for activity-based badge unlocking
CREATE TABLE public.badge_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  required_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(achievement_id, activity_type)
);

-- Add min_points_threshold to achievements for optional points-based unlocking
ALTER TABLE public.achievements 
ADD COLUMN min_points_threshold INTEGER DEFAULT NULL;

-- Enable RLS on new tables
ALTER TABLE public.reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_conditions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reward_rules (admins manage, everyone reads active rules)
CREATE POLICY "Anyone can read active reward rules"
ON public.reward_rules
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert reward rules"
ON public.reward_rules
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update reward rules"
ON public.reward_rules
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete reward rules"
ON public.reward_rules
FOR DELETE
USING (public.is_admin());

-- RLS policies for user_activity_counts
CREATE POLICY "Users can view own activity counts"
ON public.user_activity_counts
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only backend can modify activity counts"
ON public.user_activity_counts
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only backend can update activity counts"
ON public.user_activity_counts
FOR UPDATE
USING (false);

-- RLS policies for badge_conditions
CREATE POLICY "Anyone can read badge conditions"
ON public.badge_conditions
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert badge conditions"
ON public.badge_conditions
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update badge conditions"
ON public.badge_conditions
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete badge conditions"
ON public.badge_conditions
FOR DELETE
USING (public.is_admin());

-- Insert default reward rules for all activity types
INSERT INTO public.reward_rules (activity_type, points, frequency, is_active) VALUES
  ('questionnaire_completion', 10, 'per_event', true),
  ('lab_upload', 30, 'daily', true),
  ('discharge_upload', 30, 'daily', true),
  ('patient_summary_upload', 30, 'daily', true),
  ('observation_creation', 5, 'per_event', true);

-- Create function to award points based on reward rules
CREATE OR REPLACE FUNCTION public.award_activity_points(p_activity_type activity_type, p_description text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    -- Build description
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
$$;

-- Update trigger for updated_at
CREATE TRIGGER update_reward_rules_updated_at
BEFORE UPDATE ON public.reward_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_activity_counts_updated_at
BEFORE UPDATE ON public.user_activity_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();