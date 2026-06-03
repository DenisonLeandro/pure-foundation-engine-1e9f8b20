import { test, expect } from "@playwright/test";

/**
 * Testes de navegação — verifica que todas as rotas carregam sem erro
 * e que elementos básicos estão presentes.
 *
 * Nota: como a plataforma usa auth + Supabase, os testes assumem que:
 * - A app está rodando em localhost:5173
 * - Supabase não está configurado (isAuthEnabled = false → bypass de auth)
 */

const BASE = "http://localhost:5173";

// Rotas que existem dentro do layout autenticado
const APP_ROUTES = [
  { path: "/dashboard", title: "Dashboard" },
  { path: "/create", title: "Criar Post" },
  { path: "/visuals", title: "Criar Visual" },
  { path: "/gallery", title: "Galeria" },
  { path: "/schedule", title: "Agendamentos" },
  { path: "/accounts", title: "Contas" },
  { path: "/brands", title: "Marcas" },
  { path: "/sources", title: "Fontes" },
  { path: "/insights", title: "Insights" },
  { path: "/autopilot", title: "Autopilot" },
];

test.describe("Navegação básica", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase como não configurado para bypassar auth
    await page.addInitScript(() => {
      localStorage.setItem("mega_supabase_url", "");
    });
  });

  test("raiz / redireciona", async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Deve redirecionar para /login ou /dashboard dependendo do estado de auth
    await expect(page).toHaveURL(/login|dashboard|setup/);
  });

  for (const route of APP_ROUTES) {
    test(`${route.path} carrega sem erro de página`, async ({ page }) => {
      await page.goto(`${BASE}${route.path}`);
      // Não deve ter erro 404 ou tela em branco
      await expect(page.locator("body")).not.toBeEmpty();
      // Não deve ter erro de "Something went wrong"
      const bodyText = await page.locator("body").textContent();
      expect(bodyText).not.toContain("Something went wrong");
    });
  }
});
