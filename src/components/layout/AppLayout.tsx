import { Outlet, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { useApp } from "@/contexts/AppContext";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const { isConfigured, onboardingCompleted, configLoading } = useApp();
  const isMobile = useIsMobile();

  // Nunca retornar null aqui — isso causava tela branca durante o boot/refresh
  if (configLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // Redireciona para setup apenas na primeira vez (onboarding não completado E sem config)
  if (!isConfigured && !onboardingCompleted) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={isMobile ? "min-h-screen" : "ml-64 min-h-screen"}>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
