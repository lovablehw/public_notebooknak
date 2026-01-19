import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClipboardList, Clock, Gift } from "lucide-react";
import { Questionnaire, QuestionnaireStatus } from "@/hooks/useQuestionnaires";
import { ButtonConfig } from "@/hooks/useButtonConfigs";

interface QuestionnaireCardProps {
  questionnaire: Questionnaire;
  buttonConfig?: ButtonConfig;
}

// Status labels in Hungarian
const statusLabels: Record<QuestionnaireStatus, string> = {
  not_started: "Nincs elkezdve",
  in_progress: "Folyamatban",
  completed: "Befejezve ✓",
};

// Status badge variants
const statusVariants: Record<QuestionnaireStatus, "secondary" | "outline" | "default"> = {
  not_started: "secondary",
  in_progress: "outline",
  completed: "default",
};

export const QuestionnaireCard = ({ questionnaire, buttonConfig }: QuestionnaireCardProps) => {
  const navigate = useNavigate();
  const { id, title, description, estimatedTime, rewardPoints, status } = questionnaire;

  // Get button properties from config or use defaults
  const buttonLabel = buttonConfig?.button_label || "Kezdés";
  const buttonTooltip = buttonConfig?.tooltip;
  const buttonTargetUrl = buttonConfig?.target_url;
  const urlTarget = buttonConfig?.url_target || "_blank";

  const handleAction = () => {
    // Check if URL is configured (not /404 or empty)
    if (!buttonTargetUrl || buttonTargetUrl === '/404') {
      // Navigate to 404 with state indicating button config is pending
      navigate('/404', { state: { buttonConfigPending: true } });
      return;
    }
    
    // Redirect to target URL
    if (buttonTargetUrl.startsWith("http")) {
      if (urlTarget === "_blank") {
        window.open(buttonTargetUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = buttonTargetUrl;
      }
    } else {
      // For internal URLs
      if (urlTarget === "_blank") {
        window.open(buttonTargetUrl, "_blank");
      } else {
        navigate(buttonTargetUrl);
      }
    }
  };

  const getButtonText = () => {
    // Always use button_label from button_configs
    // The Super Admin controls the label via Gomb Karbantartó
    return buttonLabel;
  };

  const ActionButton = () => (
    <Button onClick={handleAction} className="w-full mt-auto bg-[#4A9B9B] hover:bg-[#3d8585]">
      {getButtonText()}
    </Button>
  );

  return (
    <Card className="shadow-card border-0 animate-fade-in flex flex-col h-full">
      <CardHeader className="pb-3 flex-grow-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary flex-shrink-0" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant={statusVariants[status]} className="flex-shrink-0">
            {statusLabels[status]}
          </Badge>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-grow">
        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gift className="h-4 w-4" />
            <span>+{rewardPoints} pont</span>
          </div>
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-grow" />

        {/* Action button with optional tooltip */}
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
