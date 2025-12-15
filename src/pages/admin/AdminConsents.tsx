import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminConsents } from "@/hooks/useAdminData";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

type FilterType = "all" | "complete" | "incomplete";

export default function AdminConsents() {
  const { data: consents, isLoading } = useAdminConsents();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredConsents = consents?.filter((consent) => {
    if (filter === "all") return true;
    const isComplete = consent.health_data_processing && consent.research_participation;
    return filter === "complete" ? isComplete : !isComplete;
  });

  if (isLoading) {
    return (
      <AdminLayout title="Hozzájárulások">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Hozzájárulások">
      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Összes
        </Button>
        <Button
          variant={filter === "complete" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("complete")}
        >
          Csak teljes
        </Button>
        <Button
          variant={filter === "incomplete" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("incomplete")}
        >
          Csak hiányos
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Felhasználó</TableHead>
              <TableHead className="text-center">Kutatásban való részvétel</TableHead>
              <TableHead className="text-center">Egészségügyi adatok kezelése</TableHead>
              <TableHead className="text-center">Kommunikáció</TableHead>
              <TableHead>Verzió</TableHead>
              <TableHead>Dátum/idő</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConsents?.map((consent) => (
              <TableRow key={consent.id}>
                <TableCell className="font-mono text-xs">
                  {consent.user_id.slice(0, 8)}...
                </TableCell>
                <TableCell className="text-center">
                  {consent.research_participation ? (
                    <Badge variant="default" className="bg-success">
                      <Check className="h-3 w-3 mr-1" />
                      Igen
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="h-3 w-3 mr-1" />
                      Nem
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {consent.health_data_processing ? (
                    <Badge variant="default" className="bg-success">
                      <Check className="h-3 w-3 mr-1" />
                      Igen
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="h-3 w-3 mr-1" />
                      Nem
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {consent.communication_preferences ? (
                    <Badge variant="outline">
                      <Check className="h-3 w-3 mr-1" />
                      Igen
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="h-3 w-3 mr-1" />
                      Nem
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {consent.consent_versions?.version || "N/A"}
                </TableCell>
                <TableCell>
                  {format(new Date(consent.consented_at), "yyyy.MM.dd HH:mm", { locale: hu })}
                </TableCell>
              </TableRow>
            ))}
            {filteredConsents?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nincs találat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
