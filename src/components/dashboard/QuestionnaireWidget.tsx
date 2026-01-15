import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, Gift, ExternalLink, Calendar } from "lucide-react";
import { QuestionnaireConfig, QuestionnaireStatus } from "@/hooks/useQuestionnaireConfig";
import { format, isPast, isValid } from "date-fns";
import { hu } from "date-fns/locale";

interface QuestionnaireWidgetProps {
  questionnaire: QuestionnaireConfig;
  onStart: (id: string) => Promise<void>;
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

export const QuestionnaireWidget = ({ questionnaire, onStart }: QuestionnaireWidgetProps) => {
  const { id, name, description, completion_time, points, deadline, target_url, status } = questionnaire;

  const handleStart = async () => {
    await onStart(id);
    // Redirect to target URL
    if (target_url) {
      if (target_url.startsWith("http")) {
        window.open(target_url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = target_url;
      }
    }
  };

  const isExpired = deadline && isValid(new Date(deadline)) && isPast(new Date(deadline));
  const isCompleted = status === "completed";

  const getButtonText = () => {
    if (isCompleted) return "Befejezve";
    if (isExpired) return "Lejárt";
    return status === "not_started" ? "Kezdés" : "Folytatás";
  };

  return (
    <Card className={`shadow-card border-0 animate-fade-in flex flex-col h-full transition-all hover:shadow-lg ${isExpired && !isCompleted ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3 flex-grow-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="h-5 w-5 text-primary flex-shrink-0" />
            <CardTitle className="text-lg truncate">{name}</CardTitle>
          </div>
          <Badge variant={statusVariants[status]} className="flex-shrink-0">
            {statusLabels[status]}
          </Badge>
        </div>
        {description && (
          <CardDescription className="mt-2 line-clamp-2">{description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col flex-grow">
        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Kb. {completion_time} perc</span>
          </div>
          <div className="flex items-center gap-1">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">+{points} pont</span>
          </div>
        </div>

        {/* Deadline if exists */}
        {deadline && isValid(new Date(deadline)) && (
          <div className={`flex items-center gap-1 text-xs mb-3 ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Calendar className="h-3 w-3" />
            <span>
              Határidő: {format(new Date(deadline), "yyyy. MMM d.", { locale: hu })}
              {isExpired && " (lejárt)"}
            </span>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-grow" />

        {/* Action button */}
        <Button 
          onClick={handleStart} 
          className="w-full mt-auto gap-2"
          disabled={isCompleted || isExpired}
          variant={isCompleted ? "secondary" : "default"}
        >
          {getButtonText()}
          {!isCompleted && !isExpired && target_url?.startsWith("http") && (
            <ExternalLink className="h-4 w-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
