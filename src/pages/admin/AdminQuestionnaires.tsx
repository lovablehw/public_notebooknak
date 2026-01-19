import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Pencil, Trash2, ClipboardList, Users, Loader2, MousePointer2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

interface QuestionnaireConfig {
  id: string;
  name: string;
  description: string | null;
  completion_time: number;
  points: number;
  deadline: string | null;
  target_url: string;
  is_active: boolean;
  created_at: string;
}

interface UserGroup {
  id: string;
  name: string;
  description: string | null;
}

interface QuestionnairePermission {
  id: string;
  questionnaire_id: string;
  group_id: string;
}

const AdminQuestionnaires = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useAdminRole();
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireConfig[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [permissions, setPermissions] = useState<QuestionnairePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireConfig | null>(null);

  // Form states - URL removed for Service Admins (managed via Gomb Karbantartó)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    completion_time: 5,
    points: 10,
    deadline: "",
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qResult, gResult, pResult] = await Promise.all([
        supabase.from('questionnaires_config').select('*').order('created_at', { ascending: false }),
        supabase.from('user_groups').select('*').order('name'),
        supabase.from('questionnaire_permissions').select('*'),
      ]);

      if (qResult.error) throw qResult.error;
      if (gResult.error) throw gResult.error;
      if (pResult.error) throw pResult.error;

      setQuestionnaires(qResult.data || []);
      setGroups(gResult.data || []);
      setPermissions(pResult.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast({ title: "Hiba", description: "Nem sikerült betölteni az adatokat.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!formData.name) {
      toast({ title: "Hiba", description: "A név kötelező.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Insert questionnaire - target_url defaults to /404, trigger creates button_config
      const { error } = await supabase.from('questionnaires_config').insert({
        name: formData.name,
        description: formData.description || null,
        completion_time: formData.completion_time,
        points: formData.points,
        deadline: formData.deadline || null,
        target_url: '/404', // Default - Super Admin configures actual URL via Gomb Karbantartó
        is_active: formData.is_active,
      });

      if (error) throw error;

      toast({ title: "Siker", description: "Kérdőív létrehozva." });
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error creating questionnaire:", err);
      toast({ title: "Hiba", description: "Nem sikerült létrehozni a kérdőívet.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedQuestionnaire) return;

    setSaving(true);
    try {
      // Only update non-URL fields - URL is managed via Gomb Karbantartó by Super Admin
      const { error } = await supabase
        .from('questionnaires_config')
        .update({
          name: formData.name,
          description: formData.description || null,
          completion_time: formData.completion_time,
          points: formData.points,
          deadline: formData.deadline || null,
          is_active: formData.is_active,
        })
        .eq('id', selectedQuestionnaire.id);

      if (error) throw error;

      toast({ title: "Siker", description: "Kérdőív frissítve." });
      setIsEditOpen(false);
      setSelectedQuestionnaire(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error updating questionnaire:", err);
      toast({ title: "Hiba", description: "Nem sikerült frissíteni a kérdőívet.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a kérdőívet?")) return;

    try {
      const { error } = await supabase.from('questionnaires_config').delete().eq('id', id);
      if (error) throw error;

      toast({ title: "Siker", description: "Kérdőív törölve." });
      fetchData();
    } catch (err) {
      console.error("Error deleting questionnaire:", err);
      toast({ title: "Hiba", description: "Nem sikerült törölni a kérdőívet.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('questionnaires_config')
        .update({ is_active: !currentValue })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Error toggling active:", err);
      toast({ title: "Hiba", description: "Nem sikerült módosítani az állapotot.", variant: "destructive" });
    }
  };

  const handleAddPermission = async (questionnaireId: string, groupId: string) => {
    try {
      const { error } = await supabase.from('questionnaire_permissions').insert({
        questionnaire_id: questionnaireId,
        group_id: groupId,
      });

      if (error) throw error;
      fetchData();
      toast({ title: "Siker", description: "Jogosultság hozzáadva." });
    } catch (err) {
      console.error("Error adding permission:", err);
      toast({ title: "Hiba", description: "Nem sikerült hozzáadni a jogosultságot.", variant: "destructive" });
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase.from('questionnaire_permissions').delete().eq('id', permissionId);
      if (error) throw error;
      fetchData();
      toast({ title: "Siker", description: "Jogosultság eltávolítva." });
    } catch (err) {
      console.error("Error removing permission:", err);
      toast({ title: "Hiba", description: "Nem sikerült eltávolítani a jogosultságot.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      completion_time: 5,
      points: 10,
      deadline: "",
      is_active: true,
    });
  };

  const openEdit = (q: QuestionnaireConfig) => {
    setSelectedQuestionnaire(q);
    setFormData({
      name: q.name,
      description: q.description || "",
      completion_time: q.completion_time,
      points: q.points,
      deadline: q.deadline ? q.deadline.split('T')[0] : "",
      is_active: q.is_active,
    });
    setIsEditOpen(true);
  };

  const openPermissions = (q: QuestionnaireConfig) => {
    setSelectedQuestionnaire(q);
    setIsPermissionsOpen(true);
  };

  const getQuestionnairePermissions = (questionnaireId: string) => {
    return permissions.filter(p => p.questionnaire_id === questionnaireId);
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.name || "Ismeretlen";
  };

  const getAvailableGroups = (questionnaireId: string) => {
    const assignedGroupIds = getQuestionnairePermissions(questionnaireId).map(p => p.group_id);
    return groups.filter(g => !assignedGroupIds.includes(g.id));
  };

  if (loading) {
    return (
      <AdminLayout title="Kérdőív konfiguráció">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kérdőív konfiguráció">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              Kérdőív konfiguráció
            </h1>
            <p className="text-muted-foreground">Kérdőívek létrehozása, szerkesztése és jogosultságok kezelése.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSuperAdmin && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => navigate('/admin/gombok')}
              >
                <MousePointer2 className="h-4 w-4" />
                Gombok Kezelése
              </Button>
            )}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Új kérdőív
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Új kérdőív létrehozása</DialogTitle>
                <DialogDescription>Add meg a kérdőív adatait.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Név *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Pl. Napi jólléti felmérés"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Leírás</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Rövid leírás a kérdőívről..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="completion_time">Kitöltési idő (perc)</Label>
                    <Input
                      id="completion_time"
                      type="number"
                      min={1}
                      value={formData.completion_time}
                      onChange={(e) => setFormData({ ...formData, completion_time: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Pont</Label>
                    <Input
                      id="points"
                      type="number"
                      min={0}
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Határidő (opcionális)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <Alert className="bg-muted/50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    A gomb URL-jét a Super Admin állítja be a Gomb Karbantartó felületen.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktív</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Mégse</Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Létrehozás
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Questionnaires Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kérdőívek</CardTitle>
            <CardDescription>{questionnaires.length} kérdőív konfigurálva</CardDescription>
          </CardHeader>
          <CardContent>
            {questionnaires.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Még nincs létrehozva kérdőív.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Név</TableHead>
                      <TableHead>Idő</TableHead>
                      <TableHead>Pont</TableHead>
                      <TableHead>Jogosultságok</TableHead>
                      <TableHead>Állapot</TableHead>
                      <TableHead className="text-right">Műveletek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionnaires.map((q) => {
                      const qPermissions = getQuestionnairePermissions(q.id);
                      return (
                        <TableRow key={q.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{q.name}</p>
                              {q.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{q.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{q.completion_time} perc</TableCell>
                          <TableCell>+{q.points}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {qPermissions.length === 0 ? (
                                <span className="text-xs text-muted-foreground">Nincs</span>
                              ) : (
                                qPermissions.slice(0, 2).map((p) => (
                                  <Badge key={p.id} variant="secondary" className="text-xs">
                                    {getGroupName(p.group_id)}
                                  </Badge>
                                ))
                              )}
                              {qPermissions.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{qPermissions.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={q.is_active}
                              onCheckedChange={() => handleToggleActive(q.id, q.is_active)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openPermissions(q)} title="Jogosultságok">
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(q)} title="Szerkesztés">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} title="Törlés">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
              <DialogTitle>Kérdőív szerkesztése</DialogTitle>
              <DialogDescription>Módosítsd a kérdőív adatait.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Név *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Leírás</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-completion_time">Kitöltési idő (perc)</Label>
                  <Input
                    id="edit-completion_time"
                    type="number"
                    min={1}
                    value={formData.completion_time}
                    onChange={(e) => setFormData({ ...formData, completion_time: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-points">Pont</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    min={0}
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deadline">Határidő (opcionális)</Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <Alert className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  A gomb URL-jét a Super Admin állítja be a Gomb Karbantartó felületen.
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-is_active">Aktív</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Mégse</Button>
              <Button onClick={handleUpdate} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Mentés
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permissions Dialog */}
        <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Jogosultságok kezelése</DialogTitle>
              <DialogDescription>
                {selectedQuestionnaire?.name} - Mely csoportok láthatják ezt a kérdőívet?
              </DialogDescription>
            </DialogHeader>
            {selectedQuestionnaire && (
              <div className="space-y-4 py-4">
                {/* Current permissions */}
                <div className="space-y-2">
                  <Label>Hozzárendelt csoportok</Label>
                  <div className="flex flex-wrap gap-2">
                    {getQuestionnairePermissions(selectedQuestionnaire.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nincs hozzárendelt csoport.</p>
                    ) : (
                      getQuestionnairePermissions(selectedQuestionnaire.id).map((p) => (
                        <Badge key={p.id} variant="secondary" className="gap-1">
                          {getGroupName(p.group_id)}
                          <button
                            onClick={() => handleRemovePermission(p.id)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Add permission */}
                {getAvailableGroups(selectedQuestionnaire.id).length > 0 && (
                  <div className="space-y-2">
                    <Label>Csoport hozzáadása</Label>
                    <Select onValueChange={(value) => handleAddPermission(selectedQuestionnaire.id, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Válassz csoportot..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableGroups(selectedQuestionnaire.id).map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsPermissionsOpen(false)}>Bezárás</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminQuestionnaires;
