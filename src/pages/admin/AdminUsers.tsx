import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminProfiles, useAdminUserAchievements } from "@/hooks/useAdminData";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Search, Eye, Users, Check, X, Lock } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

type ProfileWithConsent = ReturnType<typeof useAdminProfiles>["data"] extends (infer T)[] | undefined ? T : never;

export default function AdminUsers() {
  const { data: profiles, isLoading } = useAdminProfiles();
  const [search, setSearch] = useState("");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileWithConsent | null>(null);
  
  // Get achievements for selected user
  const { data: userAchievements } = useAdminUserAchievements(selectedUser?.id);

  const filteredProfiles = profiles?.filter((profile) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      profile.id.toLowerCase().includes(searchLower) ||
      profile.display_name.toLowerCase().includes(searchLower);
    
    const matchesConsentFilter = !onlyIncomplete || !profile.consentStatus.complete;
    
    return matchesSearch && matchesConsentFilter;
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

  if (!profiles || profiles.length === 0) {
    return (
      <AdminLayout title="Felhasználók">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Még nincs regisztrált felhasználó.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Felhasználók">
      {/* Search and filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Keresés azonosító vagy név alapján..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox 
            id="incomplete" 
            checked={onlyIncomplete}
            onCheckedChange={(checked) => setOnlyIncomplete(checked === true)}
          />
          <Label htmlFor="incomplete" className="text-sm cursor-pointer">
            Csak hiányos hozzájárulás
          </Label>
        </div>
      </div>

      {/* Info box */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
        <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Ez az oldal csak olvasható. A felhasználói adatok nem módosíthatók, és a feltöltött fájlok nem érhetők el.
        </p>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Azonosító</TableHead>
              <TableHead>Név</TableHead>
              <TableHead>Regisztráció dátuma</TableHead>
              <TableHead>Hozzájárulás állapota</TableHead>
              <TableHead className="text-right">Pontok</TableHead>
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
                <TableCell className="text-right font-medium">{profile.totalPoints}</TableCell>
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
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Felhasználó részletei</SheetTitle>
            <SheetDescription>
              Csak olvasható nézet
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* Basic info */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Alapadatok</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Azonosító</label>
                    <p className="font-mono text-xs break-all">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Név</label>
                    <p>{selectedUser.display_name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Korcsoport</label>
                    <p>{selectedUser.age_range}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Dohányzási státusz</label>
                    <p>{selectedUser.smoking_status}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Regisztráció</label>
                    <p>{format(new Date(selectedUser.created_at), "yyyy.MM.dd HH:mm", { locale: hu })}</p>
                  </div>
                </div>
              </div>

              {/* Consent flags */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Hozzájárulások</h3>
                <div className="space-y-2">
                  <ConsentFlag 
                    label="Kutatásban való részvétel (kötelező)" 
                    value={selectedUser.consentStatus.consent?.research_participation}
                    date={selectedUser.consentStatus.consent?.consented_at}
                  />
                  <ConsentFlag 
                    label="Egészségügyi adatok kezelése (kötelező)" 
                    value={selectedUser.consentStatus.consent?.health_data_processing}
                    date={selectedUser.consentStatus.consent?.consented_at}
                  />
                  <ConsentFlag 
                    label="Kommunikáció (opcionális)" 
                    value={selectedUser.consentStatus.consent?.communication_preferences}
                    date={selectedUser.consentStatus.consent?.consented_at}
                  />
                </div>
                <Badge variant={selectedUser.consentStatus.complete ? "default" : "secondary"}>
                  {selectedUser.consentStatus.complete ? "Teljes hozzájárulás" : "Hiányos hozzájárulás"}
                </Badge>
              </div>

              {/* Points */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Pontok</h3>
                <p className="text-2xl font-bold">{selectedUser.totalPoints}</p>
              </div>

              {/* Badges */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Feloldott kitüntetések</h3>
                {userAchievements && userAchievements.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userAchievements.map((ua) => (
                      <div key={ua.id} className="flex items-center gap-1 px-2 py-1 bg-accent/50 rounded">
                        <span className="text-lg">{ua.achievement?.icon}</span>
                        <span className="text-sm">{ua.achievement?.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nincs feloldott kitüntetés.</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function ConsentFlag({ label, value, date }: { label: string; value?: boolean; date?: string }) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {value ? (
          <Badge variant="default" className="bg-green-600">
            <Check className="h-3 w-3 mr-1" />
            Igen
          </Badge>
        ) : (
          <Badge variant="secondary">
            <X className="h-3 w-3 mr-1" />
            Nem
          </Badge>
        )}
        {value && date && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(date), "yyyy.MM.dd", { locale: hu })}
          </span>
        )}
      </div>
    </div>
  );
}
