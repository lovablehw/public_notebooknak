-- Create table to track upload rewards (prevents duplicate point awards)
CREATE TABLE public.upload_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  upload_type TEXT NOT NULL,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_awarded INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, upload_type, upload_date)
);

-- Enable Row Level Security
ALTER TABLE public.upload_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own upload rewards
CREATE POLICY "Users can view own upload rewards" 
ON public.upload_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to award upload points (prevents duplicate rewards)
CREATE OR REPLACE FUNCTION public.award_upload_points(
  p_upload_type TEXT,
  p_points INTEGER DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Validate upload_type
  IF p_upload_type IS NULL OR length(trim(p_upload_type)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Upload type is required');
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
$$;