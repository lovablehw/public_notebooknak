import { useWebComponent } from "@/hooks/useWebComponent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FlaskConical, LucideIcon } from "lucide-react";
import DOMPurify from "dompurify";

interface WebComponentContainerProps {
  name: string;
  anchorId: string;
  icon?: LucideIcon;
  description?: string;
}

export function WebComponentContainer({ name, anchorId, icon: Icon = FlaskConical, description }: WebComponentContainerProps) {
  const { htmlContent, isPlaceholder, isLoading } = useWebComponent(anchorId);

  return (
    <Card className="shadow-card border-0 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {name}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div
          id={anchorId}
          className="min-h-[120px] w-full rounded-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isPlaceholder ? (
            <div className="bg-muted/20 border border-dashed border-border rounded-lg flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">Tartalom feltöltés alatt</p>
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent!) }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
