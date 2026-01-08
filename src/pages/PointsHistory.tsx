import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useConsent } from "@/hooks/useConsent";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, Star, Loader2, LogOut, Settings, Filter, ClipboardList, Upload, Gift } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

type FilterType = "all" | "questionnaire" | "upload";

interface PointEntry {
  id: string;
  points: number;
  reason: string;
  questionnaire_id: string | null;
  created_at: string;
}

const PointsHistory = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { needsConsent, loading: consentLoading } = useConsent();
  const navigate = useNavigate();
  
  const [points, setPoints] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [totalPoints, setTotalPoints] = useState(0);

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

  // Fetch points data
  useEffect(() => {
    if (!user) return;
    
    const fetchPoints = async () => {
      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setPoints(data);
        setTotalPoints(data.reduce((sum, p) => sum + p.points, 0));
      }
      setLoading(false);
    };
    
    fetchPoints();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Filter points
  const filteredPoints = points.filter((p) => {
    if (filter === "all") return true;
    if (filter === "questionnaire") return p.questionnaire_id !== null || p.reason.includes("Kérdőív");
    if (filter === "upload") return p.reason.includes("feltöltés") || p.reason.includes("Dokumentum");
    return true;
  });

  // Get icon for entry type
  const getEntryIcon = (entry: PointEntry) => {
    if (entry.questionnaire_id || entry.reason.includes("Kérdőív")) {
      return <ClipboardList className="h-4 w-4 text-primary" />;
    }
    if (entry.reason.includes("feltöltés") || entry.reason.includes("Dokumentum")) {
      return <Upload className="h-4 w-4 text-green-600" />;
    }
    return <Gift className="h-4 w-4 text-amber-600" />;
  };

  // Get source label
  const getSourceLabel = (entry: PointEntry) => {
    if (entry.questionnaire_id || entry.reason.includes("Kérdőív")) {
      return "Kérdőív";
    }
    if (entry.reason.includes("feltöltés") || entry.reason.includes("Dokumentum")) {
      return "Feltöltés";
    }
    return "Egyéb";
  };

  if (authLoading || consentLoading || loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">HealthPass Wellbeing Szolgáltatások</span>
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

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Navigation */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/healthbook")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Vissza az Egészségkönyvemhez
        </Button>

        {/* Title */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-light text-foreground">Ponttörténet</h1>
          </div>
          <p className="text-muted-foreground">
            A gyűjtött pontjaid részletes áttekintése.
          </p>
        </div>

        {/* Points summary */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader className="pb-2">
            <CardDescription>Jelenlegi egyenleg</CardDescription>
            <CardTitle className="text-4xl font-light text-primary">{totalPoints} pont</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A felmérések és feltöltések után kapott pontjaid összesen.
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-2 animate-fade-in">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">Szűrés:</span>
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter("all")}
          >
            Összes
          </Button>
          <Button 
            variant={filter === "questionnaire" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter("questionnaire")}
          >
            Kérdőívek
          </Button>
          <Button 
            variant={filter === "upload" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter("upload")}
          >
            Feltöltések
          </Button>
        </div>

        {/* Points list */}
        <Card className="shadow-card border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Pont események</CardTitle>
            <CardDescription>
              {filteredPoints.length} bejegyzés
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Még nincs pontszerzési esemény.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPoints.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getEntryIcon(entry)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{entry.reason}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {format(new Date(entry.created_at), "yyyy. MMMM d. HH:mm", { locale: hu })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getSourceLabel(entry)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-medium text-primary">
                        +{entry.points}
                      </span>
                      <p className="text-xs text-muted-foreground">pont</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PointsHistory;
