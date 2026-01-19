-- Create function to auto-add new users to all_users group
CREATE OR REPLACE FUNCTION public.add_user_to_default_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_group_id UUID;
BEGIN
  -- Get the all_users group ID
  SELECT id INTO default_group_id
  FROM public.user_groups
  WHERE name = 'all_users'
  LIMIT 1;
  
  -- If the group exists, add the user to it
  IF default_group_id IS NOT NULL THEN
    INSERT INTO public.user_group_members (user_id, group_id)
    VALUES (NEW.id, default_group_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-add users to default group
CREATE TRIGGER on_auth_user_created_add_to_default_group
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.add_user_to_default_group();