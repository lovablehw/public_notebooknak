
-- Server-side HTML sanitization trigger for web_component_boxes
-- Strips dangerous tags (script, iframe, object, embed, form, etc.) and event handler attributes

CREATE OR REPLACE FUNCTION public.sanitize_html_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.html_content IS NOT NULL THEN
    -- Remove script tags and content
    NEW.html_content := regexp_replace(NEW.html_content, '<script[^>]*>.*?</script>', '', 'gis');
    -- Remove iframe tags
    NEW.html_content := regexp_replace(NEW.html_content, '<iframe[^>]*>.*?</iframe>', '', 'gis');
    -- Remove object tags
    NEW.html_content := regexp_replace(NEW.html_content, '<object[^>]*>.*?</object>', '', 'gis');
    -- Remove embed tags
    NEW.html_content := regexp_replace(NEW.html_content, '<embed[^>]*/?>', '', 'gis');
    -- Remove form tags
    NEW.html_content := regexp_replace(NEW.html_content, '<form[^>]*>.*?</form>', '', 'gis');
    -- Remove base tags
    NEW.html_content := regexp_replace(NEW.html_content, '<base[^>]*/?>', '', 'gis');
    -- Remove link tags (stylesheet injection)
    NEW.html_content := regexp_replace(NEW.html_content, '<link[^>]*/?>', '', 'gis');
    -- Remove meta tags
    NEW.html_content := regexp_replace(NEW.html_content, '<meta[^>]*/?>', '', 'gis');
    -- Remove event handler attributes (on*)
    NEW.html_content := regexp_replace(NEW.html_content, '\s+on\w+\s*=\s*[''"][^''"]*[''"]', '', 'gis');
    NEW.html_content := regexp_replace(NEW.html_content, '\s+on\w+\s*=\s*\S+', '', 'gis');
    -- Remove javascript: URLs in href/src attributes
    NEW.html_content := regexp_replace(NEW.html_content, '(href|src|action)\s*=\s*[''"]javascript:[^''"]*[''"]', '\1=""', 'gis');
    -- Remove data: URLs in src attributes (potential XSS vector)
    NEW.html_content := regexp_replace(NEW.html_content, 'src\s*=\s*[''"]data:[^''"]*[''"]', 'src=""', 'gis');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sanitize_web_component_html
BEFORE INSERT OR UPDATE ON public.web_component_boxes
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_html_content();
