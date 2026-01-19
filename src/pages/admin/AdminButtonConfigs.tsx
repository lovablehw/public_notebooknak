import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2, MousePointer2, Loader2, Info, ExternalLink, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useButtonConfigs, ButtonConfig } from "@/hooks/useButtonConfigs";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

const AdminButtonConfigs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { buttonConfigs, loading, refetch, updateButtonConfig, deleteButtonConfig } = useButtonConfigs();
  const { isSuperAdmin, isServiceAdmin, loading: roleLoading } = useAdminRole();

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ButtonConfig | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    button_label: "",
    tooltip: "",
    target_url: "",
    url_target: "_blank" as "_blank" | "_self",
  });

  const openEdit = (config: ButtonConfig) => {
    setSelectedConfig(config);
    setFormData({
      button_label: config.button_label,
      tooltip: config.tooltip || "",
      target_url: config.target_url || "",
      url_target: config.url_target,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedConfig) return;

    if (!formData.button_label.trim()) {
      toast({ title: "Hiba", description: "A gomb felirat kötelező.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const success = await updateButtonConfig(selectedConfig.gomb_azonosito, {
        button_label: formData.button_label,
        tooltip: formData.tooltip || null,
        target_url: formData.target_url || null,
        url_target: formData.url_target,
      });

      if (success) {
        toast({ title: "Siker", description: "Gomb konfiguráció frissítve." });
        setIsEditOpen(false);
        setSelectedConfig(null);
      } else {
        toast({ title: "Hiba", description: "Nem sikerült frissíteni a konfigurációt.", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (gombAzonosito: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a gomb konfigurációt?")) return;

    const success = await deleteButtonConfig(gombAzonosito);
    if (success) {
      toast({ title: "Siker", description: "Gomb konfiguráció törölve." });
    } else {
      toast({ title: "Hiba", description: "Nem sikerült törölni a konfigurációt.", variant: "destructive" });
    }
  };

  // Access control check
  if (!roleLoading && !isServiceAdmin) {
    return (
      <AdminLayout title="Gomb Karbantartó">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Nincs jogosultságod ehhez az oldalhoz.</p>
        </div>
      </AdminLayout>
    );
  }

  if (loading || roleLoading) {
    return (
      <AdminLayout title="Gomb Karbantartó">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gomb Karbantartó">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/kerdoivek')}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Vissza
              </Button>
            </div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <MousePointer2 className="h-6 w-6 text-primary" />
              Gomb Karbantartó
            </h1>
            <p className="text-muted-foreground">
              Globális gomb konfigurációk kezelése a kérdőív widgetekhez.
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Hogyan működik?</p>
                <p>
                  Minden kérdőív automatikusan kap egy gomb konfigurációt létrehozáskor. 
                  Itt módosíthatod a gombok feliratát, tooltip szövegét és a megnyitási módot.
                  {!isSuperAdmin && (
                    <span className="block mt-1 text-amber-600">
                      Figyelem: Csak super admin jogosultsággal lehet szerkeszteni vagy törölni.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Configs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gomb Konfigurációk</CardTitle>
            <CardDescription>{buttonConfigs.length} konfiguráció</CardDescription>
          </CardHeader>
          <CardContent>
            {buttonConfigs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Még nincs gomb konfiguráció. Hozz létre egy kérdőívet a konfigurációk automatikus generálásához.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Azonosító</TableHead>
                      <TableHead>Felirat</TableHead>
                      <TableHead>Tooltip</TableHead>
                      <TableHead>Cél URL</TableHead>
                      <TableHead>Megnyitás</TableHead>
                      <TableHead>Módosítva</TableHead>
                      {isSuperAdmin && <TableHead className="text-right">Műveletek</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buttonConfigs.map((config) => (
                      <TableRow key={config.gomb_azonosito}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {config.gomb_azonosito.substring(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{config.button_label}</span>
                        </TableCell>
                        <TableCell>
                          {config.tooltip ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-muted-foreground cursor-help underline decoration-dotted">
                                  {config.tooltip.substring(0, 30)}...
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{config.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {config.target_url ? (
                            <a 
                              href={config.target_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-sm"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Link
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded ${
                            config.url_target === '_blank' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {config.url_target === '_blank' ? 'Új ablak' : 'Ugyanitt'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(config.updated_at), "yyyy. MMM d. HH:mm", { locale: hu })}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openEdit(config)} 
                                title="Szerkesztés"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(config.gomb_azonosito)} 
                                title="Törlés"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gomb konfiguráció szerkesztése</DialogTitle>
              <DialogDescription>
                Módosítsd a gomb megjelenését és viselkedését.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="button_label">Gomb felirat *</Label>
                <Input
                  id="button_label"
                  value={formData.button_label}
                  onChange={(e) => setFormData({ ...formData, button_label: e.target.value })}
                  placeholder="Pl. Kezdés, Folytatás"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tooltip">Tooltip szöveg</Label>
                <Input
                  id="tooltip"
                  value={formData.tooltip}
                  onChange={(e) => setFormData({ ...formData, tooltip: e.target.value })}
                  placeholder="Segítő szöveg a gomb fölé vitelekor..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_url">Cél URL</Label>
                <Input
                  id="target_url"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  placeholder="https://example.com/survey"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url_target">Megnyitás módja</Label>
                <Select
                  value={formData.url_target}
                  onValueChange={(value: "_blank" | "_self") => 
                    setFormData({ ...formData, url_target: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_blank">Új ablakban (_blank)</SelectItem>
                    <SelectItem value="_self">Ugyanebben az ablakban (_self)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Mégse
              </Button>
              <Button onClick={handleUpdate} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Mentés
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminButtonConfigs;
