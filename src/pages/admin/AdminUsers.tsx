import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminProfiles } from "@/hooks/useAdminData";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

export default function AdminUsers() {
  const { data: profiles, isLoading } = useAdminProfiles();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<typeof profiles[0] | null>(null);

  const filteredProfiles = profiles?.filter((profile) => {
    const searchLower = search.toLowerCase();
    return (
      profile.id.toLowerCase().includes(searchLower) ||
      profile.display_name.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <AdminLayout title="Felhasználók">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Felhasználók">
      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Keresés azonosító vagy név alapján..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Azonosító</TableHead>
              <TableHead>Név</TableHead>
              <TableHead>Regisztráció dátuma</TableHead>
              <TableHead>Hozzájárulás állapota</TableHead>
              <TableHead>Pontok</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles?.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-mono text-xs">
                  {profile.id.slice(0, 8)}...
                </TableCell>
                <TableCell>{profile.display_name}</TableCell>
                <TableCell>
                  {format(new Date(profile.created_at), "yyyy.MM.dd", { locale: hu })}
                </TableCell>
                <TableCell>
                  <Badge variant={profile.consentStatus.complete ? "default" : "secondary"}>
                    {profile.consentStatus.complete ? "Teljes" : "Hiányos"}
                  </Badge>
                </TableCell>
                <TableCell>{profile.totalPoints}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedUser(profile)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredProfiles?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nincs találat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* User detail drawer */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Felhasználó részletei</SheetTitle>
            <SheetDescription>
              Részletes információk a felhasználóról
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Azonosító</label>
                <p className="font-mono text-sm">{selectedUser.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Név</label>
                <p>{selectedUser.display_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Korcsoport</label>
                <p>{selectedUser.age_range}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dohányzási státusz</label>
                <p>{selectedUser.smoking_status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Regisztráció</label>
                <p>{format(new Date(selectedUser.created_at), "yyyy.MM.dd HH:mm", { locale: hu })}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pontok</label>
                <p className="text-lg font-bold">{selectedUser.totalPoints}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hozzájárulás</label>
                <Badge variant={selectedUser.consentStatus.complete ? "default" : "secondary"}>
                  {selectedUser.consentStatus.complete ? "Teljes" : "Hiányos"}
                </Badge>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
