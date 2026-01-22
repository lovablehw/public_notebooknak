import { useState, useMemo } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
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
  page_load: "Oldal betöltés",
  button_click: "Gomb kattintás",
  auth_login: "Bejelentkezés",
  auth_logout: "Kijelentkezés",
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
    case "page_load":
      const pageTitle = metadata?.page_title || metadata?.page_path || "oldal";
      return `Oldal megtekintve: ${pageTitle}`;
    case "button_click":
      const buttonLabel = metadata?.button_label || metadata?.gomb_azonosito || "gomb";
      return `Gomb megnyomva: ${buttonLabel}`;
    case "auth_login":
      return "Sikeres bejelentkezés.";
    case "auth_logout":
      return "Kijelentkezés a rendszerből.";
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
  page_load: "secondary",
  button_click: "outline",
  auth_login: "default",
  auth_logout: "secondary",
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

export default function AdminAuditLog() {
  const { data: events, isLoading } = useAdminAuditEvents(500);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  const eventTypes = [...new Set(events?.map((e) => e.event_type) || [])];

  const filteredEvents = useMemo(() => {
    return events?.filter((event) => {
      if (eventTypeFilter === "all") return true;
      return event.event_type === eventTypeFilter;
    }) || [];
  }, [events, eventTypeFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEvents.slice(startIndex, startIndex + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // Reset to page 1 when filter or page size changes
  const handleFilterChange = (value: string) => {
    setEventTypeFilter(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value) as PageSize);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

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
          {/* Filters and pagination controls */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Esemény típusa:</span>
                <Select value={eventTypeFilter} onValueChange={handleFilterChange}>
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
                  onClick={() => handleFilterChange("all")}
                >
                  Szűrő törlése
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sorok oldalanként:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results info */}
          <div className="mb-4 text-sm text-muted-foreground">
            Összesen {filteredEvents.length} esemény
            {totalPages > 1 && ` • ${currentPage}. oldal / ${totalPages}`}
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
                {paginatedEvents.map((event) => (
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
                {paginatedEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nincs találat a szűrési feltételekkel
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {getVisiblePages().map((page, idx) => (
                    <PaginationItem key={idx}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}