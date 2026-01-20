import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X } from "lucide-react";

type ActivityType = 
  | "questionnaire_completion"
  | "lab_upload"
  | "discharge_upload"
  | "patient_summary_upload"
  | "observation_creation";

type RewardFrequency = "per_event" | "daily" | "once_total";

interface RewardRule {
  id: string;
  activity_type: ActivityType;
  points: number;
  frequency: RewardFrequency;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  questionnaire_completion: "Kérdőív kitöltése",
  lab_upload: "Laboreredmény feltöltése",
  discharge_upload: "Zárójelentés feltöltése",
  patient_summary_upload: "Betegösszefoglaló feltöltése",
  observation_creation: "Saját megfigyelés rögzítése",
};

const FREQUENCY_LABELS: Record<RewardFrequency, string> = {
  per_event: "Egyszer eseményenként",
  daily: "Naponta egyszer",
  once_total: "Egyszer összesen",
};

export default function AdminRewardRules() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);
  const [editForm, setEditForm] = useState({
    points: 0,
    frequency: "per_event" as RewardFrequency,
    is_active: true,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Nincs jogosultság",
        description: "Csak adminisztrátorok férhetnek hozzá ehhez az oldalhoz.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate, toast]);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("reward_rules")
        .select("*")
        .order("activity_type");

      if (error) throw error;
      setRules(data as RewardRule[]);
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a szabályokat.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule: RewardRule) => {
    setEditingRule(rule);
    setEditForm({
      points: rule.points,
      frequency: rule.frequency,
      is_active: rule.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingRule) return;

    try {
      const { error } = await supabase
        .from("reward_rules")
        .update({
          points: editForm.points,
          frequency: editForm.frequency,
          is_active: editForm.is_active,
        })
        .eq("id", editingRule.id);

      if (error) throw error;

      toast({
        title: "Mentve",
        description: "A szabály sikeresen módosítva.",
      });

      setEditingRule(null);
      fetchRules();
    } catch (error) {
      console.error("Error updating rule:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni a változtatásokat.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (rule: RewardRule) => {
    try {
      const { error } = await supabase
        .from("reward_rules")
        .update({ is_active: !rule.is_active })
        .eq("id", rule.id);

      if (error) throw error;

      toast({
        title: rule.is_active ? "Deaktiválva" : "Aktiválva",
        description: `${ACTIVITY_TYPE_LABELS[rule.activity_type]} ${rule.is_active ? "deaktiválva" : "aktiválva"}.`,
      });

      fetchRules();
    } catch (error) {
      console.error("Error toggling rule:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült módosítani az állapotot.",
        variant: "destructive",
      });
    }
  };

  if (adminLoading || loading) {
    return (
      <AdminLayout title="Pontszabályok">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Betöltés...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout title="Pontszabályok">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pontszabályok</h1>
          <p className="text-muted-foreground">
            Tevékenység alapú jutalmazási szabályok kezelése
          </p>
        </div>

        <div id="table-reward-rules" className="rounded-md border scroll-mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tevékenység típusa</TableHead>
                <TableHead className="text-center">Pont érték</TableHead>
                <TableHead>Gyakoriság</TableHead>
                <TableHead className="text-center">Aktív</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {ACTIVITY_TYPE_LABELS[rule.activity_type]}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-primary">+{rule.points}</span>
                  </TableCell>
                  <TableCell>{FREQUENCY_LABELS[rule.frequency]}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Szerkesztés
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Szabály szerkesztése
              </DialogTitle>
            </DialogHeader>
            {editingRule && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Tevékenység típusa</Label>
                  <Input
                    value={ACTIVITY_TYPE_LABELS[editingRule.activity_type]}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">Pont érték</Label>
                  <Input
                    id="points"
                    type="number"
                    min={1}
                    max={1000}
                    value={editForm.points}
                    onChange={(e) =>
                      setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Jutalmazás gyakorisága</Label>
                  <Select
                    value={editForm.frequency}
                    onValueChange={(value: RewardFrequency) =>
                      setEditForm({ ...editForm, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_event">Egyszer eseményenként</SelectItem>
                      <SelectItem value="daily">Naponta egyszer</SelectItem>
                      <SelectItem value="once_total">Egyszer összesen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={editForm.is_active}
                    onCheckedChange={(checked) =>
                      setEditForm({ ...editForm, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Aktív</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingRule(null)}>
                    <X className="h-4 w-4 mr-1" />
                    Mégse
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Mentés
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
