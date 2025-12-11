import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { usePoints } from "@/hooks/usePoints";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  LogOut,
  Loader2,
  Trophy,
  Star,
  Medal,
  Rocket,
  Footprints,
  Settings,
  ClipboardList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  display_name: string;
  age_range: string;
  smoking_status: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  footprints: Footprints,
  rocket: Rocket,
  trophy: Trophy,
  medal: Medal,
  star: Star,
};

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { needsConsent, loading: consentLoading } = useConsent();
  const { totalPoints, achievements, unlockedAchievements, getNextMilestone, getProgress, addPoints } = usePoints();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!consentLoading && needsConsent && user) {
      navigate("/consent");
    }
  }, [needsConsent, consentLoading, user, navigate]);

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

  // Demo function to simulate completing a questionnaire
  const handleDemoComplete = async () => {
    const { newAchievements } = await addPoints(10, "Demó kérdőív kitöltése", "demo-1");
    
    toast({
      title: "Kérdőív kitöltve!",
      description: `10 pontot szereztél.`,
    });

    if (newAchievements && newAchievements.length > 0) {
      setTimeout(() => {
        toast({
          title: "🎉 Új kitüntetés!",
          description: newAchievements[0].name,
        });
      }, 1000);
    }
  };

  if (authLoading || consentLoading || profileLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nextMilestone = getNextMilestone();
  const progress = getProgress();
  const unlockedIds = new Set(unlockedAchievements.map((ua) => ua.achievement_id));

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

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-light text-foreground mb-2">
            Üdvözlünk újra, <span className="font-medium">{profile?.display_name || "Barátom"}</span>
          </h1>
          <p className="text-muted-foreground">
            Köszönjük, hogy hozzájárulsz a jólléti kutatásokhoz. A részvételed fontos.
          </p>
        </div>

        {/* Points & Progress */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-card border-0 animate-fade-in">
            <CardHeader className="pb-2">
              <CardDescription>Pontjaid</CardDescription>
              <CardTitle className="text-4xl font-light text-primary">{totalPoints}</CardTitle>
            </CardHeader>
            <CardContent>
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
                  Az összes kitüntetést feloldottad! 🎉
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 animate-fade-in">
            <CardHeader className="pb-2">
              <CardDescription>Kitüntetések</CardDescription>
              <CardTitle className="text-lg font-medium">
                {unlockedAchievements.length} / {achievements.length} feloldva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement) => {
                  const IconComponent = iconMap[achievement.icon] || Star;
                  const isUnlocked = unlockedIds.has(achievement.id);
                  return (
                    <Badge
                      key={achievement.id}
                      variant={isUnlocked ? "default" : "secondary"}
                      className={`px-3 py-1 ${!isUnlocked && "opacity-40"}`}
                    >
                      <IconComponent className="h-3 w-3 mr-1" />
                      {achievement.name}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questionnaire Area */}
        <h2 className="text-xl font-medium text-foreground mb-4">Kérdőívek</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Iframe-ready container for external questionnaires */}
          <Card className="shadow-card border-0 animate-fade-in overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Jólléti felmérés</CardTitle>
              </div>
              <CardDescription>
                Egy rövid kérdőív a jelenlegi közérzeted felmérésére
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for iframe integration */}
              <div className="aspect-video bg-muted/50 rounded-lg border border-dashed border-border flex items-center justify-center mb-4">
                <div className="text-center text-muted-foreground p-4">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">A külső kérdőív itt fog megjelenni</p>
                  <p className="text-xs mt-1">iframe-kompatibilis integrációs terület</p>
                </div>
              </div>
              <Button onClick={handleDemoComplete} className="w-full">
                Demó kitöltése (+10 pont)
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 animate-fade-in overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Életmód felmérés</CardTitle>
              </div>
              <CardDescription>
                Ismerd meg jobban a napi szokásaidat és mintázataidat
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for iframe integration */}
              <div className="aspect-video bg-muted/50 rounded-lg border border-dashed border-border flex items-center justify-center mb-4">
                <div className="text-center text-muted-foreground p-4">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Hamarosan</p>
                  <p className="text-xs mt-1">További kérdőívek érkeznek</p>
                </div>
              </div>
              <Button variant="secondary" disabled className="w-full">
                Még nem elérhető
              </Button>
            </CardContent>
          </Card>
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
