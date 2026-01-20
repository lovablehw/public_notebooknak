import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminPoints } from "@/hooks/useAdminData";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, Star, Trophy } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

export default function AdminPoints() {
  const { data: points, isLoading } = useAdminPoints();

  if (isLoading) {
    return (
      <AdminLayout title="Pontok">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const totalAllPoints = points?.reduce((sum, p) => sum + p.totalPoints, 0) || 0;
  const topUsers = [...(points || [])].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10);
  const hasData = points && points.length > 0;

  return (
    <AdminLayout title="Pontok">
      {/* Summary */}
      <div className="mb-6 p-4 bg-accent/50 rounded-lg flex items-center gap-4">
        <Star className="h-8 w-8 text-primary" />
        <div>
          <div className="text-sm text-muted-foreground">Összes kiosztott pont</div>
          <div className="text-3xl font-bold text-foreground">
            {hasData ? totalAllPoints : "Még nincs adat"}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Még nincs rögzített pont.</p>
        </div>
      ) : (
        <>
          {/* Top users */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top felhasználók
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {topUsers.slice(0, 5).map((user, index) => (
                <div 
                  key={user.userId} 
                  className="p-3 bg-muted/50 rounded-lg text-center"
                >
                  <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                  <div className="font-mono text-xs text-muted-foreground truncate">
                    {user.userId.slice(0, 8)}...
                  </div>
                  <div className="text-lg font-semibold mt-1">{user.totalPoints} pont</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full table */}
          <div id="table-points" className="border rounded-lg scroll-mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Felhasználó</TableHead>
                  <TableHead className="text-right">Pontok</TableHead>
                  <TableHead>Utolsó frissítés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((point, index) => (
                  <TableRow key={point.userId} id={`points-${point.userId}`} className="scroll-mt-4">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {point.userId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {point.totalPoints}
                    </TableCell>
                    <TableCell>
                      {format(new Date(point.lastUpdate), "yyyy.MM.dd HH:mm", { locale: hu })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
