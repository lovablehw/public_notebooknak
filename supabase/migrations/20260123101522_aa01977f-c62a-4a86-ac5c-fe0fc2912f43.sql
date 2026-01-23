-- =====================================================
-- Challenge Engine Database Schema
-- Fully generic system with smoking cessation as MVP
-- =====================================================

-- Enum for challenge status
CREATE TYPE public.challenge_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- Enum for challenge mode (for smoking: reduction vs quitting)
CREATE TYPE public.challenge_mode AS ENUM ('tracking', 'reduction', 'quitting', 'maintenance');

-- =====================================================
-- 1. Challenge Types (Admin-configurable templates)
-- =====================================================
CREATE TABLE public.challenge_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Trophy',
  -- Which observation categories are required
  required_observation_types TEXT[] NOT NULL DEFAULT '{}',
  -- Default settings
  default_mode challenge_mode NOT NULL DEFAULT 'tracking',
  -- Display configuration
  show_daily_counter BOOLEAN NOT NULL DEFAULT true,
  show_streak_counter BOOLEAN NOT NULL DEFAULT true,
  show_health_risks BOOLEAN NOT NULL DEFAULT false,
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. Challenge Milestones (Biological/Achievement milestones)
-- =====================================================
CREATE TABLE public.challenge_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type_id UUID NOT NULL REFERENCES public.challenge_types(id) ON DELETE CASCADE,
  -- Milestone definition
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Award',
  -- Unlock conditions
  days_required INTEGER, -- e.g., 7 for "1 week smoke-free"
  target_value NUMERIC, -- e.g., target weight
  points_awarded INTEGER NOT NULL DEFAULT 0,
  -- Display order
  display_order INTEGER NOT NULL DEFAULT 0,
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. Health Risk Indicators (Fading risks for challenges)
-- =====================================================
CREATE TABLE public.challenge_health_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type_id UUID NOT NULL REFERENCES public.challenge_types(id) ON DELETE CASCADE,
  -- Risk definition
  name TEXT NOT NULL, -- e.g., "COPD", "Szívinfarktus"
  icon TEXT NOT NULL DEFAULT 'AlertTriangle',
  -- Fade schedule (after how many days risk starts decreasing)
  fade_start_days INTEGER NOT NULL DEFAULT 1,
  fade_end_days INTEGER NOT NULL DEFAULT 365, -- Full fade after this many days
  -- Display
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 4. User Challenges (Active user enrollments)
-- =====================================================
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_type_id UUID NOT NULL REFERENCES public.challenge_types(id) ON DELETE CASCADE,
  -- Status
  status challenge_status NOT NULL DEFAULT 'active',
  current_mode challenge_mode NOT NULL DEFAULT 'tracking',
  -- Tracking
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- For smoke-free tracking
  quit_date DATE, -- When user started quitting
  last_zero_logged_at TIMESTAMPTZ, -- Last time 0 cigarettes was logged
  -- Streak tracking
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One active challenge per type per user
  UNIQUE(user_id, challenge_type_id, status)
);

-- =====================================================
-- 5. User Observations (Migrated from localStorage)
-- =====================================================
CREATE TABLE public.user_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  -- Observation data
  observation_date DATE NOT NULL,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  numeric_value NUMERIC, -- For numeric observations like weight, cigarette count
  note TEXT,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast date-based queries
CREATE INDEX idx_user_observations_user_date ON public.user_observations(user_id, observation_date DESC);
CREATE INDEX idx_user_observations_category ON public.user_observations(user_id, category, observation_date DESC);

-- =====================================================
-- 6. User Milestone Unlocks
-- =====================================================
CREATE TABLE public.user_milestone_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES public.challenge_milestones(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevent duplicates
  UNIQUE(user_id, milestone_id)
);

-- =====================================================
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE public.challenge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_health_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestone_unlocks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies: Challenge Types (public read, admin write)
-- =====================================================
CREATE POLICY "Anyone can read active challenge types"
  ON public.challenge_types FOR SELECT
  USING (is_active = true OR is_service_admin());

CREATE POLICY "Service admins can insert challenge types"
  ON public.challenge_types FOR INSERT
  WITH CHECK (is_service_admin());

CREATE POLICY "Service admins can update challenge types"
  ON public.challenge_types FOR UPDATE
  USING (is_service_admin());

CREATE POLICY "Service admins can delete challenge types"
  ON public.challenge_types FOR DELETE
  USING (is_service_admin());

-- =====================================================
-- RLS Policies: Challenge Milestones
-- =====================================================
CREATE POLICY "Anyone can read milestones"
  ON public.challenge_milestones FOR SELECT
  USING (true);

CREATE POLICY "Service admins can insert milestones"
  ON public.challenge_milestones FOR INSERT
  WITH CHECK (is_service_admin());

CREATE POLICY "Service admins can update milestones"
  ON public.challenge_milestones FOR UPDATE
  USING (is_service_admin());

CREATE POLICY "Service admins can delete milestones"
  ON public.challenge_milestones FOR DELETE
  USING (is_service_admin());

-- =====================================================
-- RLS Policies: Health Risks
-- =====================================================
CREATE POLICY "Anyone can read health risks"
  ON public.challenge_health_risks FOR SELECT
  USING (true);

CREATE POLICY "Service admins can insert health risks"
  ON public.challenge_health_risks FOR INSERT
  WITH CHECK (is_service_admin());

CREATE POLICY "Service admins can update health risks"
  ON public.challenge_health_risks FOR UPDATE
  USING (is_service_admin());

CREATE POLICY "Service admins can delete health risks"
  ON public.challenge_health_risks FOR DELETE
  USING (is_service_admin());

-- =====================================================
-- RLS Policies: User Challenges
-- =====================================================
CREATE POLICY "Users can view own challenges"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id OR is_service_admin());

CREATE POLICY "Users can insert own challenges"
  ON public.user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenges"
  ON public.user_challenges FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS Policies: User Observations
-- =====================================================
CREATE POLICY "Users can view own observations"
  ON public.user_observations FOR SELECT
  USING (auth.uid() = user_id OR is_service_admin());

CREATE POLICY "Users can insert own observations"
  ON public.user_observations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own observations"
  ON public.user_observations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own observations"
  ON public.user_observations FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS Policies: Milestone Unlocks (backend-controlled)
-- =====================================================
CREATE POLICY "Users can view own milestone unlocks"
  ON public.user_milestone_unlocks FOR SELECT
  USING (auth.uid() = user_id OR is_service_admin());

CREATE POLICY "Only backend can insert milestone unlocks"
  ON public.user_milestone_unlocks FOR INSERT
  WITH CHECK (false);

-- =====================================================
-- Trigger for updated_at
-- =====================================================
CREATE TRIGGER update_challenge_types_updated_at
  BEFORE UPDATE ON public.challenge_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Seed: Smoking Cessation Challenge Type
-- =====================================================
INSERT INTO public.challenge_types (
  id, name, description, icon,
  required_observation_types,
  default_mode,
  show_daily_counter, show_streak_counter, show_health_risks
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Dohányzás leszokás',
  'Kísérd figyelemmel a dohányzási szokásaidat és kövesd nyomon a leszokás folyamatát.',
  'Cigarette',
  ARRAY['cigarette_count', 'craving_level'],
  'reduction',
  true, true, true
);

-- Seed: Milestones for Smoking Cessation
INSERT INTO public.challenge_milestones (challenge_type_id, name, description, icon, days_required, points_awarded, display_order) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '24 óra', 'Szénmonoxid-szint normalizálódik', 'Clock', 1, 50, 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '48 óra', 'Szaglás és ízérzékelés javul', 'Sparkles', 2, 75, 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1 hét', 'Fizikai függőség csökken', 'Calendar', 7, 100, 3),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '21 nap', 'Szokás megtörése', 'Trophy', 21, 200, 4),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1 hónap', 'Tüdőfunkció javulása kezdődik', 'Heart', 30, 300, 5),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '3 hónap', 'Keringés jelentősen javul', 'Activity', 90, 500, 6),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1 év', 'Szívbetegség kockázata felére csökken', 'Award', 365, 1000, 7);

-- Seed: Health Risks for Smoking
INSERT INTO public.challenge_health_risks (challenge_type_id, name, icon, fade_start_days, fade_end_days, display_order) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'COPD', 'Wind', 30, 3650, 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tüdőrák', 'AlertTriangle', 365, 3650, 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Szívbetegség', 'HeartPulse', 1, 365, 3);

-- =====================================================
-- Function: Log observation and check challenge transitions
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_challenge_observation(
  p_category TEXT,
  p_value TEXT,
  p_numeric_value NUMERIC DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_observation_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Validate inputs
  IF p_category IS NULL OR length(trim(p_category)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Category is required');
  END IF;
  
  IF length(p_category) > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Category too long');
  END IF;
  
  -- Insert the observation
  INSERT INTO public.user_observations (user_id, observation_date, category, value, numeric_value, note)
  VALUES (v_user_id, p_observation_date, p_category, p_value, p_numeric_value, p_note)
  RETURNING id INTO v_observation_id;
  
  -- Check for challenge transitions (smoking cessation specific)
  IF p_category = 'cigarette_count' AND p_numeric_value = 0 THEN
    -- User logged 0 cigarettes - check if we should transition to quitting mode
    FOR v_challenge IN 
      SELECT uc.* FROM user_challenges uc
      JOIN challenge_types ct ON uc.challenge_type_id = ct.id
      WHERE uc.user_id = v_user_id 
        AND uc.status = 'active'
        AND 'cigarette_count' = ANY(ct.required_observation_types)
        AND uc.current_mode IN ('tracking', 'reduction')
    LOOP
      -- Transition to quitting mode
      UPDATE user_challenges 
      SET current_mode = 'quitting',
          quit_date = p_observation_date,
          last_zero_logged_at = now(),
          current_streak_days = 1
      WHERE id = v_challenge.id;
      
      v_transition_occurred := true;
      v_new_mode := 'quitting';
    END LOOP;
  END IF;
  
  -- Update streak for quitting mode challenges
  IF p_category = 'cigarette_count' THEN
    FOR v_challenge IN 
      SELECT uc.* FROM user_challenges uc
      JOIN challenge_types ct ON uc.challenge_type_id = ct.id
      WHERE uc.user_id = v_user_id 
        AND uc.status = 'active'
        AND uc.current_mode = 'quitting'
        AND 'cigarette_count' = ANY(ct.required_observation_types)
    LOOP
      IF p_numeric_value = 0 THEN
        -- Continue streak
        v_days_smoke_free := GREATEST(1, p_observation_date - v_challenge.quit_date + 1);
        UPDATE user_challenges 
        SET current_streak_days = v_days_smoke_free,
            longest_streak_days = GREATEST(longest_streak_days, v_days_smoke_free),
            last_zero_logged_at = now()
        WHERE id = v_challenge.id;
      ELSE
        -- Streak broken - back to reduction mode
        UPDATE user_challenges 
        SET current_mode = 'reduction',
            quit_date = NULL,
            current_streak_days = 0
        WHERE id = v_challenge.id;
        
        v_transition_occurred := true;
        v_new_mode := 'reduction';
      END IF;
    END LOOP;
  END IF;
  
  -- Award activity points
  BEGIN
    PERFORM award_activity_points('observation_creation'::activity_type, 
      'Megfigyelés: ' || p_category);
  EXCEPTION WHEN OTHERS THEN
    -- Continue even if points fail
    NULL;
  END;
  
  RETURN json_build_object(
    'success', true,
    'observation_id', v_observation_id,
    'transition_occurred', v_transition_occurred,
    'new_mode', v_new_mode
  );
END;
$$;

-- =====================================================
-- Function: Check and unlock milestones
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_challenge_milestones(p_user_challenge_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_challenge RECORD;
  v_milestone RECORD;
  v_unlocked_milestones JSON[] := ARRAY[]::JSON[];
  v_days_in_challenge INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get the challenge
  SELECT * INTO v_challenge FROM user_challenges 
  WHERE id = p_user_challenge_id AND user_id = v_user_id;
  
  IF v_challenge IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Challenge not found');
  END IF;
  
  -- Calculate days in quitting mode
  IF v_challenge.quit_date IS NOT NULL THEN
    v_days_in_challenge := CURRENT_DATE - v_challenge.quit_date + 1;
  ELSE
    v_days_in_challenge := 0;
  END IF;
  
  -- Check each milestone
  FOR v_milestone IN 
    SELECT cm.* FROM challenge_milestones cm
    WHERE cm.challenge_type_id = v_challenge.challenge_type_id
      AND cm.is_active = true
      AND cm.days_required IS NOT NULL
      AND cm.days_required <= v_days_in_challenge
      AND NOT EXISTS (
        SELECT 1 FROM user_milestone_unlocks umu 
        WHERE umu.milestone_id = cm.id AND umu.user_id = v_user_id
      )
    ORDER BY cm.days_required
  LOOP
    -- Unlock the milestone
    INSERT INTO user_milestone_unlocks (user_id, user_challenge_id, milestone_id)
    VALUES (v_user_id, p_user_challenge_id, v_milestone.id);
    
    -- Award points if configured
    IF v_milestone.points_awarded > 0 THEN
      INSERT INTO user_points (user_id, points, reason)
      VALUES (v_user_id, v_milestone.points_awarded, 'Mérföldkő: ' || v_milestone.name);
    END IF;
    
    v_unlocked_milestones := array_append(v_unlocked_milestones, 
      json_build_object(
        'id', v_milestone.id,
        'name', v_milestone.name,
        'description', v_milestone.description,
        'icon', v_milestone.icon,
        'points', v_milestone.points_awarded
      )
    );
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'unlocked_milestones', v_unlocked_milestones,
    'days_in_challenge', v_days_in_challenge
  );
END;
$$;