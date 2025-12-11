import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, Gift, Check, ChevronDown, ChevronUp, Mic } from "lucide-react";
import { Questionnaire, QuestionnaireStatus } from "@/hooks/useQuestionnaires";

interface QuestionnaireCardProps {
  questionnaire: Questionnaire;
  onStart: () => void;
  onComplete: () => void;
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

export const QuestionnaireCard = ({
  questionnaire,
  onStart,
  onComplete,
}: QuestionnaireCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { id, title, description, estimatedTime, rewardPoints, status } = questionnaire;

  const handleAction = () => {
    if (status === "not_started") {
      onStart();
      setIsExpanded(true);
    } else if (status === "in_progress") {
      setIsExpanded(!isExpanded);
    }
  };

  const getButtonText = () => {
    switch (status) {
      case "not_started":
        return "Kezdés";
      case "in_progress":
        return isExpanded ? "Bezárás" : "Folytatás";
      case "completed":
        return "Eredmények megtekintése";
    }
  };

  return (
    <Card className="shadow-card border-0 animate-fade-in overflow-hidden">
      <CardHeader className="pb-3">
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
      
      <CardContent className="space-y-4">
        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gift className="h-4 w-4" />
            <span>+{rewardPoints} pont</span>
          </div>
        </div>

        {/* Expanded questionnaire container */}
        {isExpanded && status !== "completed" && (
          <div className="space-y-4 pt-2">
            {/* Iframe-compatible medalyse container */}
            <div 
              className="aspect-video bg-muted/50 rounded-lg border border-dashed border-border flex items-center justify-center"
              data-questionnaire-id={id}
            >
              <div className="text-center text-muted-foreground p-4">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Itt jelenik meg a medalyse kérdőív</p>
                {/* HTML comment placeholder for integration */}
                {/* <!-- medalyse questionnaire container --> */}
                <div 
                  id={`medalyse-questionnaire-container-${id}`} 
                  data-questionnaire-id={id}
                  className="hidden"
                />
              </div>
            </div>

            {/* Voice input tip */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/30 rounded-lg p-3">
              <Mic className="h-4 w-4 flex-shrink-0" />
              <span>Tipp: mobilon a beágyazott kérdőívben hangalapú kitöltést is használhatsz.</span>
            </div>

            {/* Mark as complete button (demo) */}
            <Button 
              onClick={onComplete} 
              className="w-full"
              variant="destructive"
            >
              <Check className="h-4 w-4 mr-2" />
              Jelölöm befejezettnek (+{rewardPoints} pont)
            </Button>
          </div>
        )}

        {/* Completed state - show results option */}
        {status === "completed" && (
          <div className="pt-2">
            <div className="aspect-video bg-accent/20 rounded-lg border border-border flex items-center justify-center mb-4">
              <div className="text-center p-4">
                <Check className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-foreground">Kérdőív befejezve</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Az eredményeid itt fognak megjelenni
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action button when not expanded */}
        {!isExpanded && (
          <Button 
            onClick={handleAction} 
            className="w-full"
            variant={status === "completed" ? "secondary" : "default"}
          >
            {getButtonText()}
            {status === "in_progress" && (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        )}

        {/* Collapse button when expanded */}
        {isExpanded && status !== "completed" && (
          <Button 
            onClick={() => setIsExpanded(false)} 
            variant="ghost"
            className="w-full"
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            Bezárás
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
