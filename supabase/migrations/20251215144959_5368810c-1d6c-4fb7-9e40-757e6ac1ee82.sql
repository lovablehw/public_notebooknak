-- Allow admins to add new admin users
CREATE POLICY "Admins can insert admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (is_admin());

-- Allow admins to delete admin users
CREATE POLICY "Admins can delete admin users" 
ON public.admin_users 
FOR DELETE 
USING (is_admin());