import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAdminGuard } from "@/hooks/useAdmin";
import { useAdminRole } from "@/hooks/useAdminRole";
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Trophy, 
  Star, 
  FileText, 
  ScrollText,
  ArrowLeft,
  Loader2,
  Shield,
  ClipboardList,
  UsersRound,
  ShieldCheck,
  MousePointer2,
  Flame,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

// Base nav items available to all admins
const baseNavItems = [
  { path: "/admin", label: "Főoldal", icon: LayoutDashboard },
  { path: "/admin/felhasznalok", label: "Felhasználók", icon: Users },
  { path: "/admin/csoportok", label: "Csoportok", icon: UsersRound },
  { path: "/admin/kerdoivek", label: "Kérdőívek", icon: ClipboardList },
  { path: "/admin/hozzajarulasok", label: "Hozzájárulások", icon: FileCheck },
  { path: "/admin/pontok", label: "Pontok", icon: Star },
  { path: "/admin/pontszabalyok", label: "Pontszabályok", icon: Star },
  { path: "/admin/kihivasok", label: "Kihívások", icon: Flame },
  { path: "/admin/kituntetesek", label: "Kitüntetések", icon: Trophy },
  { path: "/admin/hozzajarulasi-verziok", label: "Hozzájárulási verziók", icon: FileText },
  { path: "/admin/feltoltesek", label: "Feltöltések", icon: FileText },
  { path: "/admin/naplo", label: "Napló", icon: ScrollText },
  { path: "/admin/admins", label: "Adminisztrátorok", icon: Shield },
  { path: "/admin/szerepkorok", label: "Szerepkörök", icon: ShieldCheck },
];

// Super admin only nav items
const superAdminOnlyItems = [
  { path: "/admin/gombok", label: "Gomb Karbantartó", icon: MousePointer2 },
  { path: "/admin/web-komponensek", label: "Web Komponensek", icon: LayoutDashboard },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { isAdmin, loading } = useAdminGuard();
  const { isSuperAdmin, loading: roleLoading } = useAdminRole();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Combine nav items based on role
  const navItems = isSuperAdmin 
    ? [...baseNavItems, ...superAdminOnlyItems]
    : baseNavItems;

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const NavContent = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden max-w-full">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menü megnyitása</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <div className="mb-4 font-semibold text-foreground">Admin menü</div>
                <NavContent />
              </SheetContent>
            </Sheet>

            <Link 
              to="/healthbook" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Vissza az alkalmazásba</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold text-foreground">Admin</h1>
          </div>
        </div>
      </header>

      <div className="flex overflow-x-hidden max-w-full">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r bg-card min-h-[calc(100vh-65px)] p-4 hidden lg:block">
          <NavContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 overflow-x-auto max-w-full">
          <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
}
