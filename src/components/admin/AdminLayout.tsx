import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAdminGuard } from "@/hooks/useAdmin";
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
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { path: "/admin", label: "Főoldal", icon: LayoutDashboard },
  { path: "/admin/felhasznalok", label: "Felhasználók", icon: Users },
  { path: "/admin/hozzajarulasok", label: "Hozzájárulások", icon: FileCheck },
  { path: "/admin/pontok", label: "Pontok", icon: Star },
  { path: "/admin/pontszabalyok", label: "Pontszabályok", icon: Star },
  { path: "/admin/kituntetesek", label: "Kitüntetések", icon: Trophy },
  { path: "/admin/hozzajarulasi-verziok", label: "Hozzájárulási verziók", icon: FileText },
  { path: "/admin/feltoltesek", label: "Feltöltések", icon: FileText },
  { path: "/admin/naplo", label: "Napló", icon: ScrollText },
  { path: "/admin/admins", label: "Adminisztrátorok", icon: Shield },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { isAdmin, loading } = useAdminGuard();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
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

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-65px)] p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
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
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
}
