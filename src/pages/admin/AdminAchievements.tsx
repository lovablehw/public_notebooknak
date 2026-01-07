import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAchievements } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trophy, Plus, Pencil, Copy, Trash2, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AchievementFormData {
  name: string;
  description: string;
  icon: string;
  points_required: number;
  is_active?: boolean;
}

// Hungarian name mapping for achievements
const achievementNames: Record<string, string> = {
  "First Steps": "Első lépések",
  "Getting Started": "Kezdő lendület",
  "Weekly Hero": "Heti Hős",
  "Data Champion": "Adatbajnok",
  "Research Hero": "Kutatási Hős",
};

export default function AdminAchievements() {
  const { data: achievements, isLoading, refetch } = useAdminAchievements();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<(AchievementFormData & { id?: string }) | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AchievementFormData) => {
      const { error } = await supabase
        .from("achievements")
        .insert([{
          name: data.name,
          description: data.description,
          icon: data.icon,
          points_required: data.points_required,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sikeres", description: "Kitüntetés létrehozva." });
      queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
      setIsDialogOpen(false);
      setEditingAchievement(null);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Hiba", description: error.message });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: AchievementFormData & { id: string }) => {
      const { error } = await supabase
        .from("achievements")
        .update({
          name: data.name,
          description: data.description,
          icon: data.icon,
          points_required: data.points_required,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sikeres", description: "Kitüntetés frissítve." });
      queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
      setIsDialogOpen(false);
      setEditingAchievement(null);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Hiba", description: error.message });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sikeres", description: "Kitüntetés törölve." });
      queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Hiba", description: error.message });
    },
  });

  const handleCreate = () => {
    setEditingAchievement({ name: "", description: "", icon: "🏆", points_required: 100 });
    setIsDialogOpen(true);
  };

  const handleEdit = (achievement: typeof achievements extends (infer T)[] ? T : never) => {
    setEditingAchievement({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      points_required: achievement.points_required,
    });
    setIsDialogOpen(true);
  };

  const handleClone = (achievement: typeof achievements extends (infer T)[] ? T : never) => {
    setEditingAchievement({
      name: `${achievement.name} (másolat)`,
      description: achievement.description,
      icon: achievement.icon,
      points_required: achievement.points_required,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAchievement) return;

    if (editingAchievement.id) {
      updateMutation.mutate({ ...editingAchievement, id: editingAchievement.id });
    } else {
      createMutation.mutate(editingAchievement);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Kitüntetések">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const totalUnlocks = achievements?.reduce((sum, a) => sum + a.unlockCount, 0) || 0;
  const hasData = achievements && achievements.length > 0;

  return (
    <AdminLayout title="Kitüntetések">
      {/* Header with create button */}
      <div className="flex items-center justify-between mb-6">
        <div className="p-4 bg-accent/50 rounded-lg flex items-center gap-4">
          <Trophy className="h-8 w-8 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">Összes feloldott kitüntetés</div>
            <div className="text-3xl font-bold text-foreground">
              {hasData ? totalUnlocks : "Még nincs adat"}
            </div>
          </div>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Új kitüntetés
        </Button>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Még nincs kitüntetés definiálva.</p>
          <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Első kitüntetés létrehozása
          </Button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {achievements?.map((achievement) => (
              <Card key={achievement.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <span className="truncate">
                      {achievementNames[achievement.name] || achievement.name}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{achievement.unlockCount}</div>
                  <p className="text-xs text-muted-foreground">felhasználó</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ikon</TableHead>
                  <TableHead>Név</TableHead>
                  <TableHead>Leírás</TableHead>
                  <TableHead className="text-right">Szükséges pont</TableHead>
                  <TableHead className="text-right">Feloldások</TableHead>
                  <TableHead className="text-right">Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievements?.map((achievement) => (
                  <TableRow key={achievement.id}>
                    <TableCell className="text-2xl">{achievement.icon}</TableCell>
                    <TableCell className="font-medium">
                      {achievementNames[achievement.name] || achievement.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {achievement.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{achievement.points_required} pont</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {achievement.unlockCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(achievement)}
                          title="Szerkesztés"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleClone(achievement)}
                          title="Másolás"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(achievement.id)}
                          title="Törlés"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAchievement?.id ? "Kitüntetés szerkesztése" : "Új kitüntetés"}
            </DialogTitle>
            <DialogDescription>
              Add meg a kitüntetés adatait.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Név</Label>
                <Input
                  id="name"
                  value={editingAchievement?.name || ""}
                  onChange={(e) => setEditingAchievement((prev) => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Kitüntetés neve"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Leírás</Label>
                <Textarea
                  id="description"
                  value={editingAchievement?.description || ""}
                  onChange={(e) => setEditingAchievement((prev) => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Rövid leírás"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Ikon (emoji)</Label>
                  <Input
                    id="icon"
                    value={editingAchievement?.icon || ""}
                    onChange={(e) => setEditingAchievement((prev) => prev ? { ...prev, icon: e.target.value } : null)}
                    placeholder="🏆"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Szükséges pont</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    value={editingAchievement?.points_required || 0}
                    onChange={(e) => setEditingAchievement((prev) => prev ? { ...prev, points_required: parseInt(e.target.value) || 0 } : null)}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Mégse
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingAchievement?.id ? "Mentés" : "Létrehozás"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kitüntetés törlése</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan törlöd? Ez a művelet nem visszavonható.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
