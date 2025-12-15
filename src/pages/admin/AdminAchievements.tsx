import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAchievements } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy } from "lucide-react";

// Hungarian name mapping for achievements
const achievementNames: Record<string, string> = {
  "First Steps": "Első lépések",
  "Getting Started": "Kezdő lendület",
  "Weekly Hero": "Heti Hős",
  "Data Champion": "Adatbajnok",
  "Research Hero": "Kutatási Hős",
};

export default function AdminAchievements() {
  const { data: achievements, isLoading } = useAdminAchievements();

  if (isLoading) {
    return (
      <AdminLayout title="Kitüntetések">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const totalUnlocks = achievements?.reduce((sum, a) => sum + a.unlockCount, 0) || 0;

  return (
    <AdminLayout title="Kitüntetések">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {achievements?.map((achievement) => (
          <Card key={achievement.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="text-2xl">{achievement.icon}</span>
                <span className="truncate">
                  {achievementNames[achievement.name] || achievement.name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{achievement.unlockCount}</div>
              <p className="text-xs text-muted-foreground">feloldás</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-accent/50 rounded-lg flex items-center gap-4">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <div className="text-sm text-muted-foreground">Összes feloldott kitüntetés</div>
          <div className="text-3xl font-bold text-foreground">{totalUnlocks}</div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ikon</TableHead>
              <TableHead>Név</TableHead>
              <TableHead>Leírás</TableHead>
              <TableHead className="text-right">Szükséges pont</TableHead>
              <TableHead className="text-right">Feloldások</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {achievements?.map((achievement) => (
              <TableRow key={achievement.id}>
                <TableCell className="text-2xl">{achievement.icon}</TableCell>
                <TableCell className="font-medium">
                  {achievementNames[achievement.name] || achievement.name}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {achievement.description}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{achievement.points_required} pont</Badge>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {achievement.unlockCount}
                </TableCell>
              </TableRow>
            ))}
            {achievements?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nincs kitüntetés
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
