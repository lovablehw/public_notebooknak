import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MousePointer2, Loader2, Info, ExternalLink, ArrowLeft, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useButtonConfigs, ButtonConfig } from "@/hooks/useButtonConfigs";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useButtonConfigSync } from "@/hooks/useButtonConfigSync";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface AdminQuestionnaire {
  id: string;
  name: string;
  is_active: boolean;
}

interface CombinedConfig {
  questionnaireId: string;
  questionnaireName: string;
  buttonConfig: ButtonConfig | null;
  hasPendingUrl: boolean;
}

const AdminButtonConfigs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { buttonConfigs, loading, refetch, updateButtonConfig, deleteButtonConfig, createButtonConfig } = useButtonConfigs();
  const { isSuperAdmin, loading: roleLoading } = useAdminRole();
  const { syncButtonConfigs, syncCompleted, syncing: autoSyncing } = useButtonConfigSync();
  const [manualSyncing, setManualSyncing] = useState(false);
  
  // Fetch ALL questionnaires directly (admin bypass of RLS via service_admin check in policy)
  const [allQuestionnaires, setAllQuestionnaires] = useState<AdminQuestionnaire[]>([]);
  const [questionnairesLoading, setQuestionnairesLoading] = useState(true);

  const fetchAllQuestionnaires = async () => {
    setQuestionnairesLoading(true);
    try {
      const { data, error } = await supabase
        .from('questionnaires_config')
        .select('id, name, is_active')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching all questionnaires:", error);
        setAllQuestionnaires([]);
      } else {
        setAllQuestionnaires(data || []);
      }
    } finally {
      setQuestionnairesLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin && !roleLoading) {
      fetchAllQuestionnaires();
    }
  }, [isSuperAdmin, roleLoading]);

  // Refetch button configs and questionnaires after auto-sync completes
  useEffect(() => {
    if (syncCompleted) {
      refetch();
      fetchAllQuestionnaires();
    }
  }, [syncCompleted, refetch]);

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ButtonConfig | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    button_label: "",
    tooltip: "",
    target_url: "",
    url_target: "_blank" as "_blank" | "_self",
  });

  // Combine questionnaires with button configs
  const combinedConfigs = useMemo((): CombinedConfig[] => {
    return allQuestionnaires.map(q => {
      // Find button config - check both q_ prefixed and legacy formats
      const prefixedId = `q_${q.id}`;
      const config = buttonConfigs.find(bc => 
        bc.gomb_azonosito === prefixedId || bc.gomb_azonosito === q.id
      );
      
      const hasPendingUrl = !config || !config.target_url || config.target_url === '/404';
      
      return {
        questionnaireId: q.id,
        questionnaireName: q.name,
        buttonConfig: config || null,
        hasPendingUrl,
      };
    });
  }, [allQuestionnaires, buttonConfigs]);

  const handleManualSync = async () => {
    setManualSyncing(true);
    await syncButtonConfigs();
    await refetch();
    setManualSyncing(false);
    toast({ title: "Szinkronizálás kész", description: "A hiányzó konfigurációk létrehozva." });
  };

  const openEdit = (config: ButtonConfig | null, questionnaire: { id: string; name: string }) => {
    setSelectedConfig(config);
    setSelectedQuestionnaire(questionnaire);
    setFormData({
      button_label: config?.button_label || "Kezdés",
      tooltip: config?.tooltip || "",
      target_url: config?.target_url || "",
      url_target: config?.url_target || "_blank",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedQuestionnaire) return;

    if (!formData.button_label.trim()) {
      toast({ title: "Hiba", description: "A gomb felirat kötelező.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let success = false;
      
      if (selectedConfig) {
        // Update existing config
        success = await updateButtonConfig(selectedConfig.gomb_azonosito, {
          button_label: formData.button_label,
          tooltip: formData.tooltip || null,
          target_url: formData.target_url || null,
          url_target: formData.url_target,
        });
      } else {
        // Create new config
        success = await createButtonConfig({
          gomb_azonosito: `q_${selectedQuestionnaire.id}`,
          button_label: formData.button_label,
          tooltip: formData.tooltip || null,
          target_url: formData.target_url || null,
          url_target: formData.url_target,
        });
      }

      if (success) {
        toast({ title: "Siker", description: "Gomb konfiguráció mentve." });
        setIsEditOpen(false);
        setSelectedConfig(null);
        setSelectedQuestionnaire(null);
        await refetch();
      } else {
        toast({ title: "Hiba", description: "Nem sikerült menteni a konfigurációt.", variant: "destructive" });
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

  // Access control check - only super admin can access
  if (!roleLoading && !isSuperAdmin) {
    return (
      <AdminLayout title="Gomb Karbantartó">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Nincs jogosultságod ehhez az oldalhoz. Csak Super Admin férhet hozzá.</p>
        </div>
      </AdminLayout>
    );
  }

  if (loading || roleLoading || questionnairesLoading) {
    return (
      <AdminLayout title="Gomb Karbantartó">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const pendingCount = combinedConfigs.filter(c => c.hasPendingUrl).length;

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
          <Button 
            onClick={handleManualSync} 
            disabled={manualSyncing || autoSyncing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${manualSyncing || autoSyncing ? 'animate-spin' : ''}`} />
            Szinkronizálás
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Hogyan működik?</p>
                <p>
                  Minden kérdőív automatikusan kap egy gomb konfigurációt létrehozáskor (alapértelmezett cél: /404). 
                  Itt módosíthatod a gombok feliratát, tooltip szövegét, cél URL-jét és a megnyitási módot.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning for pending configs */}
        {pendingCount > 0 && (
          <Card className="border-amber-500/30 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">{pendingCount} konfiguráció várakozik beállításra</p>
                  <p>
                    Ezek a kérdőívek a /404 oldalra irányítanak, amíg nem állítod be a cél URL-t.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Button Configs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kérdőív Gomb Konfigurációk</CardTitle>
            <CardDescription>{combinedConfigs.length} kérdőív összesen</CardDescription>
          </CardHeader>
          <CardContent>
            {combinedConfigs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Még nincs kérdőív. Hozz létre egyet a Kérdőívek menüpontban.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kérdőív</TableHead>
                      <TableHead>Felirat</TableHead>
                      <TableHead>Cél URL</TableHead>
                      <TableHead>Állapot</TableHead>
                      <TableHead>Módosítva</TableHead>
                      <TableHead className="text-right">Műveletek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedConfigs.map((item) => (
                      <TableRow key={item.questionnaireId}>
                        <TableCell>
                          <div>
                            <span className="font-medium block">{item.questionnaireName}</span>
                            <code className="text-xs text-muted-foreground">
                              {item.questionnaireId.substring(0, 8)}...
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{item.buttonConfig?.button_label || "Kezdés"}</span>
                        </TableCell>
                        <TableCell>
                          {item.buttonConfig?.target_url && item.buttonConfig.target_url !== '/404' ? (
                            <a 
                              href={item.buttonConfig.target_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-sm"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {item.buttonConfig.target_url.substring(0, 30)}...
                            </a>
                          ) : (
                            <span className="text-amber-600 text-sm flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              /404
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.hasPendingUrl ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">
                              Beállításra vár
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                              Konfigurálva
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.buttonConfig 
                            ? format(new Date(item.buttonConfig.updated_at), "yyyy. MMM d. HH:mm", { locale: hu })
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEdit(item.buttonConfig, { 
                                id: item.questionnaireId, 
                                name: item.questionnaireName 
                              })} 
                              title="Szerkesztés"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {item.buttonConfig && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(item.buttonConfig!.gomb_azonosito)} 
                                title="Törlés"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
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
              <DialogTitle>
                {selectedConfig ? "Gomb konfiguráció szerkesztése" : "Gomb konfiguráció létrehozása"}
              </DialogTitle>
              <DialogDescription>
                {selectedQuestionnaire?.name}
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
                <Label htmlFor="target_url">Cél URL *</Label>
                <Input
                  id="target_url"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  placeholder="https://example.com/survey"
                />
                <p className="text-xs text-muted-foreground">
                  A /404 vagy üres URL esetén a felhasználó a "konfiguráció folyamatban" oldalra kerül.
                </p>
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
