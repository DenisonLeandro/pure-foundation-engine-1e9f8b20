import { Outlet, Navigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useApp } from "@/contexts/AppContext";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const { isConfigured, onboardingCompleted, configLoading } = useApp();
  const isMobile = useIsMobile();

  if (configLoading) return null;

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
