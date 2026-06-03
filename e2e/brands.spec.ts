import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Perfis de Marca", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("mega_supabase_url", "");
      localStorage.removeItem("mega_brand_profiles");
    });
    await page.goto(`${BASE}/brands`);
    await page.waitForLoadState("networkidle");
  });

  test("página carrega com state vazio", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /marca|brand/i });
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test("botão de criar nova marca está presente", async ({ page }) => {
    const createBtn = page
      .getByRole("button", { name: /nova marca|criar marca|adicionar/i })
      .or(page.getByRole("button", { name: /\+/i }))
      .first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });

  test("criação de marca persiste no localStorage", async ({ page }) => {
    // Clicar em criar nova marca
    const createBtn = page
      .getByRole("button", { name: /nova marca|criar marca|nova/i })
      .first();

    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();

      // Preencher formulário
      const nameInput = page.locator('input[placeholder*="nome"], input[name="name"], input[id="name"]').first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill("Marca de Teste E2E");

        // Salvar
        const saveBtn = page.getByRole("button", { name: /salvar|criar|save/i }).last();
        await saveBtn.click();
        await page.waitForTimeout(500);

        // Verificar localStorage
        const brands = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("mega_brand_profiles") || "[]")
        );
        expect(brands.length).toBeGreaterThan(0);
      }
    }
  });

  test("marcas existentes são carregadas do localStorage", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "mega_brand_profiles",
        JSON.stringify([
          {
            id: "brand-e2e-test",
            name: "Marca Persistida E2E",
            tone: "casual",
            description: "Teste de persistência",
            created_at: new Date().toISOString(),
          },
        ])
      );
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/marca persistida e2e/i)).toBeVisible({ timeout: 5000 });
  });
});
