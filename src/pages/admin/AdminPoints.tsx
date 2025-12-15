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
import { Loader2 } from "lucide-react";
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

  return (
    <AdminLayout title="Pontok">
      {/* Summary */}
      <div className="mb-6 p-4 bg-accent/50 rounded-lg">
        <div className="text-sm text-muted-foreground">Összes kiosztott pont</div>
        <div className="text-3xl font-bold text-foreground">{totalAllPoints}</div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Felhasználó</TableHead>
              <TableHead className="text-right">Pontok</TableHead>
              <TableHead>Utolsó frissítés</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points?.map((point) => (
              <TableRow key={point.userId}>
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
            {points?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nincs pont adat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
