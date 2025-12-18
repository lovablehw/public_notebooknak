import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { usePoints } from "@/hooks/usePoints";
import { useQuestionnaires, Questionnaire } from "@/hooks/useQuestionnaires";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardList, Clock, Gift, Check, Mic, Loader2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QuestionnairePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { needsConsent, loading: consentLoading } = useConsent();
  const { addPoints } = usePoints();
  const { 
    questionnaires, 
    loading: questionnairesLoading, 
    startQuestionnaire,
    completeQuestionnaire,
    getCompletedCount,
  } = useQuestionnaires();
  const { toast } = useToast();

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Consent check
  useEffect(() => {
    if (!consentLoading && needsConsent && user) {
      navigate("/consent");
    }
  }, [needsConsent, consentLoading, user, navigate]);

  // Find questionnaire by ID
  useEffect(() => {
    if (!questionnairesLoading && questionnaires.length > 0 && id) {
      const found = questionnaires.find((q) => q.id === id);
      if (found) {
        setQuestionnaire(found);
        // Auto-start if not started
        if (found.status === "not_started") {
          startQuestionnaire(id);
        }
      } else {
        navigate("/dashboard");
      }
    }
  }, [id, questionnaires, questionnairesLoading, navigate, startQuestionnaire]);

  const handleComplete = async () => {
    if (!questionnaire) return;

    const pointsEarned = completeQuestionnaire(questionnaire.id);
    
    if (pointsEarned > 0) {
      const { newAchievements } = await addPoints(
        pointsEarned, 
        `Kérdőív kitöltése: ${questionnaire.title}`, 
        questionnaire.id
      );
      
      toast({
        title: "Kérdőív befejezve!",
        description: `${pointsEarned} pontot szereztél a kitöltésért.`,
      });

      // Check for badge unlocks
      const completedCount = getCompletedCount() + 1;
      const badgeMessages: string[] = [];
      
      if (completedCount === 1) badgeMessages.push("Első lépések");
      if (completedCount === 2) badgeMessages.push("Kezdő lendület");
      if (completedCount === 3) badgeMessages.push("Heti Hős");

      if (badgeMessages.length > 0) {
        setTimeout(() => {
          toast({
            title: "🎉 Új kitüntetés!",
            description: `Feloldottad: ${badgeMessages.join(", ")}`,
          });
        }, 1500);
      }

      if (newAchievements && newAchievements.length > 0) {
        setTimeout(() => {
          toast({
            title: "🏆 Mérföldkő elérve!",
            description: newAchievements[0].name,
          });
        }, 2500);
      }
    }

    // Navigate back after completion
    setTimeout(() => navigate("/dashboard"), 500);
  };

  // Loading state
  if (authLoading || consentLoading || questionnairesLoading || !questionnaire) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusLabel = questionnaire.status === "in_progress" ? "Folyamatban" : "Nincs elkezdve";

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">Közösségi Jóllét</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Vissza a kérdőívekhez
        </Button>

        {/* Questionnaire header card */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-primary flex-shrink-0" />
                <CardTitle className="text-2xl">{questionnaire.title}</CardTitle>
              </div>
              <Badge variant="outline" className="flex-shrink-0">
                {statusLabel}
              </Badge>
            </div>
            <CardDescription className="mt-2 text-base">
              {questionnaire.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{questionnaire.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="font-medium text-primary">+{questionnaire.rewardPoints} pont</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medalyse questionnaire container */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardContent className="p-6">
            {/* Full-width container for medalyse webcomponent */}
            <div 
              className="min-h-[500px] bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center"
            >
              {/* Itt jelenik meg a medalyse kérdőív */}
              <div 
                id="medalyse-questionnaire-container" 
                data-questionnaire-id={questionnaire.id}
                className="w-full h-full flex items-center justify-center"
              >
                <div className="text-center text-muted-foreground p-8">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Itt jelenik meg a medalyse kérdőív</p>
                  <p className="text-sm mt-2 opacity-75">
                    A kérdőív töltődik...
                  </p>
                </div>
              </div>
            </div>

            {/* Voice input tip */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-accent/30 rounded-lg p-4 mt-4">
              <Mic className="h-5 w-5 flex-shrink-0" />
              <span>Tipp: mobilon a beágyazott kérdőívben hangalapú kitöltést is használhatsz.</span>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleComplete}
            className="flex-1"
            size="lg"
          >
            <Check className="h-5 w-5 mr-2" />
            Jelölöm befejezettnek (+{questionnaire.rewardPoints} pont)
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/dashboard")}
            size="lg"
          >
            Mentés és kilépés
          </Button>
        </div>
      </main>
    </div>
  );
};

export default QuestionnairePage;
