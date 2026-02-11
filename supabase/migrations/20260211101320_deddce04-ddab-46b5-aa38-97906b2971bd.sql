
-- Create web_component_boxes table
CREATE TABLE public.web_component_boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anchor_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  html_content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.web_component_boxes ENABLE ROW LEVEL SECURITY;

-- Public read access for active boxes
CREATE POLICY "Anyone can read active web component boxes"
ON public.web_component_boxes
FOR SELECT
USING (is_active = true OR is_service_admin());

-- Service admins can insert
CREATE POLICY "Service admins can insert web component boxes"
ON public.web_component_boxes
FOR INSERT
WITH CHECK (is_service_admin());

-- Service admins can update
CREATE POLICY "Service admins can update web component boxes"
ON public.web_component_boxes
FOR UPDATE
USING (is_service_admin());

-- Service admins can delete
CREATE POLICY "Service admins can delete web component boxes"
ON public.web_component_boxes
FOR DELETE
USING (is_service_admin());

-- Auto-update updated_at
CREATE TRIGGER update_web_component_boxes_updated_at
BEFORE UPDATE ON public.web_component_boxes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
