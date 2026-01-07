import { useState } from "react";
import DOMPurify from "dompurify";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminConsentVersions } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function AdminConsentVersions() {
  const { data: versions, isLoading } = useAdminConsentVersions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<typeof versions[0] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newVersion, setNewVersion] = useState({
    title: "",
    version: "",
    content: "",
  });

  const handleCreate = async () => {
    if (!newVersion.title || !newVersion.version || !newVersion.content) {
      toast({
        title: "Hiányzó mezők",
        description: "Kérjük, töltse ki az összes mezőt.",
        variant: "destructive",
      });
      return;
    }

    // Validate no HTML/script content using DOMPurify to prevent XSS
    // Sanitize with no allowed tags - if output differs from input, HTML was present
    const sanitizedTitle = DOMPurify.sanitize(newVersion.title, { ALLOWED_TAGS: [] });
    const sanitizedContent = DOMPurify.sanitize(newVersion.content, { ALLOWED_TAGS: [] });
    
    if (sanitizedTitle !== newVersion.title || sanitizedContent !== newVersion.content) {
      toast({
        title: "Érvénytelen tartalom",
        description: "HTML címkék, szkriptek és kódolt tartalom nem engedélyezettek.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from("consent_versions").insert({
        title: newVersion.title,
        version: newVersion.version,
        content: newVersion.content,
      });

      if (error) throw error;

      toast({
        title: "Sikeres létrehozás",
        description: "Az új hozzájárulási verzió sikeresen létrejött.",
      });

      setCreateOpen(false);
      setNewVersion({ title: "", version: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "consent-versions"] });
    } catch (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült létrehozni a verziót.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Hozzájárulási verziók">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const latestVersion = versions?.[0];
  const hasVersions = versions && versions.length > 0;

  return (
    <AdminLayout title="Hozzájárulási verziók">
      {/* Legal warning */}
      <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <strong>Figyelmeztetés:</strong> A hozzájárulási szöveg módosítása jogi és etikai következményekkel járhat. 
          Kérjük, egyeztessen a jogi és etikai szakértőkkel új verzió létrehozása előtt.
        </AlertDescription>
      </Alert>

      {/* Create button */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          {hasVersions ? (
            <p className="text-sm text-muted-foreground">
              Jelenlegi aktív verzió: <Badge variant="default">{latestVersion?.version}</Badge>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nincs aktív hozzájárulási verzió
            </p>
          )}
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Új verzió
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Új hozzájárulási verzió létrehozása</DialogTitle>
              <DialogDescription>
                A legújabb verzió automatikusan aktívvá válik. A korábbi verziók megmaradnak az előzményekben.
              </DialogDescription>
            </DialogHeader>
            
            {/* Warning in dialog */}
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                A hozzájárulási szöveg módosítása jogi és etikai következményekkel járhat.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Cím</Label>
                  <Input
                    id="title"
                    placeholder="pl. Adatvédelmi nyilatkozat"
                    value={newVersion.title}
                    onChange={(e) => setNewVersion({ ...newVersion, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Verzió</Label>
                  <Input
                    id="version"
                    placeholder="pl. 1.2"
                    value={newVersion.version}
                    onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Tartalom (magyar nyelven)</Label>
                <Textarea
                  id="content"
                  placeholder="A hozzájárulás teljes szövege..."
                  rows={10}
                  value={newVersion.content}
                  onChange={(e) => setNewVersion({ ...newVersion, content: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Mégse
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Létrehozás
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table or empty state */}
      {!hasVersions ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">Még nincs hozzájárulási verzió létrehozva.</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Első verzió létrehozása
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Verzió</TableHead>
                <TableHead>Cím</TableHead>
                <TableHead>Létrehozva</TableHead>
                <TableHead>Hatályba lép</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions?.map((version, index) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {version.version}
                      </Badge>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-500/30">
                          Aktív
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{version.title}</TableCell>
                  <TableCell>
                    {format(new Date(version.created_at), "yyyy.MM.dd HH:mm", { locale: hu })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(version.effective_date), "yyyy.MM.dd", { locale: hu })}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Version detail drawer */}
      <Sheet open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <SheetContent className="w-[500px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Hozzájárulási verzió megtekintése</SheetTitle>
            <SheetDescription>
              Verzió: {selectedVersion?.version}
            </SheetDescription>
          </SheetHeader>
          {selectedVersion && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cím</label>
                <p className="font-medium">{selectedVersion.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Verzió</label>
                <p>{selectedVersion.version}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Létrehozva</label>
                <p>{format(new Date(selectedVersion.created_at), "yyyy.MM.dd HH:mm", { locale: hu })}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tartalom</label>
                <div className="mt-2 p-4 bg-muted rounded-lg max-h-[400px] overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{selectedVersion.content}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
