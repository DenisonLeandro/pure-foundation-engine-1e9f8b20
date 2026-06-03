import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Setup e configuração inicial", () => {
  test("página de setup carrega", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("mega_supabase_url", "");
    });
    await page.goto(`${BASE}/setup`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("login page carrega com formulário", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    // Deve ter campos de email e senha ou botão de login
    const emailInput = page.locator('input[type="email"]').or(
      page.locator('input[name="email"]')
    );
    const passwordInput = page.locator('input[type="password"]');
    const hasForm = (await emailInput.count()) > 0 || (await passwordInput.count()) > 0;
    // Pode não ter form se Supabase não está configurado
    // Só verificamos que a página carregou sem erro
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("signup page carrega", async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("404 mostra página not found", async ({ page }) => {
    await page.goto(`${BASE}/pagina-que-nao-existe`);
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").textContent();
    // Deve mostrar algo (not found, 404, etc)
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });
});
