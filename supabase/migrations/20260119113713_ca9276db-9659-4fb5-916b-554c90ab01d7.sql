-- Create enum for URL target
CREATE TYPE public.url_target_type AS ENUM ('_blank', '_self');

-- Create button_configs table
CREATE TABLE public.button_configs (
  gomb_azonosito TEXT PRIMARY KEY,
  button_label TEXT NOT NULL DEFAULT 'Kezdés',
  tooltip TEXT,
  target_url TEXT,
  url_target public.url_target_type NOT NULL DEFAULT '_blank',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.button_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Anyone can read button configs (needed for widgets to display buttons)
CREATE POLICY "Anyone can read button configs"
ON public.button_configs
FOR SELECT
USING (true);

-- Only super_admin can insert
CREATE POLICY "Super admins can insert button configs"
ON public.button_configs
FOR INSERT
WITH CHECK (is_super_admin());

-- Only super_admin can update
CREATE POLICY "Super admins can update button configs"
ON public.button_configs
FOR UPDATE
USING (is_super_admin());

-- Only super_admin can delete
CREATE POLICY "Super admins can delete button configs"
ON public.button_configs
FOR DELETE
USING (is_super_admin());

-- Trigger for updated_at
CREATE TRIGGER update_button_configs_updated_at
BEFORE UPDATE ON public.button_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from questionnaires_config
INSERT INTO public.button_configs (gomb_azonosito, button_label, target_url, url_target)
SELECT 
  id::text AS gomb_azonosito,
  'Kezdés' AS button_label,
  target_url,
  '_blank'::public.url_target_type AS url_target
FROM public.questionnaires_config
ON CONFLICT (gomb_azonosito) DO NOTHING;

-- Create trigger function to auto-insert into button_configs when new questionnaire is created
CREATE OR REPLACE FUNCTION public.sync_button_config_on_questionnaire_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.button_configs (gomb_azonosito, button_label, target_url, url_target)
  VALUES (NEW.id::text, 'Kezdés', NEW.target_url, '_blank')
  ON CONFLICT (gomb_azonosito) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on questionnaires_config
CREATE TRIGGER sync_button_config_after_questionnaire_insert
AFTER INSERT ON public.questionnaires_config
FOR EACH ROW
EXECUTE FUNCTION public.sync_button_config_on_questionnaire_insert();