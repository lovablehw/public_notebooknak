import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminRole } from "@/hooks/useAdminRole";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, Plus, Trash2, Target, Trophy, AlertTriangle, Flame } from "lucide-react";

interface ChallengeType {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  required_observation_types: string[];
  default_mode: string;
  show_daily_counter: boolean;
  show_streak_counter: boolean;
  show_health_risks: boolean;
  is_active: boolean;
  created_at: string;
}

interface ChallengeMilestone {
  id: string;
  challenge_type_id: string;
  name: string;
  description: string;
  icon: string;
  days_required: number | null;
  target_value: number | null;
  points_awarded: number;
  display_order: number;
  is_active: boolean;
}

interface ChallengeHealthRisk {
  id: string;
  challenge_type_id: string;
  name: string;
  icon: string;
  fade_start_days: number;
  fade_end_days: number;
  display_order: number;
  is_active: boolean;
}

const OBSERVATION_TYPE_LABELS: Record<string, string> = {
  cigarette_count: "Napi cigaretta",
  craving_level: "Sóvárgás mértéke",
  weight: "Súly (kg)",
  mood: "Hangulat",
  energy: "Energiaszint",
  sleep: "Alvásminőség",
  note: "Megjegyzés",
};

const MODE_LABELS: Record<string, string> = {
  tracking: "Követés",
  reduction: "Csökkentés",
  quitting: "Leszokás",
  maintenance: "Fenntartás",
};

export default function AdminChallenges() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isServiceAdmin } = useAdminRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("types");
  const [challengeTypes, setChallengeTypes] = useState<ChallengeType[]>([]);
  const [milestones, setMilestones] = useState<ChallengeMilestone[]>([]);
  const [healthRisks, setHealthRisks] = useState<ChallengeHealthRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallengeType, setSelectedChallengeType] = useState<string | null>(null);

  // Edit states
  const [editingMilestone, setEditingMilestone] = useState<ChallengeMilestone | null>(null);
  const [editingRisk, setEditingRisk] = useState<ChallengeHealthRisk | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    description: "",
    icon: "Award",
    days_required: 0,
    points_awarded: 0,
    display_order: 0,
  });
  const [riskForm, setRiskForm] = useState({
    name: "",
    icon: "AlertTriangle",
    fade_start_days: 1,
    fade_end_days: 365,
    display_order: 0,
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, milestonesRes, risksRes] = await Promise.all([
        supabase.from("challenge_types").select("*").order("name"),
        supabase.from("challenge_milestones").select("*").order("display_order"),
        supabase.from("challenge_health_risks").select("*").order("display_order"),
      ]);

      if (typesRes.error) throw typesRes.error;
      if (milestonesRes.error) throw milestonesRes.error;
      if (risksRes.error) throw risksRes.error;

      setChallengeTypes(typesRes.data as ChallengeType[]);
      setMilestones(milestonesRes.data as ChallengeMilestone[]);
      setHealthRisks(risksRes.data as ChallengeHealthRisk[]);

      if (typesRes.data && typesRes.data.length > 0 && !selectedChallengeType) {
        setSelectedChallengeType(typesRes.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching challenge data:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az adatokat.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChallengeType = async (ct: ChallengeType) => {
    if (!isServiceAdmin) {
      toast({ title: "Nincs jogosultság", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("challenge_types")
        .update({ is_active: !ct.is_active })
        .eq("id", ct.id);

      if (error) throw error;
      toast({ title: ct.is_active ? "Deaktiválva" : "Aktiválva" });
      fetchData();
    } catch (error) {
      console.error("Error toggling challenge type:", error);
      toast({ title: "Hiba", variant: "destructive" });
    }
  };

  // Milestone handlers
  const handleEditMilestone = (milestone: ChallengeMilestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      name: milestone.name,
      description: milestone.description,
      icon: milestone.icon,
      days_required: milestone.days_required || 0,
      points_awarded: milestone.points_awarded,
      display_order: milestone.display_order,
    });
  };

  const handleSaveMilestone = async () => {
    if (!editingMilestone || !isServiceAdmin) return;

    try {
      const { error } = await supabase
        .from("challenge_milestones")
        .update({
          name: milestoneForm.name,
          description: milestoneForm.description,
          icon: milestoneForm.icon,
          days_required: milestoneForm.days_required || null,
          points_awarded: milestoneForm.points_awarded,
          display_order: milestoneForm.display_order,
        })
        .eq("id", editingMilestone.id);

      if (error) throw error;
      toast({ title: "Mentve" });
      setEditingMilestone(null);
      fetchData();
    } catch (error) {
      console.error("Error saving milestone:", error);
      toast({ title: "Hiba", variant: "destructive" });
    }
  };

  const handleAddMilestone = async () => {
    if (!selectedChallengeType || !isServiceAdmin) return;

    try {
      const { error } = await supabase.from("challenge_milestones").insert({
        challenge_type_id: selectedChallengeType,
        name: "Új mérföldkő",
        description: "Mérföldkő leírása",
        icon: "Award",
        days_required: 7,
        points_awarded: 50,
        display_order: milestones.filter(m => m.challenge_type_id === selectedChallengeType).length + 1,
      });

      if (error) throw error;
      toast({ title: "Létrehozva" });
      fetchData();
    } catch (error) {
      console.error("Error adding milestone:", error);
      toast({ title: "Hiba", variant: "destructive" });
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!isServiceAdmin) return;

    try {
      const { error } = await supabase.from("challenge_milestones").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Törölve" });
      fetchData();
    } catch (error) {
      console.error("Error deleting milestone:", error);
      toast({ title: "Hiba", variant: "destructive" });
    }
  };

  // Health risk handlers
  const handleEditRisk = (risk: ChallengeHealthRisk) => {
    setEditingRisk(risk);
    setRiskForm({
      name: risk.name,
      icon: risk.icon,
      fade_start_days: risk.fade_start_days,
      fade_end_days: risk.fade_end_days,
      display_order: risk.display_order,
    });
  };

  const handleSaveRisk = async () => {
    if (!editingRisk || !isServiceAdmin) return;

    try {
      const { error } = await supabase
        .from("challenge_health_risks")
        .update({
          name: riskForm.name,
          icon: riskForm.icon,
          fade_start_days: riskForm.fade_start_days,
          fade_end_days: riskForm.fade_end_days,
          display_order: riskForm.display_order,
        })
        .eq("id", editingRisk.id);

      if (error) throw error;
      toast({ title: "Mentve" });
      setEditingRisk(null);
      fetchData();
    } catch (error) {
      console.error("Error saving risk:", error);
      toast({ title: "Hiba", variant: "destructive" });
    }
  };

  const handleAddRisk = async () => {
    if (!selectedChallengeType || !isServiceAdmin) return;

    try {
      const { error } = await supabase.from("challenge_health_risks").insert({
        challenge_type_id: selectedChallengeType,
        name: "Új kockázat",
        icon: "AlertTriangle",
        fade_start_days: 30,
        fade_end_days: 365,
        display_order: healthRisks.filter(r => r.challenge_type_id === selectedChallengeType).length + 1,
      });

      if (error) throw error;
      toast({ title: "Létrehozva" });
      fetchData();
    } catch (error) {
      console.error("Error adding risk:", error);
      toast({ title: "Hiba", variant: "destructive" });
    }
  };

  const handleDeleteRisk = async (id: string) => {
    if (!isServiceAdmin) return;

    try {
      const { error } = await supabase.from("challenge_health_risks").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Törölve" });
      fetchData();
    } catch (error) {
      console.error("Error deleting risk:", error);
      toast({ title: "Hiba", variant: "destructive" });
    }
  };

  if (adminLoading || loading) {
    return (
      <AdminLayout title="Kihívások">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Betöltés...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  const selectedType = challengeTypes.find(ct => ct.id === selectedChallengeType);
  const filteredMilestones = milestones.filter(m => m.challenge_type_id === selectedChallengeType);
  const filteredRisks = healthRisks.filter(r => r.challenge_type_id === selectedChallengeType);

  return (
    <AdminLayout title="Kihívások">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            Kihívások kezelése
          </h1>
          <p className="text-muted-foreground">
            Kihívás típusok, mérföldkövek és egészségügyi kockázatok konfigurálása
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="types" className="gap-1">
              <Target className="h-4 w-4" />
              Típusok
            </TabsTrigger>
            <TabsTrigger value="milestones" className="gap-1">
              <Trophy className="h-4 w-4" />
              Mérföldkövek
            </TabsTrigger>
            <TabsTrigger value="risks" className="gap-1">
              <AlertTriangle className="h-4 w-4" />
              Kockázatok
            </TabsTrigger>
          </TabsList>

          {/* Challenge Types Tab */}
          <TabsContent value="types" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Név</TableHead>
                    <TableHead>Megfigyelés típusok</TableHead>
                    <TableHead>Alapértelmezett mód</TableHead>
                    <TableHead className="text-center">Aktív</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challengeTypes.map((ct) => (
                    <TableRow key={ct.id}>
                      <TableCell className="font-medium">{ct.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {ct.required_observation_types.map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {OBSERVATION_TYPE_LABELS[type] || type}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{MODE_LABELS[ct.default_mode] || ct.default_mode}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={ct.is_active}
                          onCheckedChange={() => handleToggleChallengeType(ct)}
                          disabled={!isServiceAdmin}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            {/* Challenge type selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Kihívás típus kiválasztása</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {challengeTypes.map((ct) => (
                    <Button
                      key={ct.id}
                      variant={selectedChallengeType === ct.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedChallengeType(ct.id)}
                    >
                      {ct.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedType && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{selectedType.name} - Mérföldkövek</h3>
                  {isServiceAdmin && (
                    <Button size="sm" onClick={handleAddMilestone}>
                      <Plus className="h-4 w-4 mr-1" />
                      Új mérföldkő
                    </Button>
                  )}
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Név</TableHead>
                        <TableHead>Leírás</TableHead>
                        <TableHead className="text-center">Napok</TableHead>
                        <TableHead className="text-center">Pontok</TableHead>
                        <TableHead className="text-right">Műveletek</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMilestones.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{m.description}</TableCell>
                          <TableCell className="text-center">{m.days_required || "–"}</TableCell>
                          <TableCell className="text-center text-primary">+{m.points_awarded}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditMilestone(m)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {isServiceAdmin && (
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMilestone(m.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredMilestones.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Nincsenek mérföldkövek
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>

          {/* Health Risks Tab */}
          <TabsContent value="risks" className="space-y-4">
            {/* Challenge type selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Kihívás típus kiválasztása</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {challengeTypes.map((ct) => (
                    <Button
                      key={ct.id}
                      variant={selectedChallengeType === ct.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedChallengeType(ct.id)}
                    >
                      {ct.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedType && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{selectedType.name} - Egészségügyi kockázatok</h3>
                  {isServiceAdmin && (
                    <Button size="sm" onClick={handleAddRisk}>
                      <Plus className="h-4 w-4 mr-1" />
                      Új kockázat
                    </Button>
                  )}
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Név</TableHead>
                        <TableHead className="text-center">Csökkenés kezdete</TableHead>
                        <TableHead className="text-center">Csökkenés vége</TableHead>
                        <TableHead className="text-right">Műveletek</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRisks.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-center">{r.fade_start_days} nap</TableCell>
                          <TableCell className="text-center">{r.fade_end_days} nap</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditRisk(r)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {isServiceAdmin && (
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteRisk(r.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRisks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nincsenek egészségügyi kockázatok
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Milestone Dialog */}
        <Dialog open={!!editingMilestone} onOpenChange={() => setEditingMilestone(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mérföldkő szerkesztése</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-name">Név</Label>
                <Input
                  id="milestone-name"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-desc">Leírás (biológiai változás)</Label>
                <Textarea
                  id="milestone-desc"
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="milestone-days">Szükséges napok</Label>
                  <Input
                    id="milestone-days"
                    type="number"
                    min={0}
                    value={milestoneForm.days_required}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, days_required: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milestone-points">Pont érték</Label>
                  <Input
                    id="milestone-points"
                    type="number"
                    min={0}
                    value={milestoneForm.points_awarded}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, points_awarded: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingMilestone(null)}>
                  <X className="h-4 w-4 mr-1" />
                  Mégse
                </Button>
                <Button onClick={handleSaveMilestone}>
                  <Save className="h-4 w-4 mr-1" />
                  Mentés
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Risk Dialog */}
        <Dialog open={!!editingRisk} onOpenChange={() => setEditingRisk(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kockázat szerkesztése</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="risk-name">Név</Label>
                <Input
                  id="risk-name"
                  value={riskForm.name}
                  onChange={(e) => setRiskForm({ ...riskForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="risk-start">Csökkenés kezdete (nap)</Label>
                  <Input
                    id="risk-start"
                    type="number"
                    min={1}
                    value={riskForm.fade_start_days}
                    onChange={(e) => setRiskForm({ ...riskForm, fade_start_days: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk-end">Csökkenés vége (nap)</Label>
                  <Input
                    id="risk-end"
                    type="number"
                    min={1}
                    value={riskForm.fade_end_days}
                    onChange={(e) => setRiskForm({ ...riskForm, fade_end_days: parseInt(e.target.value) || 365 })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingRisk(null)}>
                  <X className="h-4 w-4 mr-1" />
                  Mégse
                </Button>
                <Button onClick={handleSaveRisk}>
                  <Save className="h-4 w-4 mr-1" />
                  Mentés
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
