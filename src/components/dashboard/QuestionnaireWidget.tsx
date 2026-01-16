import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Clock, Gift, ExternalLink, Calendar, ChevronRight } from "lucide-react";
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
    <>
      {/* Desktop Card View (lg and above) */}
      <Card className={`hidden lg:flex shadow-card border-0 animate-fade-in flex-col h-full transition-all hover:shadow-lg ${isExpired && !isCompleted ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3 flex-grow-0">
          {/* Icon + Title Row */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg font-medium truncate">{name}</CardTitle>
                <Badge variant={statusVariants[status]} className="flex-shrink-0 text-xs">
                  {statusLabels[status]}
                </Badge>
              </div>
            </div>
          </div>
          {/* Description */}
          {description && (
            <CardDescription className="mt-3 line-clamp-2 text-sm">{description}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="flex flex-col flex-grow pt-0">
          {/* Meta info - Time and Points */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Kb. {completion_time}–{completion_time + 2} perc</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-primary font-semibold">+{points} pont</span>
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

          {/* Full-width green action button */}
          <Button 
            onClick={handleStart} 
            className="w-full mt-auto gap-2 bg-primary hover:bg-primary/90"
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

      {/* Tablet/Mobile Economic Row View (below lg) */}
      <div 
        className={`lg:hidden flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50 shadow-sm transition-all hover:shadow-md ${isExpired && !isCompleted ? 'opacity-60' : ''}`}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>

        {/* Content: Title + Time */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate text-sm">{name}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Kb. {completion_time} perc
            </span>
            <span className="flex items-center gap-1 text-primary font-medium">
              <Gift className="h-3 w-3" />
              +{points}
            </span>
          </div>
        </div>

        {/* Status badge (optional, shown for in_progress) */}
        {status === "in_progress" && (
          <Badge variant="outline" className="flex-shrink-0 text-xs hidden sm:flex">
            {statusLabels[status]}
          </Badge>
        )}

        {/* Compact action button */}
        <Button 
          onClick={handleStart}
          size="sm"
          disabled={isCompleted || isExpired}
          variant={isCompleted ? "secondary" : "default"}
          className="flex-shrink-0 gap-1 px-3"
        >
          <span className="text-xs">{getButtonText()}</span>
          {!isCompleted && !isExpired && <ChevronRight className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </>
  );
};
