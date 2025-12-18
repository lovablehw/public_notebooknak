import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, Gift } from "lucide-react";
import { Questionnaire, QuestionnaireStatus } from "@/hooks/useQuestionnaires";

interface QuestionnaireCardProps {
  questionnaire: Questionnaire;
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

export const QuestionnaireCard = ({ questionnaire }: QuestionnaireCardProps) => {
  const navigate = useNavigate();
  const { id, title, description, estimatedTime, rewardPoints, status } = questionnaire;

  const handleAction = () => {
    navigate(`/kerdoiv/${id}`);
  };

  const getButtonText = () => {
    return status === "not_started" ? "Kezdés" : "Folytatás";
  };

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

        {/* Action button - always at bottom */}
        <Button onClick={handleAction} className="w-full mt-auto">
          {getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
};
