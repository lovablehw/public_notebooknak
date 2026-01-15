import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface UserGroupMember {
  id: string;
  user_id: string;
  group_id: string;
}

const AdminUserGroups = () => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [members, setMembers] = useState<UserGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [newMemberUserId, setNewMemberUserId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gResult, mResult] = await Promise.all([
        supabase.from('user_groups').select('*').order('name'),
        supabase.from('user_group_members').select('*'),
      ]);

      if (gResult.error) throw gResult.error;
      if (mResult.error) throw mResult.error;

      setGroups(gResult.data || []);
      setMembers(mResult.data || []);
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
      const { error } = await supabase.from('user_groups').insert({
        name: formData.name,
        description: formData.description || null,
      });

      if (error) throw error;

      toast({ title: "Siker", description: "Csoport létrehozva." });
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error creating group:", err);
      toast({ title: "Hiba", description: "Nem sikerült létrehozni a csoportot.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedGroup) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_groups')
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq('id', selectedGroup.id);

      if (error) throw error;

      toast({ title: "Siker", description: "Csoport frissítve." });
      setIsEditOpen(false);
      setSelectedGroup(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error updating group:", err);
      toast({ title: "Hiba", description: "Nem sikerült frissíteni a csoportot.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group?.name === "all_users") {
      toast({ title: "Hiba", description: "Az alapértelmezett csoportot nem lehet törölni.", variant: "destructive" });
      return;
    }

    if (!confirm("Biztosan törölni szeretnéd ezt a csoportot?")) return;

    try {
      const { error } = await supabase.from('user_groups').delete().eq('id', id);
      if (error) throw error;

      toast({ title: "Siker", description: "Csoport törölve." });
      fetchData();
    } catch (err) {
      console.error("Error deleting group:", err);
      toast({ title: "Hiba", description: "Nem sikerült törölni a csoportot.", variant: "destructive" });
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !newMemberUserId) return;

    try {
      const { error } = await supabase.from('user_group_members').insert({
        user_id: newMemberUserId,
        group_id: selectedGroup.id,
      });

      if (error) throw error;

      toast({ title: "Siker", description: "Tag hozzáadva." });
      setNewMemberUserId("");
      fetchData();
    } catch (err) {
      console.error("Error adding member:", err);
      toast({ title: "Hiba", description: "Nem sikerült hozzáadni a tagot.", variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase.from('user_group_members').delete().eq('id', memberId);
      if (error) throw error;

      fetchData();
      toast({ title: "Siker", description: "Tag eltávolítva." });
    } catch (err) {
      console.error("Error removing member:", err);
      toast({ title: "Hiba", description: "Nem sikerült eltávolítani a tagot.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
  };

  const openEdit = (g: UserGroup) => {
    setSelectedGroup(g);
    setFormData({ name: g.name, description: g.description || "" });
    setIsEditOpen(true);
  };

  const openMembers = (g: UserGroup) => {
    setSelectedGroup(g);
    setIsMembersOpen(true);
  };

  const getGroupMemberCount = (groupId: string) => {
    return members.filter(m => m.group_id === groupId).length;
  };

  const getGroupMembers = (groupId: string) => {
    return members.filter(m => m.group_id === groupId);
  };

  if (loading) {
    return (
      <AdminLayout title="Felhasználói csoportok">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Felhasználói csoportok">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Felhasználói csoportok
            </h1>
            <p className="text-muted-foreground">Csoportok kezelése a jogosultság alapú hozzáféréshez.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Új csoport
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Új csoport létrehozása</DialogTitle>
                <DialogDescription>Add meg a csoport adatait.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Név *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Pl. pilot_users"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Leírás</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Rövid leírás a csoportról..."
                  />
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

        {/* Groups Table */}
        <Card>
          <CardHeader>
            <CardTitle>Csoportok</CardTitle>
            <CardDescription>{groups.length} csoport</CardDescription>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Még nincs csoport.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Név</TableHead>
                      <TableHead>Leírás</TableHead>
                      <TableHead>Tagok</TableHead>
                      <TableHead className="text-right">Műveletek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{g.name}</span>
                            {g.name === "all_users" && (
                              <Badge variant="outline" className="text-xs">Alapértelmezett</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {g.description || "–"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getGroupMemberCount(g.id)} tag</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openMembers(g)} title="Tagok kezelése">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEdit(g)} 
                              title="Szerkesztés"
                              disabled={g.name === "all_users"}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(g.id)} 
                              title="Törlés"
                              disabled={g.name === "all_users"}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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
              <DialogTitle>Csoport szerkesztése</DialogTitle>
              <DialogDescription>Módosítsd a csoport adatait.</DialogDescription>
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

        {/* Members Dialog */}
        <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Csoporttagok</DialogTitle>
              <DialogDescription>{selectedGroup?.name} - Felhasználók kezelése</DialogDescription>
            </DialogHeader>
            {selectedGroup && (
              <div className="space-y-4 py-4">
                {/* Add member */}
                <div className="space-y-2">
                  <Label>Új tag hozzáadása (User ID)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newMemberUserId}
                      onChange={(e) => setNewMemberUserId(e.target.value)}
                      placeholder="UUID..."
                    />
                    <Button onClick={handleAddMember} disabled={!newMemberUserId}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Current members */}
                <div className="space-y-2">
                  <Label>Jelenlegi tagok ({getGroupMemberCount(selectedGroup.id)})</Label>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {getGroupMembers(selectedGroup.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nincs tag a csoportban.</p>
                    ) : (
                      getGroupMembers(selectedGroup.id).map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span className="font-mono text-xs truncate flex-1">{m.user_id}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => handleRemoveMember(m.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsMembersOpen(false)}>Bezárás</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUserGroups;
