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

const FUNCTION_TIMEOUT_MS = 25000;

async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const url = `${getSupabaseUrl()}/functions/v1/${name}`;
  const headers = await baseHeaders();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), FUNCTION_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("A criação demorou demais para responder. O plano pode ter sido iniciado; atualize a lista em alguns instantes.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

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
  | { action: "delete"; plan_id: string }
  | { action: "regen"; post_id: string; kind: "image" | "caption" };

export type PlanAction = PlanActionCreate | PlanActionSimple;

/** Executa uma ação no painel do plano (autopilot-plan). */
export async function planAction(payload: PlanAction): Promise<Record<string, unknown>> {
  return callFunction<Record<string, unknown>>("autopilot-plan", payload as unknown as Record<string, unknown>);
}
