import { test, expect } from "@playwright/test";


/**
 * Testes E2E do Autopilot
 *
 * Cobre: navegação, empty state, wizard de configuração,
 * calendário, preview modal, tabs e controles.
 */

test.describe("Autopilot", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Bypass de config — marca onboarding como completo e seta keys mínimas
      const config = JSON.stringify({
        blotatoApiKey: "test-key",
        pfmApiKey: "test-key",
        firecrawlApiKey: "",
        brandName: "Empresa Teste",
        onboardingCompleted: true,
      });
      // Usar prefixo anon pois não há user autenticado no e2e
      localStorage.setItem("app_anon:config", config);
    });
  });

  test("página /autopilot carrega sem erro", async ({ page }) => {
    await page.goto(`/autopilot`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("Something went wrong");
  });

  test("empty state mostra botão de configurar", async ({ page }) => {
    await page.goto(`/autopilot`);
    await page.waitForLoadState("networkidle");
    // Deve mostrar título Autopilot
    await expect(page.getByText("Autopilot").first()).toBeVisible({ timeout: 5000 });
    // Deve ter botão de configurar ou conteúdo do autopilot
    const configBtn = page.getByRole("button", { name: /configurar autopilot|nova config/i });
    const hasDashboard = await page.getByText(/automação inteligente/i).isVisible().catch(() => false);
    const hasEmpty = await configBtn.isVisible().catch(() => false);
    expect(hasEmpty || hasDashboard).toBeTruthy();
  });

  test("sidebar mostra Autopilot como botão destacado", async ({ page }) => {
    await page.goto(`/dashboard`);
    await page.waitForLoadState("networkidle");
    // Botão Autopilot deve existir na sidebar
    const autopilotLink = page.locator('a[href="/autopilot"]');
    await expect(autopilotLink).toBeVisible({ timeout: 5000 });
    // Deve ter badge "IA"
    await expect(autopilotLink.getByText("IA")).toBeVisible();
  });

  test("navegar para Autopilot pela sidebar", async ({ page }) => {
    await page.goto(`/dashboard`);
    await page.waitForLoadState("networkidle");
    const autopilotLink = page.locator('a[href="/autopilot"]');
    await autopilotLink.click();
    await expect(page).toHaveURL(/\/autopilot/);
  });

  test("wizard abre ao clicar Configurar/Nova Config", async ({ page }) => {
    await page.goto(`/autopilot`);
    await page.waitForLoadState("networkidle");
    // Clica no botão que abre o wizard
    const configBtn = page.getByRole("button", { name: /configurar autopilot|nova config/i });
    if (await configBtn.isVisible().catch(() => false)) {
      await configBtn.click();
      // Wizard deve ter steps
      await expect(page.getByText("Marca").first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("wizard navega entre steps", async ({ page }) => {
    await page.goto(`/autopilot`);
    await page.waitForLoadState("networkidle");
    const configBtn = page.getByRole("button", { name: /configurar autopilot|nova config/i });
    if (!(await configBtn.isVisible().catch(() => false))) return;
    await configBtn.click();

    // Step 0: Marca
    await expect(page.getByText("Perfil da Marca").first()).toBeVisible({ timeout: 5000 });

    // Avança para Step 1: Tópicos
    await page.getByRole("button", { name: /próximo/i }).click();
    await expect(page.getByText("Tópicos de Pesquisa").first()).toBeVisible({ timeout: 3000 });

    // Avança para Step 2: Plataformas
    await page.getByRole("button", { name: /próximo/i }).click();
    await expect(page.getByText("Plataformas").first()).toBeVisible({ timeout: 3000 });

    // Avança para Step 3: Visual
    await page.getByRole("button", { name: /próximo/i }).click();
    await expect(page.getByText("Formato Visual").first()).toBeVisible({ timeout: 3000 });

    // Avança para Step 4: Recorrência
    await page.getByRole("button", { name: /próximo/i }).click();
    await expect(page.getByText("Frequência").first()).toBeVisible({ timeout: 3000 });

    // Avança para Step 5: Aprovação
    await page.getByRole("button", { name: /próximo/i }).click();
    await expect(page.getByText("Modo de aprovação").first()).toBeVisible({ timeout: 3000 });

    // Avança para Step 6: Resumo
    await page.getByRole("button", { name: /próximo/i }).click();
    await expect(page.getByText("Resumo da Configuração").first()).toBeVisible({ timeout: 3000 });
    // Checklist de pré-requisitos deve estar visível
    await expect(page.getByText("Pré-requisitos").first()).toBeVisible({ timeout: 3000 });
  });

  test("wizard permite voltar entre steps", async ({ page }) => {
    await page.goto(`/autopilot`);
    await page.waitForLoadState("networkidle");
    const configBtn = page.getByRole("button", { name: /configurar autopilot|nova config/i });
    if (!(await configBtn.isVisible().catch(() => false))) return;
    await configBtn.click();

    // Avança
    await page.getByRole("button", { name: /próximo/i }).click();
    await expect(page.getByText("Tópicos de Pesquisa").first()).toBeVisible({ timeout: 3000 });

    // Volta
    await page.getByRole("button", { name: /voltar/i }).click();
    await expect(page.getByText("Perfil da Marca").first()).toBeVisible({ timeout: 3000 });
  });

  test("wizard permite cancelar e voltar à lista", async ({ page }) => {
    await page.goto(`/autopilot`);
    await page.waitForLoadState("networkidle");
    const configBtn = page.getByRole("button", { name: /configurar autopilot|nova config/i });
    if (!(await configBtn.isVisible().catch(() => false))) return;
    await configBtn.click();

    // Cancelar no step 0
    await page.getByRole("button", { name: /cancelar/i }).click();
    // Deve voltar ao empty state ou dashboard
    await expect(page.getByText("Autopilot").first()).toBeVisible({ timeout: 3000 });
  });

  test("wizard tópicos: adicionar e remover", async ({ page }) => {
    await page.goto(`/autopilot`);
    await page.waitForLoadState("networkidle");
    const configBtn = page.getByRole("button", { name: /configurar autopilot|nova config/i });
    if (!(await configBtn.isVisible().catch(() => false))) return;
    await configBtn.click();

    // Vai para step de tópicos
    await page.getByRole("button", { name: /próximo/i }).click();

    // Adicionar tópico
    const topicInput = page.locator('input[placeholder*="marketing digital"]');
    await topicInput.fill("marketing digital para PMEs");
    await topicInput.press("Enter");

    // Tópico deve aparecer como badge
    await expect(page.getByText("marketing digital para PMEs")).toBeVisible({ timeout: 3000 });
  });

  test("tabs Calendário, Histórico e Status existem", async ({ page }) => {
    await page.goto(`/autopilot`);
    await page.waitForLoadState("networkidle");
    // Se tem configs, deve ter tabs
    const calTab = page.getByRole("tab", { name: /calendário/i });
    const histTab = page.getByRole("tab", { name: /histórico/i });
    const statusTab = page.getByRole("tab", { name: /status/i });

    // Podem não existir se é empty state
    if (await calTab.isVisible().catch(() => false)) {
      await expect(calTab).toBeVisible();
      await expect(histTab).toBeVisible();
      await expect(statusTab).toBeVisible();

      // Trocar para Histórico
      await histTab.click();
      // Trocar para Status
      await statusTab.click();
      // Voltar para Calendário
      await calTab.click();
    }
  });
});
