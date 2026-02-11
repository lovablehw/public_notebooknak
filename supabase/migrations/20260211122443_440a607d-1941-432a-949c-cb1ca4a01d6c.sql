-- Restrict web_component_boxes SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can read active web component boxes" ON public.web_component_boxes;

CREATE POLICY "Authenticated users can read active web component boxes"
ON public.web_component_boxes
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND is_active = true) OR is_service_admin()
);