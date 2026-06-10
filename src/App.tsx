import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

// Auth pages (not lazy — need fast load)
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";

// App pages (lazy loaded)
const Setup = lazy(() => import("./pages/Setup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Sources = lazy(() => import("./pages/Sources"));
const Insights = lazy(() => import("./pages/Insights"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Brands = lazy(() => import("./pages/Brands"));
const Lab = lazy(() => import("./pages/Lab"));
const Studio = lazy(() => import("./pages/Studio"));
const Autopilot = lazy(() => import("./pages/Autopilot"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function PageLoader() {
  // Render a loader that, after a generous delay, also offers a "reload" escape hatch
  // so the user never sees a permanently blank screen.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      <button
        onClick={() => window.location.reload()}
        className="text-xs text-muted-foreground hover:text-foreground underline opacity-0 animate-[fadeIn_1s_ease-in_6s_forwards]"
        style={{ animation: "fadeIn 1s ease-in 6s forwards" }}
      >
        Demorando demais? Clique para recarregar
      </button>
      <style>{`@keyframes fadeIn { to { opacity: 1; } }`}</style>
    </div>
  );
}


// Redirect to login if not authenticated
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthEnabled } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthEnabled) return <>{children}</>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireSetupAccess({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthEnabled } = useAuth();
  const { configLoading } = useApp();

  if (loading || configLoading) return <PageLoader />;
  if (!isAuthEnabled) return <>{children}</>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAppAccess({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthEnabled } = useAuth();
  const { onboardingCompleted, configLoading } = useApp();

  if (loading || configLoading) return <PageLoader />;
  if (!isAuthEnabled) return <>{children}</>;
  if (!user) return <Navigate to="/login" replace />;
  if (!onboardingCompleted) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}
// Redirect to dashboard if already authenticated
function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthEnabled } = useAuth();
  const { onboardingCompleted, configLoading } = useApp();

  if (loading || (isAuthEnabled && user && configLoading)) return <PageLoader />;
  // If auth not configured, show the page (login will work when configured)
  if (!isAuthEnabled) return <>{children}</>;
  if (user) return <Navigate to={onboardingCompleted ? "/dashboard" : "/setup"} replace />;
  return <>{children}</>;
}

function ThemeBoot({ children }: { children: React.ReactNode }) {
  useTheme(); // garante que a classe `light`/`dark` seja aplicada já no boot
  return <>{children}</>;
}

// Decide pra onde mandar quando o usuário abre a raiz "/"
function RootRedirect() {
  const { user, loading, isAuthEnabled } = useAuth();
  const { onboardingCompleted, configLoading } = useApp();

  if (loading) return <PageLoader />;
  if (!isAuthEnabled) return <Navigate to="/dashboard" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (configLoading) return <PageLoader />;
  return <Navigate to={onboardingCompleted ? "/dashboard" : "/setup"} replace />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeBoot>
        <AuthProvider>
          <AppProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Auth routes (guest only) */}
                    <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                    <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                    <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
                    <Route path="/update-password" element={<UpdatePassword />} />

                    {/* Onboarding (authenticated) */}
                    <Route path="/setup" element={<RequireSetupAccess><Setup /></RequireSetupAccess>} />

                    {/* App routes (authenticated + onboarded + layout) */}
                    <Route element={<RequireAppAccess><AppLayout /></RequireAppAccess>}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/studio" element={<Studio />} />
                      {/* Telas antigas aposentadas — redirecionam ao Studio unificado */}
                      <Route path="/create" element={<Navigate to="/studio" replace />} />
                      <Route path="/carousel" element={<Navigate to="/studio" replace />} />
                      <Route path="/visuals" element={<Navigate to="/studio" replace />} />
                      <Route path="/gallery" element={<Gallery />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/lab" element={<Lab />} />
                      <Route path="/schedule" element={<Schedule />} />
                      <Route path="/sources" element={<Sources />} />
                      <Route path="/brands" element={<Brands />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/autopilot" element={<Autopilot />} />
                      <Route path="/admin" element={<Admin />} />
                    </Route>

                    {/* Redirects */}
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeBoot>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
