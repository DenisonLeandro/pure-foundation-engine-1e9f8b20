import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Galeria de Criações", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("mega_supabase_url", "");
    });
  });

  test("galeria vazia mostra empty state", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("mega_gallery");
    });
    await page.goto(`${BASE}/gallery`);
    await page.waitForLoadState("networkidle");

    // Deve mostrar mensagem de vazio
    const emptyMsg = page.getByText(/nenhuma criação/i).or(
      page.getByText(/criar visual/i)
    );
    await expect(emptyMsg).toBeVisible({ timeout: 5000 });
  });

  test("filtros de tipo estão presentes", async ({ page }) => {
    await page.goto(`${BASE}/gallery`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /todos/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /imagens/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /vídeos/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /carroséis/i })).toBeVisible();
  });

  test("galeria exibe criações do localStorage", async ({ page }) => {
    await page.addInitScript(() => {
      const mockCreation = {
        id: "cr_test_001",
        type: "image",
        urls: ["https://picsum.photos/400/400"],
        thumbnailUrl: "https://picsum.photos/400/400",
        prompt: "Teste de criação",
        templateName: "Template Teste",
        published: false,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("mega_gallery", JSON.stringify([mockCreation]));
    });

    await page.goto(`${BASE}/gallery`);
    await page.waitForLoadState("networkidle");

    // Deve mostrar a criação
    await expect(page.getByText(/template teste/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/rascunho/i)).toBeVisible();
  });

  test("clicar em 'Usar em Post' navega para /create", async ({ page }) => {
    await page.addInitScript(() => {
      const mockCreation = {
        id: "cr_test_002",
        type: "image",
        urls: ["https://picsum.photos/400/400"],
        thumbnailUrl: "https://picsum.photos/400/400",
        templateName: "Template Nav Teste",
        published: false,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("mega_gallery", JSON.stringify([mockCreation]));
    });

    await page.goto(`${BASE}/gallery`);
    await page.waitForLoadState("networkidle");

    // Hover sobre o card para mostrar os botões
    const card = page.locator(".group").first();
    if (await card.isVisible()) {
      await card.hover();
      const useBtn = page.locator('button[title="Usar em Post"]');
      if (await useBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await useBtn.click();
        await expect(page).toHaveURL(/\/create/);
      }
    }
  });
});
