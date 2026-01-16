import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type AdminRole = "super_admin" | "service_admin";

interface AdminRoleRecord {
  id: string;
  user_id: string;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

/**
 * Masks a user ID for display to reduce exposure risk.
 */
function maskUserId(userId: string): string {
  if (userId.length <= 8) return userId;
  return `${userId.slice(0, 4)}...${userId.slice(-4)}`;
}

export default function AdminRoles() {
  const [newUserId, setNewUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AdminRole>("service_admin");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSuperAdmin, loading: roleLoading } = useAdminRole();

  const { data: adminRoles, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminRoleRecord[];
    },
    enabled: isSuperAdmin,
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AdminRole }) => {
      const trimmedUserId = userId.trim();
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(trimmedUserId)) {
        throw new Error("Érvénytelen felhasználó azonosító formátum (UUID szükséges)");
      }

      const { error } = await supabase
        .from("admin_roles")
        .insert({ user_id: trimmedUserId, role });
      if (error) throw error;
      
      // Log audit event via secure RPC function
      await supabase.rpc("log_audit_event", {
        p_event_type: "admin_role_assigned",
        p_metadata: { user_id: trimmedUserId, role },
      });
    },
    onSuccess: () => {
      toast({
        title: "Szerepkör hozzárendelve",
        description: "A felhasználó sikeresen megkapta a szerepkört.",
      });
      setNewUserId("");
      setSelectedRole("service_admin");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hiba",
        description: error.message.includes("duplicate")
          ? "Ez a felhasználó már rendelkezik ezzel a szerepkörrel."
          : error.message,
        variant: "destructive",
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ id, userId, role }: { id: string; userId: string; role: AdminRole }) => {
      const { error } = await supabase
        .from("admin_roles")
        .delete()
        .eq("id", id);
      if (error) throw error;
      
      // Log audit event via secure RPC function
      await supabase.rpc("log_audit_event", {
        p_event_type: "admin_role_removed",
        p_metadata: { user_id: userId, role },
      });
    },
    onSuccess: () => {
      toast({
        title: "Szerepkör eltávolítva",
        description: "A szerepkör sikeresen eltávolítva.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-events"] });
    },
    onError: () => {
      toast({
        title: "Hiba",
        description: "Nem sikerült eltávolítani a szerepkört.",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, userId, newRole }: { id: string; userId: string; newRole: AdminRole }) => {
      const { error } = await supabase
        .from("admin_roles")
        .update({ role: newRole })
        .eq("id", id);
      if (error) throw error;
      
      await supabase.rpc("log_audit_event", {
        p_event_type: "admin_role_updated",
        p_metadata: { user_id: userId, new_role: newRole },
      });
    },
    onSuccess: () => {
      toast({
        title: "Szerepkör frissítve",
        description: "A szerepkör sikeresen módosítva.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-events"] });
    },
    onError: () => {
      toast({
        title: "Hiba",
        description: "Nem sikerült frissíteni a szerepkört.",
        variant: "destructive",
      });
    },
  });

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    addRoleMutation.mutate({ userId: newUserId, role: selectedRole });
  };

  const getRoleBadge = (role: AdminRole) => {
    if (role === "super_admin") {
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldAlert className="h-3 w-3" />
          Super Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        Service Admin
      </Badge>
    );
  };

  if (roleLoading || isLoading) {
    return (
      <AdminLayout title="Admin szerepkörök">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AdminLayout title="Admin szerepkörök">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Hozzáférés megtagadva</h2>
          <p className="text-muted-foreground">
            Csak Super Adminok kezelhetik az admin szerepköröket.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin szerepkörök">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Admin szerepkörök kezelése</h2>
          <p className="text-sm text-muted-foreground">
            Super Admin: teljes hozzáférés minden funkcióhoz. Service Admin: kérdőívek és csoportok kezelése.
          </p>
        </div>

        {/* Add new role form */}
        <form onSubmit={handleAddRole} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            placeholder="Felhasználó azonosító (UUID)"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            className="flex-1"
          />
          <Select
            value={selectedRole}
            onValueChange={(value: AdminRole) => setSelectedRole(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Szerepkör" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service_admin">Service Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            type="submit" 
            disabled={addRoleMutation.isPending || !newUserId.trim()}
          >
            {addRoleMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Hozzáadás
          </Button>
        </form>

        {/* Roles table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Felhasználó ID</TableHead>
                <TableHead>Szerepkör</TableHead>
                <TableHead>Létrehozva</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminRoles && adminRoles.length > 0 ? (
                adminRoles.map((roleRecord) => (
                  <TableRow key={roleRecord.id}>
                    <TableCell className="font-mono text-sm">
                      {maskUserId(roleRecord.user_id)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={roleRecord.role}
                        onValueChange={(newRole: AdminRole) => 
                          updateRoleMutation.mutate({ 
                            id: roleRecord.id, 
                            userId: roleRecord.user_id, 
                            newRole 
                          })
                        }
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue>{getRoleBadge(roleRecord.role)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service_admin">Service Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(roleRecord.created_at), "yyyy. MM. dd. HH:mm", { locale: hu })}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Szerepkör eltávolítása</AlertDialogTitle>
                            <AlertDialogDescription>
                              Biztosan el szeretné távolítani ezt a szerepkört? 
                              A felhasználó elveszíti az admin jogosultságait.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Mégse</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeRoleMutation.mutate({ 
                                id: roleRecord.id, 
                                userId: roleRecord.user_id,
                                role: roleRecord.role 
                              })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eltávolítás
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Még nincsenek admin szerepkörök beállítva.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
