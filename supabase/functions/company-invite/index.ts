import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

type Role = "owner" | "admin" | "editor";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function canInvite(currentRole: Role, target: "admin" | "editor"): boolean {
  if (currentRole === "owner") return true;
  if (currentRole === "admin") return target === "editor";
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Não autenticado" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    if (action === "create") {
      const { companyId, email, role: targetRole } = body as { companyId: string; email: string; role: "admin" | "editor" };
      if (!companyId || !email || !targetRole) return json({ error: "Parâmetros faltando" }, 400);
      if (!["admin", "editor"].includes(targetRole)) return json({ error: "Papel inválido" }, 400);

      const { data: me } = await admin
        .from("company_members")
        .select("role, status")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!me || me.status !== "active") return json({ error: "Sem acesso a esta empresa" }, 403);
      if (!canInvite(me.role as Role, targetRole)) return json({ error: "Sem permissão para este papel" }, 403);

      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: invite, error: insErr } = await admin
        .from("company_invites")
        .insert({
          company_id: companyId,
          email: email.toLowerCase().trim(),
          role: targetRole,
          token,
          invited_by: user.id,
          expires_at: expiresAt,
        })
        .select("id, token")
        .single();
      if (insErr || !invite) return json({ error: insErr?.message || "Falha ao criar convite" }, 500);

      const origin = req.headers.get("origin") || "";
      const inviteUrl = `${origin}/aceitar-convite?token=${invite.token}`;

      // Best-effort email send via transactional function, if it exists.
      let emailSent = false;
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
          body: JSON.stringify({
            to: email,
            subject: "Convite para participar de uma empresa",
            html: `<p>Você foi convidado(a) para participar de uma empresa.</p><p><a href="${inviteUrl}">Clique aqui para aceitar</a></p>`,
          }),
        });
        emailSent = res.ok;
      } catch { /* ignore — email opcional */ }

      return json({ inviteId: invite.id, inviteUrl, emailSent });
    }

    if (action === "revoke") {
      const { inviteId } = body as { inviteId: string };
      if (!inviteId) return json({ error: "inviteId faltando" }, 400);
      const { data: inv } = await admin.from("company_invites").select("company_id, status").eq("id", inviteId).maybeSingle();
      if (!inv) return json({ error: "Convite não encontrado" }, 404);
      const { data: me } = await admin
        .from("company_members")
        .select("role, status")
        .eq("company_id", inv.company_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!me || me.status !== "active" || !["owner", "admin"].includes(me.role)) {
        return json({ error: "Sem permissão" }, 403);
      }
      await admin.from("company_invites").update({ status: "revoked" }).eq("id", inviteId);
      return json({ ok: true });
    }

    if (action === "accept") {
      const { token } = body as { token: string };
      if (!token) return json({ error: "Token faltando" }, 400);

      const { data: invite } = await admin
        .from("company_invites")
        .select("id, company_id, email, role, status, expires_at")
        .eq("token", token)
        .maybeSingle();
      if (!invite) return json({ error: "Convite inválido" }, 404);
      if (invite.status !== "pending") return json({ error: "Convite já utilizado ou revogado" }, 400);
      if (new Date(invite.expires_at).getTime() < Date.now()) {
        await admin.from("company_invites").update({ status: "expired" }).eq("id", invite.id);
        return json({ error: "Convite expirado" }, 400);
      }

      // Upsert membership
      const { data: existing } = await admin
        .from("company_members")
        .select("id, role, status")
        .eq("company_id", invite.company_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await admin
          .from("company_members")
          .update({ status: "active", role: existing.role === "owner" ? "owner" : invite.role })
          .eq("id", existing.id);
      } else {
        await admin.from("company_members").insert({
          company_id: invite.company_id,
          user_id: user.id,
          role: invite.role,
          status: "active",
          invited_by: null,
        });
      }

      await admin
        .from("company_invites")
        .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: user.id })
        .eq("id", invite.id);

      return json({ ok: true, companyId: invite.company_id });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (err) {
    console.error("[company-invite] erro:", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
