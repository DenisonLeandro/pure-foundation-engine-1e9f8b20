// Re-export the Lovable-managed Supabase client.
// O client em @/integrations/supabase/client tem fallback público embutido,
// então o backend sempre fica configurado, mesmo se o build publicado não
// receber VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.
export { supabase } from "@/integrations/supabase/client";

// Allow E2E tests to bypass auth by setting VITE_E2E_BYPASS_AUTH=true
const e2eBypassAuth = (import.meta as any).env?.VITE_E2E_BYPASS_AUTH === "true";
export const supabaseConfigured = !e2eBypassAuth;

// eslint-disable-next-line no-console
console.info(`[auth] supabase configurado=${supabaseConfigured}`);
