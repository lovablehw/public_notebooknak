import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClipboardList, Clock, Gift, Calendar } from "lucide-react";
import { QuestionnaireConfig, QuestionnaireStatus } from "@/hooks/useQuestionnaireConfig";
import { ButtonConfig } from "@/hooks/useButtonConfigs";
import { format, isPast, isValid } from "date-fns";
import { hu } from "date-fns/locale";

interface QuestionnaireWidgetProps {
  questionnaire: QuestionnaireConfig;
  onStart: (id: string) => Promise<void>;
  buttonConfig?: ButtonConfig;
}

// Status labels in Hungarian
const statusLabels: Record<QuestionnaireStatus, string> = {
  not_started: "Nincs elkezdve",
  in_progress: "Folyamatban",
  completed: "Befejezve ✓",
};

export const QuestionnaireWidget = ({ questionnaire, onStart, buttonConfig }: QuestionnaireWidgetProps) => {
  const { id, name, description, completion_time, points, deadline, target_url, status } = questionnaire;

  // Get button properties from config or use defaults
  const buttonLabel = buttonConfig?.button_label || "Kezdés";
  const buttonTooltip = buttonConfig?.tooltip;
  const buttonTargetUrl = buttonConfig?.target_url || target_url;
  const urlTarget = buttonConfig?.url_target || "_blank";

  const handleStart = async () => {
    await onStart(id);
    // Redirect to target URL
    if (buttonTargetUrl) {
      if (buttonTargetUrl.startsWith("http")) {
        if (urlTarget === "_blank") {
          window.open(buttonTargetUrl, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = buttonTargetUrl;
        }
      } else {
        window.location.href = buttonTargetUrl;
      }
    }
  };

  const isExpired = deadline && isValid(new Date(deadline)) && isPast(new Date(deadline));
  const isCompleted = status === "completed";

  const getButtonText = () => {
    if (isCompleted) return "Befejezve";
    if (isExpired) return "Lejárt";
    if (status === "in_progress") return "Folytatás";
    return buttonLabel;
  };

  const ActionButton = () => (
    <Button 
      onClick={handleStart} 
      className="w-full mt-auto bg-[#4A9B9B] hover:bg-[#3d8585] text-white font-medium py-2.5 rounded-lg"
      disabled={isCompleted || isExpired}
    >
      {getButtonText()}
    </Button>
  );

  return (
    <Card className={`bg-white shadow-sm border border-border/40 rounded-xl flex flex-col h-full transition-all hover:shadow-md ${isExpired && !isCompleted ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        {/* Icon + Title + Badge Row */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base font-semibold text-foreground leading-snug">{name}</CardTitle>
              <Badge 
                variant="outline" 
                className={`flex-shrink-0 text-xs font-normal px-2.5 py-0.5 rounded-full border ${
                  status === 'in_progress' 
                    ? 'border-primary/30 text-primary bg-primary/5' 
                    : status === 'completed'
                    ? 'border-green-500/30 text-green-600 bg-green-50'
                    : 'border-muted-foreground/30 text-muted-foreground bg-muted/30'
                }`}
              >
                {statusLabels[status]}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Description */}
        {description && (
          <CardDescription className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col flex-grow pt-2 pb-5 px-5">
        {/* Meta info - Time and Points */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Kb. {completion_time}–{completion_time + 2} perc</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">+{points} pont</span>
          </div>
        </div>

        {/* Deadline if exists */}
        {deadline && isValid(new Date(deadline)) && (
          <div className={`flex items-center gap-1.5 text-xs mb-4 ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Határidő: {format(new Date(deadline), "yyyy. MMM d.", { locale: hu })}
              {isExpired && " (lejárt)"}
            </span>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-grow" />

        {/* Full-width teal action button with optional tooltip */}
        {buttonTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <ActionButton />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{buttonTooltip}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <ActionButton />
        )}
      </CardContent>
    </Card>
  );
};
