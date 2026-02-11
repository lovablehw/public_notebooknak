import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface WebComponentBox {
  id: string;
  anchor_id: string;
  name: string;
  html_content: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminWebComponents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editBox, setEditBox] = useState<WebComponentBox | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", anchor_id: "", html_content: "", is_active: false });

  const { data: boxes = [], isLoading } = useQuery({
    queryKey: ["admin-web-component-boxes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("web_component_boxes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WebComponentBox[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("web_component_boxes")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-web-component-boxes"] });
      toast({ title: "Státusz frissítve" });
    },
    onError: () => toast({ title: "Hiba", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string; name: string; anchor_id: string; html_content: string; is_active: boolean }) => {
      if (data.id) {
        const { error } = await (supabase as any)
          .from("web_component_boxes")
          .update({ name: data.name, anchor_id: data.anchor_id, html_content: data.html_content, is_active: data.is_active })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("web_component_boxes")
          .insert({ name: data.name, anchor_id: data.anchor_id, html_content: data.html_content, is_active: data.is_active });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-web-component-boxes"] });
      setEditBox(null);
      setIsCreateOpen(false);
      setForm({ name: "", anchor_id: "", html_content: "", is_active: false });
      toast({ title: "Mentve" });
    },
    onError: (e: Error) => toast({ title: "Hiba", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("web_component_boxes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-web-component-boxes"] });
      toast({ title: "Törölve" });
    },
    onError: () => toast({ title: "Hiba", variant: "destructive" }),
  });

  const openEdit = (box: WebComponentBox) => {
    setForm({
      name: box.name,
      anchor_id: box.anchor_id,
      html_content: box.html_content || "",
      is_active: box.is_active,
    });
    setEditBox(box);
  };

  const openCreate = () => {
    setForm({ name: "", anchor_id: "", html_content: "", is_active: false });
    setIsCreateOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.anchor_id) {
      toast({ title: "Név és Anchor ID kötelező", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ id: editBox?.id, ...form });
  };

  const isDialogOpen = isCreateOpen || !!editBox;

  return (
    <AdminLayout title="Web Komponensek">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Web Komponens Dobozok</CardTitle>
          <Button size="sm" onClick={openCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Új doboz
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : boxes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Még nincsenek web komponens dobozok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Név</TableHead>
                  <TableHead>Anchor ID</TableHead>
                  <TableHead>Státusz</TableHead>
                  <TableHead>Tartalom</TableHead>
                  <TableHead className="text-right">Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boxes.map((box) => (
                  <TableRow key={box.id}>
                    <TableCell className="font-medium">{box.name}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{box.anchor_id}</code></TableCell>
                    <TableCell>
                      <Switch
                        checked={box.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: box.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      {box.html_content ? (
                        <Badge variant="secondary">Van tartalom</Badge>
                      ) : (
                        <Badge variant="outline">Üres</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(box)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(box.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setEditBox(null); setIsCreateOpen(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editBox ? "Doboz szerkesztése" : "Új doboz létrehozása"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Név</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="pl. Kitüntetett Labor Eredmények" />
            </div>
            <div>
              <Label>Anchor ID</Label>
              <Input value={form.anchor_id} onChange={(e) => setForm(f => ({ ...f, anchor_id: e.target.value }))} placeholder="pl. patient_prominent_labor_results" disabled={!!editBox} />
              {editBox && <p className="text-xs text-muted-foreground mt-1">Az Anchor ID nem módosítható szerkesztéskor.</p>}
            </div>
            <div>
              <Label>HTML Tartalom</Label>
              <Textarea
                value={form.html_content}
                onChange={(e) => setForm(f => ({ ...f, html_content: e.target.value }))}
                placeholder="<div>HTML tartalom...</div>"
                className="font-mono text-sm min-h-[200px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm(f => ({ ...f, is_active: checked }))} />
              <Label>Aktív</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditBox(null); setIsCreateOpen(false); }}>Mégse</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Mentés
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
