import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuditEvents } from "@/hooks/useAdminData";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

// Event type translations
const eventTypeLabels: Record<string, string> = {
  user_registered: "Regisztráció",
  consent_submitted: "Hozzájárulás",
  questionnaire_completed: "Kérdőív kitöltve",
  points_added: "Pont jóváírás",
};

const eventTypeColors: Record<string, "default" | "secondary" | "outline"> = {
  user_registered: "default",
  consent_submitted: "secondary",
  questionnaire_completed: "outline",
  points_added: "default",
};

export default function AdminAuditLog() {
  const { data: events, isLoading } = useAdminAuditEvents(200);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  const eventTypes = [...new Set(events?.map((e) => e.event_type) || [])];

  const filteredEvents = events?.filter((event) => {
    if (eventTypeFilter === "all") return true;
    return event.event_type === eventTypeFilter;
  });

  if (isLoading) {
    return (
      <AdminLayout title="Napló">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Napló">
      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Esemény típusa:</span>
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Összes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Összes</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {eventTypeLabels[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setEventTypeFilter("all")}
        >
          Szűrők törlése
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dátum/idő</TableHead>
              <TableHead>Esemény</TableHead>
              <TableHead>Felhasználó</TableHead>
              <TableHead>Részletek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents?.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(event.created_at), "yyyy.MM.dd HH:mm:ss", { locale: hu })}
                </TableCell>
                <TableCell>
                  <Badge variant={eventTypeColors[event.event_type] || "secondary"}>
                    {eventTypeLabels[event.event_type] || event.event_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {event.actor_email ? (
                    <span className="text-sm">{event.actor_email}</span>
                  ) : event.actor_user_id ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {event.actor_user_id.slice(0, 8)}...
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {event.metadata && Object.keys(event.metadata as object).length > 0 ? (
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {JSON.stringify(event.metadata)}
                    </code>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredEvents?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nincs esemény
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
