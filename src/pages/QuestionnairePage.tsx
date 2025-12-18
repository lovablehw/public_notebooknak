import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { usePoints } from "@/hooks/usePoints";
import { useQuestionnaires, Questionnaire } from "@/hooks/useQuestionnaires";
import { useMedalyseCompletion } from "@/hooks/useMedalyseCompletion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardList, Clock, Gift, Mic, Loader2, Heart, CheckCircle } from "lucide-react";
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
  const [isCompleting, setIsCompleting] = useState(false);

  // Handle questionnaire completion from medalyse event
  const handleMedalyseCompletion = useCallback(async (completedQuestionnaireId: string) => {
    if (!questionnaire || isCompleting) return;
    
    // Check if already completed (prevent double rewards)
    if (questionnaire.status === "completed") {
      toast({
        title: "Már befejezve",
        description: "Ezt a felmérést már korábban befejezted.",
      });
      return;
    }

    setIsCompleting(true);

    try {
      // Mark as completed and get points (completeQuestionnaire returns 0 if already completed)
      const pointsEarned = completeQuestionnaire(completedQuestionnaireId);
      
      if (pointsEarned > 0) {
        // Award points to user
        const { newAchievements } = await addPoints(
          pointsEarned, 
          `Kérdőív kitöltése: ${questionnaire.title}`, 
          completedQuestionnaireId
        );
        
        // Show success toast
        toast({
          title: "Sikeres kitöltés",
          description: `A felmérést befejezted, ${pointsEarned} pontot jóváírtunk.`,
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
              title: "Új kitüntetés!",
              description: `Feloldottad: ${badgeMessages.join(", ")}`,
            });
          }, 1500);
        }

        if (newAchievements && newAchievements.length > 0) {
          setTimeout(() => {
            toast({
              title: "Mérföldkő elérve!",
              description: newAchievements[0].name,
            });
          }, 2500);
        }

        // Update local questionnaire state to show completed status
        setQuestionnaire((prev) => prev ? { ...prev, status: "completed" } : null);
      } else {
        // Points were 0, meaning already completed
        toast({
          title: "Már befejezve",
          description: "Ezt a felmérést már korábban befejezted.",
        });
      }
    } finally {
      setIsCompleting(false);
    }
  }, [questionnaire, isCompleting, completeQuestionnaire, addPoints, getCompletedCount, toast]);

  // Listen for medalyse completion events
  useMedalyseCompletion({
    questionnaireId: id || "",
    onComplete: handleMedalyseCompletion,
    enabled: !!id && !!questionnaire && questionnaire.status !== "completed",
  });

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

  // Loading state
  if (authLoading || consentLoading || questionnairesLoading || !questionnaire) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isCompleted = questionnaire.status === "completed";
  const statusLabel = isCompleted 
    ? "Befejezve" 
    : questionnaire.status === "in_progress" 
      ? "Folyamatban" 
      : "Nincs elkezdve";

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
              <Badge 
                variant={isCompleted ? "default" : "outline"} 
                className={isCompleted ? "bg-green-600" : ""}
              >
                {isCompleted && <CheckCircle className="h-3 w-3 mr-1" />}
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
                <span className={`font-medium ${isCompleted ? "text-green-600" : "text-primary"}`}>
                  {isCompleted ? `+${questionnaire.rewardPoints} pont jóváírva` : `+${questionnaire.rewardPoints} pont`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed state or Medalyse questionnaire container */}
        {isCompleted ? (
          <Card className="shadow-card border-0 animate-fade-in border-green-200 bg-green-50/50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-medium text-foreground mb-2">
                Kérdőív sikeresen befejezve!
              </h3>
              <p className="text-muted-foreground">
                Köszönjük a részvételt. A pontjaidat jóváírtuk.
              </p>
            </CardContent>
          </Card>
        ) : (
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
        )}

        {/* Info notice */}
        <div className="bg-accent/30 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            {isCompleted 
              ? "Ez a kérdőív már be van fejezve. Az eredményeidet az Egészségkönyvemben tekintheted meg."
              : "A kérdőív befejezése és a pontok jóváírása automatikusan történik, amikor a beágyazott kérdőívet kitöltöd. A félbehagyott kérdőíveket később folytathatod."
            }
          </p>
        </div>

        {/* Back button */}
        <Button 
          variant="outline"
          onClick={() => navigate(isCompleted ? "/healthbook" : "/dashboard")}
          size="lg"
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isCompleted ? "Vissza az Egészségkönyvemhez" : "Vissza a kérdőívekhez"}
        </Button>
      </main>
    </div>
  );
};

export default QuestionnairePage;
