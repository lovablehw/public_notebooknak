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
import { Loader2, ScrollText } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

/**
 * Masks an email address for display to reduce exposure risk.
 * Example: "admin@example.com" -> "a***n@example.com"
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain || localPart.length <= 2) {
    return localPart.charAt(0) + "***@" + (domain || "***");
  }
  const firstChar = localPart.charAt(0);
  const lastChar = localPart.charAt(localPart.length - 1);
  return `${firstChar}***${lastChar}@${domain}`;
}

const eventTypeLabels: Record<string, string> = {
  user_registered: "Felhasználó regisztrált",
  consent_submitted: "Hozzájárulás megadva",
  questionnaire_completed: "Kérdőív kitöltve",
  points_added: "Pont jóváírva",
  admin_added: "Adminisztrátor hozzáadva",
  admin_removed: "Adminisztrátor eltávolítva",
};

// Friendly descriptions for events
const getEventDescription = (eventType: string, metadata: Record<string, any> | null): string => {
  switch (eventType) {
    case "user_registered":
      return "Új felhasználó regisztrált a platformra.";
    case "consent_submitted":
      return "A felhasználó megadta hozzájárulását.";
    case "questionnaire_completed":
      const qName = metadata?.questionnaire_name || "kérdőív";
      return `A felhasználó kitöltött egy kérdőívet: ${qName}`;
    case "points_added":
      const points = metadata?.points || 0;
      const reason = metadata?.reason || "tevékenység";
      return `${points} pont jóváírva: ${reason}`;
    case "admin_added":
      const addedEmail = metadata?.email ? maskEmail(metadata.email) : "ismeretlen";
      return `Új adminisztrátor hozzáadva: ${addedEmail}`;
    case "admin_removed":
      const removedEmail = metadata?.email ? maskEmail(metadata.email) : "ismeretlen";
      return `Adminisztrátor eltávolítva: ${removedEmail}`;
    default:
      return "Esemény történt.";
  }
};

const eventTypeColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  user_registered: "default",
  consent_submitted: "secondary",
  questionnaire_completed: "outline",
  points_added: "default",
  admin_added: "default",
  admin_removed: "destructive",
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

  const hasEvents = events && events.length > 0;

  return (
    <AdminLayout title="Napló">
      {!hasEvents ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ScrollText className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Még nincs rögzített esemény.</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-6 flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Esemény típusa:</span>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Összes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes esemény</SelectItem>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {eventTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {eventTypeFilter !== "all" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEventTypeFilter("all")}
              >
                Szűrő törlése
              </Button>
            )}
          </div>

          {/* Table */}
          <div id="table-audit-log" className="border rounded-lg scroll-mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Időpont</TableHead>
                  <TableHead>Esemény típusa</TableHead>
                  <TableHead>Ki végezte</TableHead>
                  <TableHead>Rövid leírás</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents?.map((event) => (
                  <TableRow key={event.id} id={`audit-${event.id}`} className="scroll-mt-4">
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
                        <span className="text-sm" title="Az email cím biztonsági okokból részlegesen rejtett">{maskEmail(event.actor_email)}</span>
                      ) : event.actor_user_id ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {event.actor_user_id.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Rendszer</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md text-sm text-muted-foreground">
                      {getEventDescription(event.event_type, event.metadata as Record<string, any> | null)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEvents?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nincs találat a szűrési feltételekkel
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
