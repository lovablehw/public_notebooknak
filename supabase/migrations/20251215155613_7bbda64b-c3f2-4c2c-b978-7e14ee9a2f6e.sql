-- Add user_id column to admin_users for secure identification
ALTER TABLE public.admin_users 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);

-- Update is_admin function to check by user_id directly (more secure)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  )
$$;

-- Populate user_id for existing admin records where email matches
UPDATE public.admin_users au
SET user_id = u.id
FROM auth.users u
WHERE lower(u.email) = lower(au.email);

-- Add unique constraint on user_id to prevent duplicates
ALTER TABLE public.admin_users 
ADD CONSTRAINT admin_users_user_id_unique UNIQUE (user_id);