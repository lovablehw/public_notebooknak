import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAchievements } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trophy, Plus, Pencil, Copy, Trash2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ActivityType = 
  | "questionnaire_completion"
  | "lab_upload"
  | "discharge_upload"
  | "patient_summary_upload"
  | "observation_creation";

interface BadgeCondition {
  id?: string;
  achievement_id: string;
  activity_type: ActivityType;
  required_count: number;
}

interface AchievementFormData {
  name: string;
  description: string;
  icon: string;
  points_required: number;
  min_points_threshold?: number | null;
  conditions: BadgeCondition[];
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  questionnaire_completion: "Kérdőív kitöltése",
  lab_upload: "Laboreredmény feltöltése",
  discharge_upload: "Zárójelentés feltöltése",
  patient_summary_upload: "Betegösszefoglaló feltöltése",
  observation_creation: "Saját megfigyelés rögzítése",
};

const ACTIVITY_TYPES: ActivityType[] = [
  "questionnaire_completion",
  "lab_upload",
  "discharge_upload",
  "patient_summary_upload",
  "observation_creation",
];

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

  // Fetch badge conditions for all achievements
  const { data: badgeConditions } = useQuery({
    queryKey: ["badge_conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_conditions")
        .select("*");
      if (error) throw error;
      return data as BadgeCondition[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AchievementFormData) => {
      // Insert achievement first
      const { data: newAchievement, error } = await supabase
        .from("achievements")
        .insert([{
          name: data.name,
          description: data.description,
          icon: data.icon,
          points_required: data.points_required,
          min_points_threshold: data.min_points_threshold || null,
        }])
        .select()
        .single();
      if (error) throw error;

      // Insert badge conditions
      if (data.conditions.length > 0) {
        const conditionsToInsert = data.conditions.map(c => ({
          achievement_id: newAchievement.id,
          activity_type: c.activity_type,
          required_count: c.required_count,
        }));
        const { error: condError } = await supabase
          .from("badge_conditions")
          .insert(conditionsToInsert);
        if (condError) throw condError;
      }
    },
    onSuccess: () => {
      toast({ title: "Sikeres", description: "Kitüntetés létrehozva." });
      queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
      queryClient.invalidateQueries({ queryKey: ["badge_conditions"] });
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
      // Update achievement
      const { error } = await supabase
        .from("achievements")
        .update({
          name: data.name,
          description: data.description,
          icon: data.icon,
          points_required: data.points_required,
          min_points_threshold: data.min_points_threshold || null,
        })
        .eq("id", data.id);
      if (error) throw error;

      // Delete existing conditions
      const { error: delError } = await supabase
        .from("badge_conditions")
        .delete()
        .eq("achievement_id", data.id);
      if (delError) throw delError;

      // Insert new conditions
      if (data.conditions.length > 0) {
        const conditionsToInsert = data.conditions.map(c => ({
          achievement_id: data.id,
          activity_type: c.activity_type,
          required_count: c.required_count,
        }));
        const { error: condError } = await supabase
          .from("badge_conditions")
          .insert(conditionsToInsert);
        if (condError) throw condError;
      }
    },
    onSuccess: () => {
      toast({ title: "Sikeres", description: "Kitüntetés frissítve." });
      queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
      queryClient.invalidateQueries({ queryKey: ["badge_conditions"] });
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
      queryClient.invalidateQueries({ queryKey: ["badge_conditions"] });
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Hiba", description: error.message });
    },
  });

  const handleCreate = () => {
    setEditingAchievement({ 
      name: "", 
      description: "", 
      icon: "🏆", 
      points_required: 0,
      min_points_threshold: null,
      conditions: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (achievement: typeof achievements extends (infer T)[] ? T : never) => {
    const achievementConditions = badgeConditions?.filter(c => c.achievement_id === achievement.id) || [];
    setEditingAchievement({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      points_required: achievement.points_required,
      min_points_threshold: (achievement as any).min_points_threshold || null,
      conditions: achievementConditions,
    });
    setIsDialogOpen(true);
  };

  const handleClone = (achievement: typeof achievements extends (infer T)[] ? T : never) => {
    const achievementConditions = badgeConditions?.filter(c => c.achievement_id === achievement.id) || [];
    setEditingAchievement({
      name: `${achievement.name} (másolat)`,
      description: achievement.description,
      icon: achievement.icon,
      points_required: achievement.points_required,
      min_points_threshold: (achievement as any).min_points_threshold || null,
      conditions: achievementConditions.map(c => ({ ...c, id: undefined, achievement_id: "" })),
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

  const handleAddCondition = () => {
    if (!editingAchievement) return;
    const usedTypes = editingAchievement.conditions.map(c => c.activity_type);
    const availableType = ACTIVITY_TYPES.find(t => !usedTypes.includes(t));
    if (!availableType) {
      toast({ title: "Figyelem", description: "Minden tevékenységtípus már hozzá van adva." });
      return;
    }
    setEditingAchievement({
      ...editingAchievement,
      conditions: [
        ...editingAchievement.conditions,
        { achievement_id: editingAchievement.id || "", activity_type: availableType, required_count: 1 },
      ],
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (!editingAchievement) return;
    setEditingAchievement({
      ...editingAchievement,
      conditions: editingAchievement.conditions.filter((_, i) => i !== index),
    });
  };

  const handleConditionChange = (index: number, field: "activity_type" | "required_count", value: string | number) => {
    if (!editingAchievement) return;
    const updated = [...editingAchievement.conditions];
    if (field === "activity_type") {
      updated[index] = { ...updated[index], activity_type: value as ActivityType };
    } else {
      updated[index] = { ...updated[index], required_count: value as number };
    }
    setEditingAchievement({ ...editingAchievement, conditions: updated });
  };

  const getConditionsSummary = (achievementId: string): string => {
    const conditions = badgeConditions?.filter(c => c.achievement_id === achievementId) || [];
    if (conditions.length === 0) return "Csak pont alapú";
    return conditions.map(c => 
      `${ACTIVITY_TYPE_LABELS[c.activity_type]} ≥ ${c.required_count}`
    ).join(", ");
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
          <div id="table-achievements" className="border rounded-lg scroll-mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ikon</TableHead>
                  <TableHead>Név</TableHead>
                  <TableHead>Feloldási feltételek</TableHead>
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
                    <TableCell className="text-muted-foreground max-w-xs">
                      <div className="flex flex-col gap-1">
                        {achievement.points_required > 0 && (
                          <Badge variant="outline" className="w-fit">
                            ≥ {achievement.points_required} pont
                          </Badge>
                        )}
                        <span className="text-xs">{getConditionsSummary(achievement.id)}</span>
                      </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAchievement?.id ? "Kitüntetés szerkesztése" : "Új kitüntetés"}
            </DialogTitle>
            <DialogDescription>
              Add meg a kitüntetés adatait és feloldási feltételeit.
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
              <div className="grid grid-cols-3 gap-4">
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
                  <Label htmlFor="points">Szükséges pont (régi)</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    value={editingAchievement?.points_required || 0}
                    onChange={(e) => setEditingAchievement((prev) => prev ? { ...prev, points_required: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_points">Min. pontküszöb</Label>
                  <Input
                    id="min_points"
                    type="number"
                    min="0"
                    value={editingAchievement?.min_points_threshold || ""}
                    onChange={(e) => setEditingAchievement((prev) => prev ? { ...prev, min_points_threshold: e.target.value ? parseInt(e.target.value) : null } : null)}
                    placeholder="Opcionális"
                  />
                </div>
              </div>

              {/* Badge Conditions Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Feloldási feltételek
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ez a kitüntetés akkor oldódik fel, ha a felhasználó teljesíti az alábbi feltételeket.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCondition}>
                    <Plus className="h-4 w-4 mr-1" />
                    Feltétel
                  </Button>
                </div>

                {editingAchievement?.conditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">
                    Nincs tevékenység alapú feltétel. A kitüntetés csak pont alapján oldódik fel.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {editingAchievement?.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <Select
                          value={condition.activity_type}
                          onValueChange={(value) => handleConditionChange(index, "activity_type", value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {ACTIVITY_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">≥</span>
                        <Input
                          type="number"
                          min="1"
                          className="w-20"
                          value={condition.required_count}
                          onChange={(e) => handleConditionChange(index, "required_count", parseInt(e.target.value) || 1)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCondition(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
