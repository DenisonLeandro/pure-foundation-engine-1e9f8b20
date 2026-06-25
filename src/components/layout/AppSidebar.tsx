import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Lightbulb,
  BookOpen,
  Settings,
  Zap,
  Bot,
  LogOut,
  Menu,
  Moon,
  Sun,
  FolderOpen,
  Building2,
  FlaskConical,
  BarChart3,
  ShieldAlert,
  Sparkles,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { canManageTeam } from "@/lib/permissions";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CompanySwitcher } from "@/components/layout/CompanySwitcher";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/analytics", icon: BarChart3, label: "Analytics IA" },
  { to: "/studio", icon: Sparkles, label: "Studio" },
  { to: "/gallery", icon: FolderOpen, label: "Galeria" },
  { to: "/lab", icon: FlaskConical, label: "Post Lab" },
  { to: "/schedule", icon: CalendarDays, label: "Agenda" },
  { to: "/sources", icon: BookOpen, label: "Fontes" },
  { to: "/brands", icon: Building2, label: "Marcas" },
  { to: "/artigos", icon: FileText, label: "Artigos" },
  { to: "/accounts", icon: Users, label: "Contas" },
  { to: "/insights", icon: Lightbulb, label: "Insights IA" },
  { to: "/admin", icon: ShieldAlert, label: "Administração" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { user, signOut, accountType } = useAuth();
  const { role } = useCompany();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-full flex-col">
      {/* Company switcher */}
      <div className="px-3 py-3">
        <CompanySwitcher />
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} onClick={onNavigate}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-violet-600/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-violet-600 dark:text-violet-400")} />
                {item.label}
              </div>
            </NavLink>
          );
        })}
        {canManageTeam(role) && (
          <NavLink to="/admin/equipe" onClick={onNavigate}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                location.pathname === "/admin/equipe"
                  ? "bg-gradient-to-r from-violet-600/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Users className={cn("h-4 w-4", location.pathname === "/admin/equipe" && "text-violet-600 dark:text-violet-400")} />
              Equipe
            </div>
          </NavLink>
        )}
      </nav>

      {/* Autopilot — botão destacado */}
      <div className="px-3 pb-3">
        <NavLink to="/autopilot" onClick={onNavigate}>
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
              location.pathname === "/autopilot"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                : "bg-gradient-to-r from-violet-600/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 hover:from-violet-600/20 hover:to-fuchsia-500/20 border border-violet-500/20"
            )}
          >
            <Bot className={cn("h-4.5 w-4.5", location.pathname === "/autopilot" ? "text-white" : "text-violet-500")} />
            Autopilot
            <span className={cn(
              "ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
              location.pathname === "/autopilot"
                ? "bg-white/20 text-white"
                : "bg-violet-500/10 text-violet-500"
            )}>
              IA
            </span>
          </div>
        </NavLink>
      </div>

      <Separator />

      {/* Footer */}
      <div className="space-y-2 px-3 py-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 px-3 text-muted-foreground"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
        </Button>
        {accountType !== "employee" && (
          <NavLink to="/setup" onClick={onNavigate}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                location.pathname === "/setup"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </div>
          </NavLink>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-destructive"
          onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
        {user && (
          <p className="px-3 text-[10px] text-muted-foreground truncate">
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
}

export function AppSidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <div className="fixed left-0 top-0 z-50 flex h-14 w-full items-center border-b border-border bg-background/95 backdrop-blur-sm px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="ml-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold">Mega Automação</span>
          </div>
        </div>
        <div className="h-14" /> {/* Spacer */}
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <SidebarContent />
    </aside>
  );
}
