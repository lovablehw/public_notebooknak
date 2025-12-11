import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { usePoints } from "@/hooks/usePoints";
import { useQuestionnaires } from "@/hooks/useQuestionnaires";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, LogOut, Loader2, Settings, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuestionnaireCard } from "@/components/dashboard/QuestionnaireCard";
import { BadgeDisplay, BadgeStats } from "@/components/dashboard/BadgeDisplay";

interface Profile {
  display_name: string;
  age_range: string;
  smoking_status: string;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { userConsent, needsConsent, loading: consentLoading } = useConsent();
  const { totalPoints, addPoints, getNextMilestone, getProgress } = usePoints();
  const { 
    questionnaires, 
    loading: questionnairesLoading, 
    startQuestionnaire, 
    completeQuestionnaire,
    getCompletedCount,
    getUniqueCompletedCount,
  } = useQuestionnaires();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Fetch profile
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, age_range, smoking_status")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
    setProfileLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Handle questionnaire start
  const handleStartQuestionnaire = (id: string) => {
    startQuestionnaire(id);
  };

  // Handle questionnaire completion
  const handleCompleteQuestionnaire = async (id: string) => {
    const pointsEarned = completeQuestionnaire(id);
    
    if (pointsEarned > 0) {
      const questionnaire = questionnaires.find((q) => q.id === id);
      const { newAchievements } = await addPoints(
        pointsEarned, 
        `Kérdőív kitöltése: ${questionnaire?.title}`, 
        id
      );
      
      toast({
        title: "Kérdőív befejezve!",
        description: `${pointsEarned} pontot szereztél a kitöltésért.`,
      });

      // Check for new badge unlocks
      const completedCount = getCompletedCount() + 1;
      const badgeMessages: string[] = [];
      
      if (completedCount === 1) {
        badgeMessages.push("Első lépések");
      }
      if (completedCount === 2) {
        badgeMessages.push("Kezdő lendület");
      }
      if (completedCount === 3) {
        badgeMessages.push("Heti Hős");
      }

      // Show badge notification
      if (badgeMessages.length > 0) {
        setTimeout(() => {
          toast({
            title: "🎉 Új kitüntetés!",
            description: `Feloldottad: ${badgeMessages.join(", ")}`,
          });
        }, 1500);
      }

      // Show achievement notification from points system
      if (newAchievements && newAchievements.length > 0) {
        setTimeout(() => {
          toast({
            title: "🏆 Mérföldkő elérve!",
            description: newAchievements[0].name,
          });
        }, 2500);
      }
    }
  };

  // Loading state
  if (authLoading || consentLoading || profileLoading || questionnairesLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nextMilestone = getNextMilestone();
  const progress = getProgress();
  
  // Badge stats for display
  const badgeStats: BadgeStats = {
    completedQuestionnaires: getCompletedCount(),
    uniqueQuestionnairesCompleted: getUniqueCompletedCount(),
    hasOptionalConsent: userConsent?.communication_preferences || false,
  };

  const displayName = profile?.display_name && profile.display_name !== "Felhasználó" 
    ? profile.display_name 
    : user?.email?.split("@")[0] || "Barátom";

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">Közösségi Jóllét</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-light text-foreground mb-2">
            Szia, <span className="font-medium">{displayName}</span>! Üdvözlünk az irányítópultodon.
          </h1>
          <p className="text-muted-foreground">
            Köszönjük, hogy hozzájárulsz a jólléti és prevenciós kutatásokhoz.
          </p>
        </div>

        {/* Points & Badges Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Points Card */}
          <Card className="shadow-card border-0 animate-fade-in">
            <CardHeader className="pb-2">
              <CardDescription>Pontjaid</CardDescription>
              <CardTitle className="text-4xl font-light text-primary">{totalPoints}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextMilestone && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Következő: {nextMilestone.name}</span>
                    <span className="text-muted-foreground">{nextMilestone.points_required} pont</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              {!nextMilestone && (
                <p className="text-sm text-muted-foreground">
                  Az összes mérföldkövet elérted! 🎉
                </p>
              )}
              
              {/* Points explanation */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/30 rounded-lg p-3">
                <Gift className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  Pontokat gyűjthetsz a felmérések kitöltésével. A jövőben jutalmakat és kedvezményeket is társítunk hozzájuk.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Badges Card */}
          <BadgeDisplay stats={badgeStats} />
        </div>

        {/* Questionnaires Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-foreground">Kérdőívek</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionnaires.map((questionnaire) => (
              <QuestionnaireCard
                key={questionnaire.id}
                questionnaire={questionnaire}
                onStart={() => handleStartQuestionnaire(questionnaire.id)}
                onComplete={() => handleCompleteQuestionnaire(questionnaire.id)}
              />
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card className="shadow-card border-0 bg-accent/30 animate-fade-in">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Emlékeztető:</strong> Ez a platform kizárólag kutatási és 
              jólléti célokat szolgál. Nem nyújt orvosi tanácsadást, diagnózist vagy kezelési 
              javaslatokat. Egészségügyi kérdésekkel fordulj orvoshoz.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
