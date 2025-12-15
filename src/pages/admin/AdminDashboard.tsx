import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminDashboardStats } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileCheck, 
  Star, 
  Trophy, 
  FileText, 
  ScrollText,
  Loader2,
  Plus,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

// Event type translations for non-IT friendly display
const eventTypeLabels: Record<string, string> = {
  user_registered: "Új regisztráció",
  consent_submitted: "Hozzájárulás megadva",
  questionnaire_completed: "Kérdőív kitöltve",
  points_added: "Pont jóváírva",
  admin_added: "Adminisztrátor hozzáadva",
  admin_removed: "Adminisztrátor eltávolítva",
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <AdminLayout title="Admin főoldal">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const hasUsers = (stats?.profilesCount || 0) > 0;
  const hasConsents = (stats?.completeConsents || 0) + (stats?.incompleteConsents || 0) > 0;
  const hasPoints = (stats?.totalPoints || 0) > 0;
  const hasAchievements = stats?.achievementStats?.some(a => a.unlockCount > 0);
  const hasConsentVersion = stats?.currentVersion && stats.currentVersion !== "N/A";
  const hasEvents = (stats?.recentEvents?.length || 0) > 0;

  return (
    <AdminLayout title="Admin főoldal">
      {/* Stats tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Felhasználók */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Felhasználók
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasUsers ? (
              <>
                <div className="text-2xl font-bold">{stats?.profilesCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Regisztrált felhasználók</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Még nincs rögzített adat.</p>
            )}
          </CardContent>
        </Card>

        {/* Hozzájárulások */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hozzájárulások
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasConsents ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{stats?.completeConsents} teljes</Badge>
                  {(stats?.incompleteConsents || 0) > 0 && (
                    <Badge variant="secondary">{stats?.incompleteConsents} hiányos</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Összesen: {(stats?.completeConsents || 0) + (stats?.incompleteConsents || 0)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Még nincs rögzített adat.</p>
            )}
          </CardContent>
        </Card>

        {/* Pontok */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pontok
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasPoints ? (
              <>
                <div className="text-2xl font-bold">{stats?.totalPoints}</div>
                <p className="text-xs text-muted-foreground mt-1">Összes kiosztott pont</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Még nincs rögzített adat.</p>
            )}
          </CardContent>
        </Card>

        {/* Kitüntetések */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kitüntetések
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasAchievements ? (
              <>
                <div className="text-2xl font-bold">
                  {stats?.achievementStats?.reduce((sum, a) => sum + a.unlockCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Feloldott kitüntetések</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Még nincs rögzített adat.</p>
            )}
          </CardContent>
        </Card>

        {/* Hozzájárulási verzió */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hozzájárulási verzió
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasConsentVersion ? (
              <>
                <div className="text-2xl font-bold">{stats?.currentVersion}</div>
                <p className="text-xs text-muted-foreground mt-1">Jelenlegi aktív verzió</p>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Nincs aktív hozzájárulási verzió</p>
                <Button asChild size="sm">
                  <Link to="/admin/hozzajarulasi-verziok">
                    <Plus className="h-4 w-4 mr-1" />
                    Új verzió létrehozása
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Napló */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Napló
            </CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasEvents ? (
              <>
                <div className="text-2xl font-bold">{stats?.recentEvents?.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Utolsó események</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Még nincs rögzített adat.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievement breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Kitüntetések bontása</CardTitle>
        </CardHeader>
        <CardContent>
          {hasAchievements || (stats?.achievementStats?.length || 0) > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats?.achievementStats?.map((achievement) => (
                <div key={achievement.id} className="text-center p-3 bg-accent/50 rounded-lg">
                  <div className="text-lg font-bold text-foreground">{achievement.unlockCount}</div>
                  <div className="text-xs text-muted-foreground">{achievement.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Még nincs kitüntetés adat.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legutóbbi események</CardTitle>
        </CardHeader>
        <CardContent>
          {hasEvents ? (
            <div className="space-y-2">
              {stats?.recentEvents?.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">
                      {eventTypeLabels[event.event_type] || event.event_type}
                    </span>
                    {event.actor_email && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({event.actor_email})
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(event.created_at), "yyyy.MM.dd HH:mm", { locale: hu })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ScrollText className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Még nincs esemény rögzítve.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
