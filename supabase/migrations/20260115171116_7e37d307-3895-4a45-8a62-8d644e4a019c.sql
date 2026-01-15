-- =====================================================
-- Questionnaires Configuration & Permissions System
-- =====================================================

-- 1. Create admin_role enum type
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'service_admin');

-- 2. Create user_groups table for grouping users
CREATE TABLE public.user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create user_group_members table to link users to groups
CREATE TABLE public.user_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, group_id)
);

-- 4. Create questionnaires_config table
CREATE TABLE public.questionnaires_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  completion_time INTEGER NOT NULL DEFAULT 5,
  points INTEGER NOT NULL DEFAULT 10,
  deadline TIMESTAMP WITH TIME ZONE,
  target_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create questionnaire_permissions table (links user_groups to questionnaires)
CREATE TABLE public.questionnaire_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires_config(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (questionnaire_id, group_id)
);

-- 6. Create admin_roles table (separate from admin_users for role-based access)
CREATE TABLE public.admin_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role admin_role NOT NULL DEFAULT 'service_admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create user_questionnaire_progress table to track completion status per user
CREATE TABLE public.user_questionnaire_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires_config(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, questionnaire_id)
);

-- =====================================================
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_questionnaire_progress ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Check if user has a specific admin role
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID, _role admin_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles ar
    WHERE ar.user_id = _user_id
      AND ar.role = _role
  )
$$;

-- Check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_admin_role(auth.uid(), 'super_admin')
$$;

-- Check if user is service_admin or super_admin
CREATE OR REPLACE FUNCTION public.is_service_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid()
      AND ar.role IN ('super_admin', 'service_admin')
  )
$$;

-- Get questionnaires visible to current user based on group membership
CREATE OR REPLACE FUNCTION public.get_user_questionnaires()
RETURNS SETOF public.questionnaires_config
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT qc.*
  FROM public.questionnaires_config qc
  JOIN public.questionnaire_permissions qp ON qc.id = qp.questionnaire_id
  JOIN public.user_group_members ugm ON qp.group_id = ugm.group_id
  WHERE ugm.user_id = auth.uid()
    AND qc.is_active = true
    AND (qc.deadline IS NULL OR qc.deadline > now())
  ORDER BY qc.created_at DESC
$$;

-- =====================================================
-- RLS Policies for user_groups
-- =====================================================

CREATE POLICY "Anyone can read user groups"
ON public.user_groups FOR SELECT
USING (true);

CREATE POLICY "Service admins can insert groups"
ON public.user_groups FOR INSERT
WITH CHECK (public.is_service_admin());

CREATE POLICY "Service admins can update groups"
ON public.user_groups FOR UPDATE
USING (public.is_service_admin());

CREATE POLICY "Service admins can delete groups"
ON public.user_groups FOR DELETE
USING (public.is_service_admin());

-- =====================================================
-- RLS Policies for user_group_members
-- =====================================================

CREATE POLICY "Users can view own group memberships"
ON public.user_group_members FOR SELECT
USING (auth.uid() = user_id OR public.is_service_admin());

CREATE POLICY "Service admins can insert memberships"
ON public.user_group_members FOR INSERT
WITH CHECK (public.is_service_admin());

CREATE POLICY "Service admins can delete memberships"
ON public.user_group_members FOR DELETE
USING (public.is_service_admin());

-- =====================================================
-- RLS Policies for questionnaires_config
-- =====================================================

CREATE POLICY "Users can view permitted questionnaires"
ON public.questionnaires_config FOR SELECT
USING (
  public.is_service_admin() OR
  EXISTS (
    SELECT 1 
    FROM public.questionnaire_permissions qp
    JOIN public.user_group_members ugm ON qp.group_id = ugm.group_id
    WHERE qp.questionnaire_id = questionnaires_config.id AND ugm.user_id = auth.uid()
  )
);

CREATE POLICY "Service admins can insert questionnaires"
ON public.questionnaires_config FOR INSERT
WITH CHECK (public.is_service_admin());

CREATE POLICY "Service admins can update questionnaires"
ON public.questionnaires_config FOR UPDATE
USING (public.is_service_admin());

CREATE POLICY "Service admins can delete questionnaires"
ON public.questionnaires_config FOR DELETE
USING (public.is_service_admin());

-- =====================================================
-- RLS Policies for questionnaire_permissions
-- =====================================================

CREATE POLICY "Service admins can view permissions"
ON public.questionnaire_permissions FOR SELECT
USING (public.is_service_admin());

CREATE POLICY "Service admins can insert permissions"
ON public.questionnaire_permissions FOR INSERT
WITH CHECK (public.is_service_admin());

CREATE POLICY "Service admins can delete permissions"
ON public.questionnaire_permissions FOR DELETE
USING (public.is_service_admin());

-- =====================================================
-- RLS Policies for admin_roles
-- =====================================================

CREATE POLICY "Users can view own or super admin can view all roles"
ON public.admin_roles FOR SELECT
USING (public.is_super_admin() OR auth.uid() = user_id);

CREATE POLICY "Super admins can insert roles"
ON public.admin_roles FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update roles"
ON public.admin_roles FOR UPDATE
USING (public.is_super_admin());

CREATE POLICY "Super admins can delete roles"
ON public.admin_roles FOR DELETE
USING (public.is_super_admin());

-- =====================================================
-- RLS Policies for user_questionnaire_progress
-- =====================================================

CREATE POLICY "Users can view own progress"
ON public.user_questionnaire_progress FOR SELECT
USING (auth.uid() = user_id OR public.is_service_admin());

CREATE POLICY "Users can insert own progress"
ON public.user_questionnaire_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_questionnaire_progress FOR UPDATE
USING (auth.uid() = user_id);

-- =====================================================
-- Triggers for updated_at
-- =====================================================

CREATE TRIGGER update_user_groups_updated_at
BEFORE UPDATE ON public.user_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questionnaires_config_updated_at
BEFORE UPDATE ON public.questionnaires_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_roles_updated_at
BEFORE UPDATE ON public.admin_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_questionnaire_progress_updated_at
BEFORE UPDATE ON public.user_questionnaire_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Seed Data: Create default "all_users" group
-- =====================================================

INSERT INTO public.user_groups (name, description)
VALUES ('all_users', 'Alapértelmezett csoport minden felhasználó számára')
ON CONFLICT (name) DO NOTHING;