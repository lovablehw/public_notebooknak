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
import { Loader2, Check, X, FileCheck, Lock } from "lucide-react";
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

  if (!consents || consents.length === 0) {
    return (
      <AdminLayout title="Hozzájárulások">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Még nincs rögzített hozzájárulás.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Hozzájárulások">
      {/* Info box */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
        <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Ez az oldal csak olvasható. A hozzájárulási adatok nem módosíthatók.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Összes ({consents.length})
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
      <div id="table-consents" className="border rounded-lg overflow-x-auto scroll-mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Felhasználó</TableHead>
              <TableHead className="text-center">Kutatás (kötelező)</TableHead>
              <TableHead className="text-center">Egészségügyi adatok (kötelező)</TableHead>
              <TableHead className="text-center">Digitális iker / összesített (opcionális)</TableHead>
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
                  <ConsentBadge value={consent.research_participation} required />
                </TableCell>
                <TableCell className="text-center">
                  <ConsentBadge value={consent.health_data_processing} required />
                </TableCell>
                <TableCell className="text-center">
                  <ConsentBadge value={consent.communication_preferences} required={false} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {consent.consent_versions?.version || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
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

function ConsentBadge({ value, required }: { value?: boolean; required: boolean }) {
  if (value) {
    return (
      <Badge variant="default" className="bg-green-600">
        <Check className="h-3 w-3 mr-1" />
        Igen
      </Badge>
    );
  }
  
  return (
    <Badge variant={required ? "destructive" : "secondary"}>
      <X className="h-3 w-3 mr-1" />
      Nem
    </Badge>
  );
}
