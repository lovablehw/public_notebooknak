import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminDashboardStats } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  FileCheck, 
  Star, 
  Trophy, 
  FileText, 
  ScrollText,
  Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

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

  const tiles = [
    {
      title: "Felhasználók",
      value: stats?.profilesCount || 0,
      icon: Users,
      description: "Regisztrált felhasználók",
    },
    {
      title: "Hozzájárulások",
      value: `${stats?.completeConsents || 0} / ${(stats?.completeConsents || 0) + (stats?.incompleteConsents || 0)}`,
      icon: FileCheck,
      description: "Teljes / Összes",
    },
    {
      title: "Pontok",
      value: stats?.totalPoints || 0,
      icon: Star,
      description: "Összes kiosztott pont",
    },
    {
      title: "Kitüntetések",
      value: stats?.achievementStats?.reduce((sum, a) => sum + a.unlockCount, 0) || 0,
      icon: Trophy,
      description: "Feloldott kitüntetések",
    },
    {
      title: "Hozzájárulási verzió",
      value: stats?.currentVersion || "N/A",
      icon: FileText,
      description: "Jelenlegi verzió",
    },
    {
      title: "Napló",
      value: stats?.recentEvents?.length || 0,
      icon: ScrollText,
      description: "Utolsó 10 esemény",
    },
  ];

  return (
    <AdminLayout title="Admin főoldal">
      {/* Stats tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card key={tile.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tile.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tile.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{tile.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievement breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Kitüntetések bontása</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats?.achievementStats?.map((achievement) => (
              <div key={achievement.id} className="text-center p-3 bg-accent/50 rounded-lg">
                <div className="text-lg font-bold text-foreground">{achievement.unlockCount}</div>
                <div className="text-xs text-muted-foreground">{achievement.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legutóbbi események</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentEvents && stats.recentEvents.length > 0 ? (
            <div className="space-y-2">
              {stats.recentEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{event.event_type}</span>
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
            <p className="text-muted-foreground text-center py-4">Nincs még esemény</p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
