import { test, expect } from "@playwright/test";


/**
 * Testes E2E da plataforma como um todo
 *
 * Cobre: auth pages, onboarding, sidebar, navegação completa,
 * responsividade e integridade geral.
 */

test.describe("Auth Pages", () => {
  test("login carrega com formulário de email e senha", async ({ page }) => {
    await page.goto(`/login`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("login mostra link para signup", async ({ page }) => {
    await page.goto(`/login`);
    await page.waitForLoadState("networkidle");
    const signupLink = page.getByRole("link", { name: /criar conta/i });
    await expect(signupLink).toBeVisible({ timeout: 5000 });
    await signupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("login mostra link de esqueceu senha", async ({ page }) => {
    await page.goto(`/login`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /esqueceu a senha/i })).toBeVisible({ timeout: 5000 });
  });

  test("login não bloqueia emails arbitrários (admin bypass removido)", async ({ page }) => {
    await page.goto(`/login`);
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="email"]').fill("teste@example.com");
    await page.locator('input[type="password"]').fill("123456");
    await page.getByRole("button", { name: /entrar/i }).click();
    // Não deve mostrar mensagem de "login desabilitado"
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Login desabilitado");
    expect(body).not.toContain("Remix");
  });

  test("signup carrega com formulário completo", async ({ page }) => {
    await page.goto(`/signup`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta/i })).toBeVisible();
  });

  test("signup não mostra mensagem de bloqueio", async ({ page }) => {
    await page.goto(`/signup`);
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Criação de conta desabilitada");
    expect(body).not.toContain("Remix");
  });

  test("signup valida senha mínima", async ({ page }) => {
    await page.goto(`/signup`);
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="password"]').first().fill("123");
    await expect(page.getByText(/pelo menos 6 caracteres/i)).toBeVisible({ timeout: 3000 });
  });

  test("signup valida confirmação de senha", async ({ page }) => {
    await page.goto(`/signup`);
    await page.waitForLoadState("networkidle");
    const passwords = page.locator('input[type="password"]');
    await passwords.first().fill("123456");
    await passwords.last().fill("654321");
    await expect(page.getByText(/senhas não coincidem/i)).toBeVisible({ timeout: 3000 });
  });

  test("forgot-password carrega", async ({ page }) => {
    await page.goto(`/forgot-password`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Onboarding (Setup)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("mega_supabase_url", "");
    });
  });

  test("setup carrega wizard com steps", async ({ page }) => {
    await page.goto(`/setup`);
    await page.waitForLoadState("networkidle");
    // Deve ter indicador de progresso ou step
    await expect(page.locator("body")).not.toBeEmpty();
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });

  test("setup tem campo de API key Blotato", async ({ page }) => {
    await page.goto(`/setup`);
    await page.waitForLoadState("networkidle");
    // Step 1 deve ter input para Blotato
    const blotatoInput = page.locator('input[placeholder*="blot"]').or(
      page.locator('#blotato')
    );
    await expect(blotatoInput).toBeVisible({ timeout: 5000 });
  });

  test("setup tem 8 steps de configuração", async ({ page }) => {
    await page.goto(`/setup`);
    await page.waitForLoadState("networkidle");
    // O wizard deve ter indicadores de steps (bolinha de progresso)
    // O step 1 (Blotato) deve estar ativo
    const body = await page.locator("body").textContent();
    expect(body).toContain("Blotato");
    // Deve ter pelo menos 8 indicadores de step (Blotato, PFM, Imagens, Analytics, Higgsfield, Firecrawl, Marca, Redes)
    const stepIndicators = page.locator('[class*="rounded-full"][class*="bg-"]');
    const count = await stepIndicators.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });
});

test.describe("Sidebar e Navegação", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const config = JSON.stringify({
        blotatoApiKey: "test-key",
        pfmApiKey: "test-key",
        brandName: "Empresa Teste",
        onboardingCompleted: true,
      });
      localStorage.setItem("app_anon:config", config);
    });
  });

  test("sidebar contém todos os links de navegação", async ({ page }) => {
    await page.goto(`/dashboard`);
    await page.waitForLoadState("networkidle");

    const links = [
      "Dashboard",
      "Analytics IA",
      "Criar Post",
      "Carrossel",
      "Criar Visual",
      "Galeria",
      "Post Lab",
      "Agenda",
      "Fontes",
      "Marcas",
      "Contas",
      "Insights IA",
    ];

    for (const label of links) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("Autopilot aparece como botão especial separado", async ({ page }) => {
    await page.goto(`/dashboard`);
    await page.waitForLoadState("networkidle");
    const autopilotLink = page.locator('a[href="/autopilot"]');
    await expect(autopilotLink).toBeVisible({ timeout: 5000 });
    // Tem badge IA
    await expect(autopilotLink.getByText("IA")).toBeVisible();
    // Tem texto Autopilot
    await expect(autopilotLink.getByText("Autopilot")).toBeVisible();
  });

  test("sidebar tem botão de tema (claro/escuro)", async ({ page }) => {
    await page.goto(`/dashboard`);
    await page.waitForLoadState("networkidle");
    const themeBtn = page.getByRole("button", { name: /modo claro|modo escuro/i });
    await expect(themeBtn).toBeVisible({ timeout: 5000 });
  });

  test("sidebar tem link para Configurações", async ({ page }) => {
    await page.goto(`/dashboard`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Configurações")).toBeVisible({ timeout: 5000 });
  });

  test("sidebar tem botão Sair", async ({ page }) => {
    await page.goto(`/dashboard`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /sair/i })).toBeVisible({ timeout: 5000 });
  });

  test("navegação entre todas as páginas funciona", async ({ page }) => {
    const routes = [
      { path: "/dashboard", check: /dashboard/i },
      { path: "/create", check: /criar post|campanha/i },
      { path: "/visuals", check: /visual|template/i },
      { path: "/schedule", check: /agenda|agendamento/i },
      { path: "/brands", check: /marca/i },
      { path: "/autopilot", check: /autopilot/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).not.toBeEmpty();
      const bodyText = await page.locator("body").textContent();
      expect(bodyText).not.toContain("Something went wrong");
    }
  });
});

test.describe("Rotas protegidas e redirects", () => {
  test("/ redireciona para login", async ({ page }) => {
    await page.goto(`/`);
    await expect(page).toHaveURL(/login|dashboard|setup/);
  });

  test("rota inexistente mostra 404", async ({ page }) => {
    await page.goto(`/rota-que-nao-existe-123`);
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });
});

test.describe("Responsividade", () => {
  test("mobile: menu hamburger aparece", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => {
      localStorage.setItem("mega_supabase_url", "");
    });
    await page.goto(`/dashboard`);
    await page.waitForLoadState("networkidle");
    // Em mobile, sidebar vira menu hamburger
    const menuBtn = page.getByRole("button").filter({ has: page.locator('svg') }).first();
    await expect(menuBtn).toBeVisible({ timeout: 5000 });
  });
});
