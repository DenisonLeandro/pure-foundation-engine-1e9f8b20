// Re-export the Lovable-managed Supabase client
// Lovable injects VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY automatically
export { supabase } from "@/integrations/supabase/client";

const url = (import.meta as any).env?.VITE_SUPABASE_URL ?? "";
const key = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
// Allow E2E tests to bypass auth by setting VITE_E2E_BYPASS_AUTH=true
const e2eBypassAuth = (import.meta as any).env?.VITE_E2E_BYPASS_AUTH === "true";
export const supabaseConfigured = !e2eBypassAuth && !!(url && key);
