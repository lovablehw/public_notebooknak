-- Add RLS policies for admin management of achievements

-- Allow admins to insert achievements
CREATE POLICY "Admins can insert achievements"
ON public.achievements
FOR INSERT
WITH CHECK (public.is_admin());

-- Allow admins to update achievements
CREATE POLICY "Admins can update achievements"
ON public.achievements
FOR UPDATE
USING (public.is_admin());

-- Allow admins to delete achievements
CREATE POLICY "Admins can delete achievements"
ON public.achievements
FOR DELETE
USING (public.is_admin());