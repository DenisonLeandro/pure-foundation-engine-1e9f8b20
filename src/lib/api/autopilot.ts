/**
 * Autopilot v2 — camada de API (edge functions).
 *
 * - parsePlan: cola → grade estruturada (autopilot-parse, síncrono).
 * - planAction: painel de ações do plano (autopilot-plan): create/approve/
 *   regen/pause/resume/cancel. Só o que precisa de service_role passa por aqui;
 *   edições triviais de post são update direto do client (ver use-autopilot).
 */

import { getSupabaseUrl, baseHeaders } from "./_shared";
import type { AutopilotPlanRow } from "@/types";

async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const url = `${getSupabaseUrl()}/functions/v1/${name}`;
  const headers = await baseHeaders();
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });

  if (!response.ok) {
    let errorMsg: string;
    try {
      const e = await response.json();
      errorMsg = e.error || `HTTP ${response.status}`;
    } catch {
      errorMsg = `HTTP ${response.status}`;
    }
    throw new Error(errorMsg);
  }
  return response.json() as Promise<T>;
}

/** Interpreta o plano colado (qualquer formato) → linhas { date, theme, category }. */
export async function parsePlan(text: string): Promise<{ rows: AutopilotPlanRow[] }> {
  return callFunction<{ rows: AutopilotPlanRow[] }>("autopilot-parse", { text });
}

export type PlanActionCreate = {
  action: "create";
  plan: {
    company_id: string;
    brand_id?: string | null;
    name?: string;
    platforms: string[];
    social_account_ids: string[];
    timezone: string;
    requires_approval: boolean;
  };
  rows: AutopilotPlanRow[];
};

export type PlanActionSimple =
  | { action: "approve"; plan_id: string }
  | { action: "pause"; plan_id: string }
  | { action: "resume"; plan_id: string }
  | { action: "cancel"; plan_id: string }
  | { action: "regen"; post_id: string; kind: "image" | "caption" };

export type PlanAction = PlanActionCreate | PlanActionSimple;

/** Executa uma ação no painel do plano (autopilot-plan). */
export async function planAction(payload: PlanAction): Promise<Record<string, unknown>> {
  return callFunction<Record<string, unknown>>("autopilot-plan", payload as unknown as Record<string, unknown>);
}
