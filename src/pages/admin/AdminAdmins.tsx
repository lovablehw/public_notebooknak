import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2, Shield } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
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

// Interface for masked admin data returned by the secure RPC function
interface MaskedAdmin {
  id: string;
  masked_email: string;
  created_at: string;
  has_user_id: boolean;
}

export default function AdminAdmins() {
  const [newEmail, setNewEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use the secure RPC function that returns masked emails instead of raw data
  // This prevents email exposure even if a super admin account is compromised
  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-users-masked"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_list_masked");
      if (error) throw error;
      return data as MaskedAdmin[];
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      
      const { error } = await supabase
        .from("admin_users")
        .insert({ email: normalizedEmail });
      if (error) throw error;
      
      // Log audit event via secure RPC function
      await supabase.rpc("log_audit_event", {
        p_event_type: "admin_added",
        p_metadata: { email: normalizedEmail },
      });
    },
    onSuccess: () => {
      toast({
        title: "Admin hozzáadva",
        description: "Az új admin sikeresen hozzáadva. A felhasználó a következő bejelentkezéskor kapja meg az admin jogosultságot.",
      });
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-users-masked"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hiba",
        description: error.message.includes("duplicate")
          ? "Ez az email cím már admin."
          : "Nem sikerült hozzáadni az admint.",
        variant: "destructive",
      });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async ({ id, maskedEmail }: { id: string; maskedEmail: string }) => {
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", id);
      if (error) throw error;
      
      // Log audit event via secure RPC function - only log masked email for privacy
      await supabase.rpc("log_audit_event", {
        p_event_type: "admin_removed",
        p_metadata: { masked_email: maskedEmail },
      });
    },
    onSuccess: () => {
      toast({
        title: "Admin eltávolítva",
        description: "Az admin sikeresen eltávolítva.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users-masked"] });
    },
    onError: () => {
      toast({
        title: "Hiba",
        description: "Nem sikerült eltávolítani az admint.",
        variant: "destructive",
      });
    },
  });

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast({
        title: "Érvénytelen email",
        description: "Kérjük, adjon meg egy érvényes email címet.",
        variant: "destructive",
      });
      return;
    }
    
    addAdminMutation.mutate(newEmail);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Adminisztrátorok">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Adminisztrátorok">
      <div className="space-y-6">
        {/* Add new admin form */}
        <form onSubmit={handleAddAdmin} className="flex gap-3 max-w-md">
          <Input
            type="email"
            placeholder="Email cím"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={addAdminMutation.isPending || !newEmail.trim()}
          >
            {addAdminMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Hozzáadás
              </>
            )}
          </Button>
        </form>

        {/* Admin list */}
        <div id="table-admins" className="rounded-md border scroll-mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Hozzáadva</TableHead>
                <TableHead className="w-[100px]">Művelet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nincsenek adminisztrátorok
                  </TableCell>
                </TableRow>
              ) : (
                admins?.map((admin) => (
                  <TableRow key={admin.id} id={`admin-${admin.id}`} className="scroll-mt-4">
                    <TableCell className="font-medium" title="Az email cím biztonsági okokból részlegesen rejtett">
                      {admin.masked_email}
                    </TableCell>
                    <TableCell>
                      {format(new Date(admin.created_at), "yyyy. MMM d.", { locale: hu })}
                    </TableCell>
                    <TableCell>
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
                            <AlertDialogTitle>Admin eltávolítása</AlertDialogTitle>
                            <AlertDialogDescription>
                              Biztosan eltávolítja <strong>{admin.masked_email}</strong> admin jogosultságát?
                              Ez a művelet nem vonható vissza.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Mégse</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeAdminMutation.mutate({ id: admin.id, maskedEmail: admin.masked_email })}
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
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
