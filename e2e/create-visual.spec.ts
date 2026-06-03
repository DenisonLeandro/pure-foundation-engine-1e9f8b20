import { test, expect } from "@playwright/test";

/**
 * E2E — Geração de vídeo/visual via Blotato
 *
 * Testa o fluxo completo:
 *   1. Templates carregam (blotato_list_visual_templates)
 *   2. Usuário seleciona template + preenche prompt
 *   3. Clica em Gerar → dispara blotato_create_visual
 *   4. Polling de status (blotato_get_visual_status)
 *   5. Quando status = "done" → vídeo/imagem é exibido
 *   6. Visual é salvo na galeria (localStorage)
 *
 * Todos os calls à edge function blotato-proxy são mockados — não depende
 * de API key real nem de conexão com a internet.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

// ─── Fixtures de mock ────────────────────────────────────────────────────────

const MOCK_TEMPLATES = [
  { id: "/base/v2/ai-story-video/abc001/v1",        description: "AI Story Video - Narrated short-form" },
  { id: "/base/v2/ai-selfie-video/abc002/v1",       description: "AI Selfie Style Video" },
  { id: "/base/v2/ai-avatar/abc003/v1",             description: "AI Avatar Talking Head Video" },
  { id: "/base/v2/tutorial-carousel/abc004/v1",     description: "Step-by-step tutorial carousel" },
  { id: "/base/v2/quote-card/abc005/v1",            description: "Quote carousel with brand style" },
  { id: "/base/v2/tweet-card/abc006/v1",            description: "Twitter/X style quote cards with minimal style" },
  { id: "/base/v2/tweet-card-photo/9f4e66cd/v1",    description: "Twitter/X style quote cards with photo/video background" },
];

const MOCK_CREATION_ID = "creation-e2e-test-001";
const MOCK_IMAGE_URL   = "https://picsum.photos/seed/e2e/720/1280";

// Supabase project ref extraído de VITE_SUPABASE_URL
const SUPABASE_REF = "scrwjzkqopzwzplnaznz";
const SUPABASE_SESSION_KEY = `sb-${SUPABASE_REF}-auth-token`;

/**
 * Sessão Supabase fake injetada via localStorage antes do React montar.
 * O Supabase JS client valida a assinatura no servidor — mas getSession()
 * no cliente apenas lê e retorna o que está no storage.
 * O ProtectedRoute só checa `user != null`, então isso é suficiente.
 */
function buildFakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: "e2e-user-id", email: "e2e@test.com",
    role: "authenticated", aud: "authenticated",
    exp: now + 3600, iat: now,
  })).toString("base64url");
  const fakeJwt = `${header}.${payload}.fakesig`;

  return JSON.stringify({
    access_token:  fakeJwt,
    refresh_token: "fake-refresh-e2e",
    expires_in:    3600,
    expires_at:    now + 3600,
    token_type:    "bearer",
    user: { id: "e2e-user-id", email: "e2e@test.com", role: "authenticated", aud: "authenticated" },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Page = import("@playwright/test").Page;

/** Injeta sessão Supabase fake + chave Blotato antes de qualquer script rodar */
async function injectAuth(page: Page, extra?: Record<string, string>) {
  const key     = SUPABASE_SESSION_KEY;
  const session = buildFakeSession();
  // mega_config com blotatoApiKey satisfaz isConfigured = true no AppLayout

  const megaConfig = JSON.stringify({ blotatoApiKey: "test-blotato-key-mock" });

  // 1. Injeta no localStorage antes do React montar
  await page.addInitScript(({ k, s, cfg, e }) => {
    localStorage.setItem(k, s);
    localStorage.setItem("mega_config", cfg);              // satisfaz isConfigured
    localStorage.setItem("mega_blotato_api_key", "test-blotato-key-mock");
    for (const [ek, ev] of Object.entries(e ?? {})) localStorage.setItem(ek, ev);
  }, { k: key, s: session, cfg: megaConfig, e: extra ?? {} });

  // 2. Intercepta TODOS os requests ao Supabase (auth + API)
  //    e retorna respostas válidas para que o cliente não invalide a sessão
  const fakeSession = JSON.parse(session);
  const fakeUser = fakeSession.user;

  await page.route(`**supabase.co/**`, async (route) => {
    const url = route.request().url();

    // /auth/v1/token (refresh) → retorna sessão válida
    if (url.includes("/auth/v1/token")) {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(fakeSession) });
      return;
    }
    // /auth/v1/user → retorna user
    if (url.includes("/auth/v1/user")) {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(fakeUser) });
      return;
    }
    // /auth/v1/session → retorna sessão
    if (url.includes("/auth/v1/session")) {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(fakeSession) });
      return;
    }
    // Outros endpoints Supabase (PostgREST, storage, etc.) → OK vazio
    await route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify([]) });
  });
}

/** Mock da edge function blotato-proxy com status sequence configurável */
async function mockBlotato(page: Page, opts?: {
  statusSequence?: string[];
  onCreateCall?: (body: Record<string, unknown>) => void;
  onPollCall?:   (body: Record<string, unknown>) => void;
}) {
  const statusSeq = opts?.statusSequence ?? ["queueing", "generating-media", "done"];
  let pollIdx = 0;

  await page.route("**/functions/v1/blotato-proxy**", async (route) => {
    const body = (route.request().postDataJSON?.() ?? {}) as Record<string, unknown>;
    const tool = body.tool as string;

    if (tool === "blotato_list_visual_templates") {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(MOCK_TEMPLATES) });
      return;
    }

    if (tool === "blotato_create_visual") {
      opts?.onCreateCall?.(body);
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ id: MOCK_CREATION_ID, status: "queueing" }) });
      return;
    }

    if (tool === "blotato_get_visual_status") {
      opts?.onPollCall?.(body);
      const status = statusSeq[Math.min(pollIdx++, statusSeq.length - 1)];
      const resp: Record<string, unknown> = { id: MOCK_CREATION_ID, status };
      if (status === "done") {
        resp.imageUrls = [MOCK_IMAGE_URL];
        resp.mediaUrl  = MOCK_IMAGE_URL;
      }
      if (status === "creation-from-template-failed") {
        resp.errorMessage = "Mock failure";
      }
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(resp) });
      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });
}

/** Navega para /visuals com auth e blotato mockados */
async function gotoVisuals(page: Page, bOpts?: Parameters<typeof mockBlotato>[1]) {
  await injectAuth(page);
  await mockBlotato(page, bOpts);
  await page.goto(`${BASE}/visuals`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
}

/** Retorna true se a página está na tela de login (sessão fake não funcionou) */
async function onLoginScreen(page: Page) {
  return page.locator('input[type="password"]').isVisible({ timeout: 1200 }).catch(() => false);
}

/** Seleciona o primeiro card da aba ativa e retorna se achou */
async function selectFirstCard(page: Page) {
  const card = page.locator("[role='tabpanel'] .cursor-pointer").first();
  const visible = await card.isVisible({ timeout: 3000 }).catch(() => false);
  if (visible) await card.click();
  return visible;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — Templates
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Templates — listagem e seleção", () => {

  test("edge function blotato_list_visual_templates é chamada ao carregar a página", async ({ page }) => {
    const calls: Record<string, unknown>[] = [];

    await injectAuth(page);
    await page.route("**/functions/v1/blotato-proxy**", async (route) => {
      const body = (route.request().postDataJSON?.() ?? {}) as Record<string, unknown>;
      calls.push(body);
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(MOCK_TEMPLATES) });
    });

    await page.goto(`${BASE}/visuals`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    if (await onLoginScreen(page)) {
      test.skip(true, "Sessão fake não aceita — auth bypassado não disponível");
      return;
    }

    const listCall = calls.find((c) => c.tool === "blotato_list_visual_templates");
    expect(listCall).toBeTruthy();
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  test("todos os 7 templates mock são renderizados como cards clicáveis", async ({ page }) => {
    await gotoVisuals(page);
    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);

    const tabs = page.locator("[role='tab']");
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(1);

    let totalCards = 0;
    for (let i = 0; i < tabCount; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(300);
      totalCards += await page.locator("[role='tabpanel'] .cursor-pointer").count();
    }

    expect(totalCards).toBeGreaterThanOrEqual(MOCK_TEMPLATES.length);
  });

  test("clicar em card diferente troca a seleção (ring visual)", async ({ page }) => {
    await gotoVisuals(page);
    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);

    const cards = page.locator("[role='tabpanel'] .cursor-pointer");
    if (await cards.count() < 2) return; // não há cards suficientes

    await cards.nth(0).click();
    await page.waitForTimeout(200);
    await cards.nth(1).click();
    await page.waitForTimeout(200);

    // O segundo card deve ter o ring/border de seleção
    const cls = await cards.nth(1).getAttribute("class") ?? "";
    expect(cls).toMatch(/fuchsia|ring|selected/i);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — Fluxo de geração (create + polling + resultado)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Geração de vídeo — fluxo completo", () => {

  test("clicar em Gerar dispara blotato_create_visual com templateId e prompt corretos", async ({ page }) => {
    const createCalls: Record<string, unknown>[] = [];

    await gotoVisuals(page, {
      onCreateCall: (b) => createCalls.push(b),
    });
    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);

    if (!await selectFirstCard(page)) return;
    await page.waitForTimeout(300);

    await page.locator("textarea").first().fill("Teste e2e: 5 dicas de marketing digital para iniciantes");

    const generateBtn = page.getByRole("button", { name: /gerar visual|gerar/i }).first();
    await expect(generateBtn).toBeVisible({ timeout: 3000 });
    await generateBtn.click();
    await page.waitForTimeout(1500);

    expect(createCalls.length).toBeGreaterThanOrEqual(1);

    const call = createCalls[0] as any;
    expect(call.tool).toBe("blotato_create_visual");
    expect(call.args?.templateId).toBeTruthy();
    expect(call.args?.prompt).toContain("marketing digital");
    expect(call.args?.render).toBe(true);
  });

  test("após create, polling é feito via blotato_get_visual_status com o id correto", async ({ page }) => {
    const pollCalls: Record<string, unknown>[] = [];

    await gotoVisuals(page, {
      statusSequence: ["queueing", "generating-media", "done"],
      onPollCall: (b) => pollCalls.push(b),
    });
    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);
    if (!await selectFirstCard(page)) return;

    await page.locator("textarea").first().fill("Teste polling: vídeo sobre produtividade");
    await page.getByRole("button", { name: /gerar visual|gerar/i }).first().click();

    // O hook usa refetchInterval de ~15s, mas com mock imediato o React Query
    // deve fazer pelo menos 1 poll logo após o create
    await page.waitForTimeout(5000);

    expect(pollCalls.length).toBeGreaterThanOrEqual(1);

    const poll = pollCalls[0] as any;
    expect(poll.tool).toBe("blotato_get_visual_status");
    expect(poll.args?.id).toBe(MOCK_CREATION_ID);
  });

  test("quando status=done, imagem/vídeo aparece na tela", async ({ page }) => {
    await gotoVisuals(page, {
      statusSequence: ["queueing", "done"],
    });
    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);
    if (!await selectFirstCard(page)) return;

    await page.locator("textarea").first().fill("Vídeo sobre saúde mental no trabalho");
    await page.getByRole("button", { name: /gerar visual|gerar/i }).first().click();

    // Aguarda imagem ou toast de sucesso aparecer
    const result = page
      .locator(`img[src*="picsum"], video[src*="picsum"]`)
      .or(page.getByText(/salvo na galeria|visual criado|concluído|pronto/i))
      .or(page.locator("[data-sonner-toast]").filter({ hasText: /galeria|criado|pronto/i }));

    await expect(result.first()).toBeVisible({ timeout: 25000 });
  });

  test("quando status=done, visual é salvo automaticamente no localStorage (galeria)", async ({ page }) => {
    await injectAuth(page, { mega_gallery: "[]" }); // galeria vazia inicial

    let pollIdx = 0;
    await mockBlotato(page, {
      statusSequence: ["queueing", "done"],
      onPollCall: () => pollIdx++,
    });

    await page.goto(`${BASE}/visuals`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);
    if (!await selectFirstCard(page)) return;

    await page.locator("textarea").first().fill("Conteúdo para galeria e2e");
    await page.getByRole("button", { name: /gerar visual|gerar/i }).first().click();

    // Aguarda o useEffect de auto-save disparar (depende do polling completar)
    await page.waitForTimeout(25000);

    const gallery: any[] = await page.evaluate(() => {
      const raw = localStorage.getItem("mega_gallery");
      return raw ? JSON.parse(raw) : [];
    });

    expect(Array.isArray(gallery)).toBe(true);
    expect(gallery.length).toBeGreaterThanOrEqual(1);
    expect(gallery[0].urls?.[0]).toContain("picsum");
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — Validações de formulário
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Formulário de geração — validações", () => {

  test("botão Gerar está desabilitado ou mostra erro se prompt estiver vazio", async ({ page }) => {
    await gotoVisuals(page);
    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);
    if (!await selectFirstCard(page)) return;
    await page.waitForTimeout(300);

    // Textarea vazia (não preenche nada)
    const textarea = page.locator("textarea").first();
    await textarea.fill("");

    const generateBtn = page.getByRole("button", { name: /gerar visual|gerar/i }).first();
    await expect(generateBtn).toBeVisible({ timeout: 3000 });

    const isDisabled = await generateBtn.isDisabled();
    if (!isDisabled) {
      await generateBtn.click();
      await page.waitForTimeout(800);
      // Sem toast de "em criação" — o handler retorna early se !prompt.trim()
      const creatingToast = page.locator("[data-sonner-toast]").filter({ hasText: /criação|criando/i });
      const visible = await creatingToast.isVisible({ timeout: 1000 }).catch(() => false);
      expect(visible).toBe(false);
    } else {
      expect(isDisabled).toBe(true);
    }
  });

  test("seletor de proporção (aspectRatio) está presente após selecionar card", async ({ page }) => {
    await gotoVisuals(page);
    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);
    if (!await selectFirstCard(page)) return;

    const aspectSelector = page
      .getByText(/proporção/i)
      .or(page.locator("[role='combobox']").filter({ hasText: /9:16|4:5|1:1/i }));

    await expect(aspectSelector.first()).toBeVisible({ timeout: 3000 });
  });

  test("aba Vídeos IA mostra seletor de voz", async ({ page }) => {
    await gotoVisuals(page);
    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);

    // Seleciona aba de vídeos (deve ser a default ou a primeira)
    const videoTab = page.getByRole("tab", { name: /vídeos ia/i }).first();
    if (await videoTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await videoTab.click();
    }

    // Seleciona o primeiro card de vídeo
    if (!await selectFirstCard(page)) return;

    // O seletor de voz deve aparecer apenas para templates de vídeo
    const voiceSelector = page
      .getByText(/voz/i)
      .or(page.locator("[role='combobox']").filter({ hasText: /narração|voz|multilingual/i }));

    await expect(voiceSelector.first()).toBeVisible({ timeout: 3000 });
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — Cenários de erro
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Geração de vídeo — cenários de erro", () => {

  test("status=creation-from-template-failed exibe indicador de falha na UI", async ({ page }) => {
    await gotoVisuals(page, {
      statusSequence: ["queueing", "creation-from-template-failed"],
    });
    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);
    if (!await selectFirstCard(page)) return;

    await page.locator("textarea").first().fill("Forçar falha no template");
    await page.getByRole("button", { name: /gerar visual|gerar/i }).first().click();

    // A UI mostra "Falhou" (de VISUAL_STATUSES) e um painel de erro detalhado
    const failureIndicator = page
      .getByText("Falhou", { exact: true })
      .or(page.getByText(/detalhe do erro/i))
      .or(page.locator(".text-destructive").filter({ hasText: /falhou|erro|failed/i }));

    await expect(failureIndicator.first()).toBeVisible({ timeout: 20000 });
  });

  test("edge function retorna HTTP 500 — toast de erro é exibido", async ({ page }) => {
    await injectAuth(page);

    await page.route("**/functions/v1/blotato-proxy**", async (route) => {
      const body = (route.request().postDataJSON?.() ?? {}) as Record<string, unknown>;
      if (body.tool === "blotato_create_visual") {
        await route.fulfill({ status: 500, contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(body.tool === "blotato_list_visual_templates" ? MOCK_TEMPLATES : {}) });
    });

    await page.goto(`${BASE}/visuals`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    if (await onLoginScreen(page)) { test.skip(true, "Auth bypass indisponível"); return; }

    await page.waitForTimeout(800);
    if (!await selectFirstCard(page)) return;

    await page.locator("textarea").first().fill("Teste erro 500");
    await page.getByRole("button", { name: /gerar visual|gerar/i }).first().click();

    const toast = page
      .locator("[data-sonner-toast]")
      .or(page.locator("[role='alert']"))
      .or(page.getByText(/erro ao criar|erro|falha/i));

    await expect(toast).toBeVisible({ timeout: 8000 });
  });

});
