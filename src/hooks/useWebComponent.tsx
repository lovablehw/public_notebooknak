import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WebComponentBox {
  id: string;
  anchor_id: string;
  name: string;
  html_content: string | null;
  is_active: boolean;
}

export function useWebComponent(anchorId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["web-component-box", anchorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web_component_boxes")
        .select("*")
        .eq("anchor_id", anchorId)
        .maybeSingle();

      if (error) throw error;
      return data as WebComponentBox | null;
    },
  });

  const isPlaceholder = !data || !data.is_active || !data.html_content;
  const htmlContent = isPlaceholder ? null : data.html_content;

  return {
    box: data,
    htmlContent,
    isPlaceholder,
    isLoading,
    error,
  };
}
