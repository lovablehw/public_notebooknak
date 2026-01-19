-- Create a trigger to auto-insert button_configs when questionnaire is created
-- The gomb_azonosito is based on the questionnaire ID for uniqueness

CREATE OR REPLACE FUNCTION public.sync_button_config_after_questionnaire_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new button_config with default '/404' target_url
  -- The gomb_azonosito is prefixed with 'q_' and uses the questionnaire id
  INSERT INTO public.button_configs (
    gomb_azonosito,
    button_label,
    tooltip,
    target_url,
    url_target
  ) VALUES (
    'q_' || NEW.id::text,
    'Kezdés',
    NULL,
    '/404',
    '_blank'
  )
  ON CONFLICT (gomb_azonosito) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on questionnaires_config table
DROP TRIGGER IF EXISTS trigger_sync_button_config ON public.questionnaires_config;

CREATE TRIGGER trigger_sync_button_config
  AFTER INSERT ON public.questionnaires_config
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_button_config_after_questionnaire_insert();

-- Also create button_configs for existing questionnaires that don't have one
INSERT INTO public.button_configs (gomb_azonosito, button_label, target_url, url_target)
SELECT 
  'q_' || qc.id::text,
  'Kezdés',
  COALESCE(qc.target_url, '/404'),
  '_blank'
FROM public.questionnaires_config qc
WHERE NOT EXISTS (
  SELECT 1 FROM public.button_configs bc 
  WHERE bc.gomb_azonosito = 'q_' || qc.id::text
);