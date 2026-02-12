import { useWebComponent } from "@/hooks/useWebComponent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FlaskConical, LucideIcon } from "lucide-react";
import DOMPurify from "dompurify";

// Whitelist all hw-* custom elements and their attributes
const HW_TAGS = [
  'hw-host',
  'hw-grid-component',
  'hw-survey-component',
  'hw-chatbot-component',
  'hw-info-widget-component',
  'hw-graph-component',
  'hw-timeline-component',
  'hw-document-component',
  'hw-stepper-component',
  'hw-html-component',
  'hw-url-component',
  'hw-form-component',
  'hw-tree-grid-component',
  'hw-calendar-component',
  'hw-dynamic-component',
  'hw-map-component',
  'hw-sankey-component',
  'hw-mermaid-component',
];

const HW_ATTRS = [
  'viewid', 'queryid', 'queryname', 'reportname', 'layoutid',
  'apiurl', 'appname', 'clientid', 'externalid', 'styles',
  'darkmode', 'documentserverurl', 'assets',
  'ng-version', 'style', 'class', 'id',
];

DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName && data.tagName.startsWith('hw-')) {
    data.allowedTags[data.tagName] = true;
  }
});

DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (node.tagName && node.tagName.toLowerCase().startsWith('hw-')) {
    data.forceKeepAttr = true;
  }
});

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
              className="prose prose-sm max-w-none dark:prose-invert overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(htmlContent!, {
                  ADD_TAGS: HW_TAGS,
                  ADD_ATTR: HW_ATTRS,
                  CUSTOM_ELEMENT_HANDLING: {
                    tagNameCheck: /^hw-/,
                    attributeNameCheck: /./,
                    allowCustomizedBuiltInElements: false,
                  },
                })
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
