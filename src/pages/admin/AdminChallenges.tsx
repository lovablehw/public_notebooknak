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
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, Plus, Trash2, Target, Trophy, AlertTriangle, Flame, Award, HeartPulse, Wind, Activity, Skull, ListChecks } from "lucide-react";

interface ObservationCategory {
  key: string;
  label: string;
  is_active: boolean;
  input_type: "number" | "text" | "select";
  options?: string[];
}

interface ChallengeType {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  required_observation_types: string[];
  observation_categories: ObservationCategory[] | null;
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
  resisted_lighting: "Ellenállás rögzítés",
};

const OBSERVATION_TYPES = [
  { value: "cigarette_count", label: "Napi cigaretta" },
  { value: "craving_level", label: "Sóvárgás mértéke" },
  { value: "weight", label: "Súly (kg)" },
  { value: "mood", label: "Hangulat" },
  { value: "energy", label: "Energiaszint" },
  { value: "sleep", label: "Alvásminőség" },
  { value: "note", label: "Megjegyzés" },
  { value: "resisted_lighting", label: "Ellenállás rögzítés" },
];

const MODE_LABELS: Record<string, string> = {
  tracking: "Követés",
  reduction: "Csökkentés",
  quitting: "Leszokás",
  maintenance: "Fenntartás",
};

const ICON_OPTIONS = [
  { value: "Award", label: "Díj", icon: Award },
  { value: "Trophy", label: "Trófea", icon: Trophy },
  { value: "Target", label: "Célpont", icon: Target },
  { value: "Flame", label: "Láng", icon: Flame },
  { value: "HeartPulse", label: "Szív", icon: HeartPulse },
  { value: "Wind", label: "Tüdő", icon: Wind },
  { value: "AlertTriangle", label: "Figyelmeztetés", icon: AlertTriangle },
  { value: "Activity", label: "Aktivitás", icon: Activity },
  { value: "Skull", label: "Koponya", icon: Skull },
];

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

  // Create new challenge type
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [newChallengeForm, setNewChallengeForm] = useState({
    name: "",
    description: "",
    icon: "Flame",
    required_observation_types: [] as string[],
    default_mode: "tracking",
    show_daily_counter: true,
    show_streak_counter: true,
    show_health_risks: false,
  });

  // Edit states
  const [editingType, setEditingType] = useState<ChallengeType | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<ChallengeMilestone | null>(null);
  const [editingRisk, setEditingRisk] = useState<ChallengeHealthRisk | null>(null);
  
  const [typeForm, setTypeForm] = useState({
    name: "",
    description: "",
    icon: "Flame",
    required_observation_types: [] as string[],
    default_mode: "tracking",
    show_daily_counter: true,
    show_streak_counter: true,
    show_health_risks: false,
  });

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
    description: "",
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

      // Parse observation_categories from JSON
      const parsedTypes = (typesRes.data || []).map(ct => ({
        ...ct,
        observation_categories: Array.isArray(ct.observation_categories) 
          ? ct.observation_categories as unknown as ObservationCategory[]
          : null
      }));
      
      setChallengeTypes(parsedTypes as ChallengeType[]);
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

  // Challenge type handlers
  const handleCreateChallenge = async () => {
    if (!isServiceAdmin || !newChallengeForm.name.trim()) {
      toast({ title: "Hiányzó adatok", description: "Add meg a kihívás nevét!", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("challenge_types").insert({
        name: newChallengeForm.name,
        description: newChallengeForm.description || null,
        icon: newChallengeForm.icon,
        required_observation_types: newChallengeForm.required_observation_types,
        default_mode: newChallengeForm.default_mode as "tracking" | "reduction" | "quitting" | "maintenance",
        show_daily_counter: newChallengeForm.show_daily_counter,
        show_streak_counter: newChallengeForm.show_streak_counter,
        show_health_risks: newChallengeForm.show_health_risks,
        is_active: true,
      });

      if (error) throw error;
      
      toast({ title: "Létrehozva", description: "Az új kihívás típus sikeresen létrejött." });
      setShowCreateChallenge(false);
      setNewChallengeForm({
        name: "",
        description: "",
        icon: "Flame",
        required_observation_types: [],
        default_mode: "tracking",
        show_daily_counter: true,
        show_streak_counter: true,
        show_health_risks: false,
      });
      fetchData();
    } catch (error) {
      console.error("Error creating challenge type:", error);
      toast({ title: "Hiba", description: "Nem sikerült létrehozni a kihívást.", variant: "destructive" });
    }
  };

  const handleEditType = (ct: ChallengeType) => {
    setEditingType(ct);
    setTypeForm({
      name: ct.name,
      description: ct.description || "",
      icon: ct.icon,
      required_observation_types: ct.required_observation_types,
      default_mode: ct.default_mode,
      show_daily_counter: ct.show_daily_counter,
      show_streak_counter: ct.show_streak_counter,
      show_health_risks: ct.show_health_risks,
    });
  };

  const handleSaveType = async () => {
    if (!editingType || !isServiceAdmin) return;

    try {
      const { error } = await supabase
        .from("challenge_types")
        .update({
          name: typeForm.name,
          description: typeForm.description || null,
          icon: typeForm.icon,
          required_observation_types: typeForm.required_observation_types as string[],
          default_mode: typeForm.default_mode as "tracking" | "reduction" | "quitting" | "maintenance",
          show_daily_counter: typeForm.show_daily_counter,
          show_streak_counter: typeForm.show_streak_counter,
          show_health_risks: typeForm.show_health_risks,
        })
        .eq("id", editingType.id);

      if (error) throw error;
      toast({ title: "Mentve" });
      setEditingType(null);
      fetchData();
    } catch (error) {
      console.error("Error saving challenge type:", error);
      toast({ title: "Hiba", variant: "destructive" });
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

  const handleDeleteType = async (id: string) => {
    if (!isServiceAdmin) return;

    try {
      const { error } = await supabase.from("challenge_types").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Törölve" });
      if (selectedChallengeType === id) {
        setSelectedChallengeType(null);
      }
      fetchData();
    } catch (error) {
      console.error("Error deleting challenge type:", error);
      toast({ title: "Hiba", description: "Lehet, hogy tartoznak hozzá mérföldkövek vagy kockázatok.", variant: "destructive" });
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
        description: "Biológiai változás leírása ide kerül",
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
      description: "",
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              Kihívások kezelése
            </h1>
            <p className="text-muted-foreground">
              Kihívás típusok, mérföldkövek és egészségügyi kockázatok konfigurálása
            </p>
          </div>
          {isServiceAdmin && (
            <Button onClick={() => setShowCreateChallenge(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Új kihívás
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="types" className="gap-1">
              <Target className="h-4 w-4" />
              Típusok
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1">
              <ListChecks className="h-4 w-4" />
              Megfigyelés kategóriák
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
                    <TableHead className="text-center">Kockázatok</TableHead>
                    <TableHead className="text-center">Aktív</TableHead>
                    <TableHead className="text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challengeTypes.map((ct) => (
                    <TableRow key={ct.id}>
                      <TableCell className="font-medium">
                        <div>
                          {ct.name}
                          {ct.description && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                              {ct.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
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
                        {ct.show_health_risks ? (
                          <Badge variant="default" className="text-xs">Igen</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Nem</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={ct.is_active}
                          onCheckedChange={() => handleToggleChallengeType(ct)}
                          disabled={!isServiceAdmin}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditType(ct)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isServiceAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteType(ct.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {challengeTypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nincsenek kihívás típusok. Hozz létre egyet az "Új kihívás" gombbal!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Observation Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            {/* Challenge type selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Kihívás típus kiválasztása</CardTitle>
                <CardDescription>Konfiguráld a megfigyelés kategóriákat (aktiválás, átnevezés) minden kihíváshoz</CardDescription>
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
                  <div>
                    <h3 className="font-medium">{selectedType.name} - Megfigyelés kategóriák</h3>
                    <p className="text-sm text-muted-foreground">Aktiváld/deaktiváld és nevezd át a kategóriákat, amelyeket a felhasználók rögzíthetnek</p>
                  </div>
                  {isServiceAdmin && (
                    <Button 
                      size="sm" 
                      onClick={async () => {
                        // Initialize observation_categories if empty
                        const defaultCategories: ObservationCategory[] = OBSERVATION_TYPES.map(type => ({
                          key: type.value,
                          label: type.label,
                          is_active: selectedType.required_observation_types.includes(type.value),
                          input_type: ["cigarette_count", "craving_level", "weight", "energy", "sleep"].includes(type.value) ? "number" : "text",
                        }));
                        
                        try {
                          const { error } = await supabase
                            .from("challenge_types")
                            .update({ observation_categories: JSON.parse(JSON.stringify(defaultCategories)) })
                            .eq("id", selectedType.id);
                          
                          if (error) throw error;
                          toast({ title: "Kategóriák inicializálva" });
                          fetchData();
                        } catch (error) {
                          console.error("Error initializing categories:", error);
                          toast({ title: "Hiba", variant: "destructive" });
                        }
                      }}
                      disabled={selectedType.observation_categories && selectedType.observation_categories.length > 0}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Kategóriák inicializálása
                    </Button>
                  )}
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kulcs</TableHead>
                        <TableHead>Megjelenített név</TableHead>
                        <TableHead>Típus</TableHead>
                        <TableHead className="text-center">Aktív</TableHead>
                        <TableHead className="text-right">Műveletek</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedType.observation_categories && selectedType.observation_categories.length > 0 ? (
                        selectedType.observation_categories.map((cat) => (
                          <TableRow key={cat.key}>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono text-xs">
                                {cat.key}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{cat.label}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {cat.input_type === "number" ? "Szám" : cat.input_type === "select" ? "Választó" : "Szöveg"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={cat.is_active}
                                onCheckedChange={async (checked) => {
                                  if (!isServiceAdmin) return;
                                  
                                  const updatedCategories = selectedType.observation_categories!.map(c => 
                                    c.key === cat.key ? { ...c, is_active: checked } : c
                                  );
                                  
                                  try {
                                    const { error } = await supabase
                                      .from("challenge_types")
                                      .update({ observation_categories: JSON.parse(JSON.stringify(updatedCategories)) })
                                      .eq("id", selectedType.id);
                                    
                                    if (error) throw error;
                                    toast({ title: checked ? "Aktiválva" : "Deaktiválva" });
                                    fetchData();
                                  } catch (error) {
                                    console.error("Error toggling category:", error);
                                    toast({ title: "Hiba", variant: "destructive" });
                                  }
                                }}
                                disabled={!isServiceAdmin}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const newLabel = prompt("Új megjelenített név:", cat.label);
                                  if (newLabel && newLabel.trim() && newLabel !== cat.label) {
                                    const updatedCategories = selectedType.observation_categories!.map(c => 
                                      c.key === cat.key ? { ...c, label: newLabel.trim() } : c
                                    );
                                    
                                    supabase
                                      .from("challenge_types")
                                      .update({ observation_categories: JSON.parse(JSON.stringify(updatedCategories)) })
                                      .eq("id", selectedType.id)
                                      .then(({ error }) => {
                                        if (error) {
                                          toast({ title: "Hiba", variant: "destructive" });
                                        } else {
                                          toast({ title: "Átnevezve" });
                                          fetchData();
                                        }
                                      });
                                  }
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Még nincsenek kategóriák konfigurálva. Kattints a "Kategóriák inicializálása" gombra!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Info about required observation types */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Kötelező megfigyelés típusok</CardTitle>
                    <CardDescription>
                      Ezek a típusok a kihívás "required_observation_types" mezőjéből jönnek. A kategóriák csak a megjelenített nevet és aktivitást befolyásolják.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedType.required_observation_types.map((type) => (
                        <Badge key={type} variant="default">
                          {OBSERVATION_TYPE_LABELS[type] || type}
                        </Badge>
                      ))}
                      {selectedType.required_observation_types.length === 0 && (
                        <span className="text-sm text-muted-foreground">Nincs kötelező típus beállítva</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            {/* Challenge type selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Kihívás típus kiválasztása</CardTitle>
                <CardDescription>A mérföldkövek (jutalmak) mindig egy konkrét kihíváshoz tartoznak</CardDescription>
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
                  <div>
                    <h3 className="font-medium">{selectedType.name} - Mérföldkövek (Jutalmak)</h3>
                    <p className="text-sm text-muted-foreground">Adj hozzá biológiai változásokat és jutalmakat minden mérföldkőhöz</p>
                  </div>
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
                        <TableHead>Név (Badge)</TableHead>
                        <TableHead>Biológiai változás leírása</TableHead>
                        <TableHead className="text-center">Napok</TableHead>
                        <TableHead className="text-center">Pontok</TableHead>
                        <TableHead className="text-right">Műveletek</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMilestones.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const iconOption = ICON_OPTIONS.find(i => i.value === m.icon);
                                const IconComponent = iconOption?.icon || Award;
                                return <IconComponent className="h-4 w-4 text-primary" />;
                              })()}
                              {m.name}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-sm text-muted-foreground">{m.description}</span>
                          </TableCell>
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
                            Nincsenek mérföldkövek. Adj hozzá az "Új mérföldkő" gombbal!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Quick add common milestones */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Gyors hozzáadás</CardTitle>
                    <CardDescription>Tipikus mérföldkövek hozzáadása egy kattintással</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { days: 7, name: "1 hét", desc: "Vérnyomás normalizálódni kezd" },
                        { days: 14, name: "2 hét", desc: "Tüdőkapacitás javul" },
                        { days: 21, name: "21 nap", desc: "Szaglás és ízérzés helyreáll" },
                        { days: 30, name: "1 hónap", desc: "Köhögés jelentősen csökken" },
                        { days: 90, name: "3 hónap", desc: "Légzési funkció 30%-kal javul" },
                        { days: 365, name: "1 év", desc: "Szívroham kockázat felére csökken" },
                      ].map((preset) => (
                        <Button
                          key={preset.days}
                          variant="outline"
                          size="sm"
                          disabled={!isServiceAdmin || filteredMilestones.some(m => m.days_required === preset.days)}
                          onClick={async () => {
                            try {
                              await supabase.from("challenge_milestones").insert({
                                challenge_type_id: selectedChallengeType,
                                name: preset.name,
                                description: preset.desc,
                                icon: "Award",
                                days_required: preset.days,
                                points_awarded: preset.days >= 365 ? 500 : preset.days >= 30 ? 200 : preset.days >= 21 ? 100 : 50,
                                display_order: filteredMilestones.length + 1,
                              });
                              toast({ title: `${preset.name} hozzáadva` });
                              fetchData();
                            } catch (error) {
                              toast({ title: "Hiba", variant: "destructive" });
                            }
                          }}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Health Risks Tab */}
          <TabsContent value="risks" className="space-y-4">
            {/* Challenge type selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Kihívás típus kiválasztása</CardTitle>
                <CardDescription>Konfiguráld a betegség kockázatokat és azok csökkenési időtartamát</CardDescription>
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
                  <div>
                    <h3 className="font-medium">{selectedType.name} - Egészségügyi kockázatok</h3>
                    <p className="text-sm text-muted-foreground">Add meg a betegségeket és a "fade" időtartamot (hány nap alatt csökken a kockázat)</p>
                  </div>
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
                        <TableHead>Betegség / Kockázat</TableHead>
                        <TableHead className="text-center">Fade kezdete (nap)</TableHead>
                        <TableHead className="text-center">Fade vége (nap)</TableHead>
                        <TableHead className="text-right">Műveletek</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRisks.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const iconOption = ICON_OPTIONS.find(i => i.value === r.icon);
                                const IconComponent = iconOption?.icon || AlertTriangle;
                                return <IconComponent className="h-4 w-4 text-destructive" />;
                              })()}
                              {r.name}
                            </div>
                          </TableCell>
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
                            Nincsenek egészségügyi kockázatok. Adj hozzá az "Új kockázat" gombbal!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Quick add common risks */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Gyors hozzáadás</CardTitle>
                    <CardDescription>Tipikus egészségügyi kockázatok hozzáadása (dohányzáshoz)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: "COPD", icon: "Wind", fadeStart: 14, fadeEnd: 3650 },
                        { name: "Tüdőrák", icon: "Skull", fadeStart: 365, fadeEnd: 3650 },
                        { name: "Szív-érrendszeri", icon: "HeartPulse", fadeStart: 1, fadeEnd: 365 },
                        { name: "Stroke", icon: "Activity", fadeStart: 30, fadeEnd: 1825 },
                      ].map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          disabled={!isServiceAdmin || filteredRisks.some(r => r.name === preset.name)}
                          onClick={async () => {
                            try {
                              await supabase.from("challenge_health_risks").insert({
                                challenge_type_id: selectedChallengeType,
                                name: preset.name,
                                icon: preset.icon,
                                fade_start_days: preset.fadeStart,
                                fade_end_days: preset.fadeEnd,
                                display_order: filteredRisks.length + 1,
                              });
                              toast({ title: `${preset.name} hozzáadva` });
                              fetchData();
                            } catch (error) {
                              toast({ title: "Hiba", variant: "destructive" });
                            }
                          }}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Challenge Dialog */}
        <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Új kihívás létrehozása</DialogTitle>
              <DialogDescription>Hozz létre egy új kihívás típust, amelyhez mérföldköveket és kockázatokat adhatsz</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="new-challenge-name">Név *</Label>
                <Input
                  id="new-challenge-name"
                  value={newChallengeForm.name}
                  onChange={(e) => setNewChallengeForm({ ...newChallengeForm, name: e.target.value })}
                  placeholder="pl. Dohányzás leszokás"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-challenge-desc">Leírás</Label>
                <Textarea
                  id="new-challenge-desc"
                  value={newChallengeForm.description}
                  onChange={(e) => setNewChallengeForm({ ...newChallengeForm, description: e.target.value })}
                  placeholder="A kihívás rövid leírása..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Szükséges megfigyelés típusok</Label>
                <div className="grid grid-cols-2 gap-2">
                  {OBSERVATION_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`new-obs-${type.value}`}
                        checked={newChallengeForm.required_observation_types.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewChallengeForm({
                              ...newChallengeForm,
                              required_observation_types: [...newChallengeForm.required_observation_types, type.value],
                            });
                          } else {
                            setNewChallengeForm({
                              ...newChallengeForm,
                              required_observation_types: newChallengeForm.required_observation_types.filter(t => t !== type.value),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`new-obs-${type.value}`} className="text-sm cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alapértelmezett mód</Label>
                  <Select
                    value={newChallengeForm.default_mode}
                    onValueChange={(value) => setNewChallengeForm({ ...newChallengeForm, default_mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tracking">Követés</SelectItem>
                      <SelectItem value="reduction">Csökkentés</SelectItem>
                      <SelectItem value="quitting">Leszokás</SelectItem>
                      <SelectItem value="maintenance">Fenntartás</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ikon</Label>
                  <Select
                    value={newChallengeForm.icon}
                    onValueChange={(value) => setNewChallengeForm({ ...newChallengeForm, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="new-show-risks"
                    checked={newChallengeForm.show_health_risks}
                    onCheckedChange={(checked) => setNewChallengeForm({ ...newChallengeForm, show_health_risks: checked })}
                  />
                  <Label htmlFor="new-show-risks">Egészségügyi kockázatok megjelenítése</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="new-show-streak"
                    checked={newChallengeForm.show_streak_counter}
                    onCheckedChange={(checked) => setNewChallengeForm({ ...newChallengeForm, show_streak_counter: checked })}
                  />
                  <Label htmlFor="new-show-streak">Sorozat számláló megjelenítése</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateChallenge(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Mégse
                </Button>
                <Button onClick={handleCreateChallenge}>
                  <Save className="h-4 w-4 mr-1" />
                  Létrehozás
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Challenge Type Dialog */}
        <Dialog open={!!editingType} onOpenChange={() => setEditingType(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Kihívás típus szerkesztése</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type-name">Név</Label>
                <Input
                  id="edit-type-name"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type-desc">Leírás</Label>
                <Textarea
                  id="edit-type-desc"
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Szükséges megfigyelés típusok</Label>
                <div className="grid grid-cols-2 gap-2">
                  {OBSERVATION_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-obs-${type.value}`}
                        checked={typeForm.required_observation_types.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTypeForm({
                              ...typeForm,
                              required_observation_types: [...typeForm.required_observation_types, type.value],
                            });
                          } else {
                            setTypeForm({
                              ...typeForm,
                              required_observation_types: typeForm.required_observation_types.filter(t => t !== type.value),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`edit-obs-${type.value}`} className="text-sm cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-show-risks"
                    checked={typeForm.show_health_risks}
                    onCheckedChange={(checked) => setTypeForm({ ...typeForm, show_health_risks: checked })}
                  />
                  <Label htmlFor="edit-show-risks">Egészségügyi kockázatok megjelenítése</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingType(null)}>
                  <X className="h-4 w-4 mr-1" />
                  Mégse
                </Button>
                <Button onClick={handleSaveType}>
                  <Save className="h-4 w-4 mr-1" />
                  Mentés
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Milestone Dialog */}
        <Dialog open={!!editingMilestone} onOpenChange={() => setEditingMilestone(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mérföldkő (Jutalom) szerkesztése</DialogTitle>
              <DialogDescription>Add meg a badge nevet és a biológiai változás leírását</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-name">Badge név</Label>
                <Input
                  id="milestone-name"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  placeholder="pl. 1 hét, 21 nap, 1 év"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-desc">Biológiai változás leírása (Life-science)</Label>
                <Textarea
                  id="milestone-desc"
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  placeholder="pl. A szaglás és ízérzés helyreáll"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Ikon</Label>
                <Select
                  value={milestoneForm.icon}
                  onValueChange={(value) => setMilestoneForm({ ...milestoneForm, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <DialogDescription>Konfiguráld a betegség nevét és az elhalványulás időtartamot</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="risk-name">Betegség / Kockázat neve</Label>
                <Input
                  id="risk-name"
                  value={riskForm.name}
                  onChange={(e) => setRiskForm({ ...riskForm, name: e.target.value })}
                  placeholder="pl. COPD, Tüdőrák, Szív-érrendszeri"
                />
              </div>
              <div className="space-y-2">
                <Label>Ikon</Label>
                <Select
                  value={riskForm.icon}
                  onValueChange={(value) => setRiskForm({ ...riskForm, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="risk-start">Elhalványulás kezdete</Label>
                  <Input
                    id="risk-start"
                    type="number"
                    min={1}
                    value={riskForm.fade_start_days}
                    onChange={(e) => setRiskForm({ ...riskForm, fade_start_days: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-muted-foreground">Ennyi nap után kezd csökkenni a kockázat</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk-end">Elhalványulás vége</Label>
                  <Input
                    id="risk-end"
                    type="number"
                    min={1}
                    value={riskForm.fade_end_days}
                    onChange={(e) => setRiskForm({ ...riskForm, fade_end_days: parseInt(e.target.value) || 365 })}
                  />
                  <p className="text-xs text-muted-foreground">Ennyi nap után normalizálódik teljesen</p>
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
