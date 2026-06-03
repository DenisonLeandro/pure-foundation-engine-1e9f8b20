import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("mega_supabase_url", "");
      localStorage.removeItem("mega_analytics");
    });
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
  });

  test("KPIs de contagem estão presentes", async ({ page }) => {
    // Contas Conectadas
    await expect(page.getByText(/contas conectadas/i)).toBeVisible({ timeout: 5000 });
    // Posts Agendados
    await expect(page.getByText(/posts agendados/i)).toBeVisible();
    // Templates Visuais
    await expect(page.getByText(/templates visuais/i)).toBeVisible();
  });

  test("botão Atualizar Analytics está presente", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /atualizar analytics/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("botão Insights IA está presente", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /insights ia/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("empty state de analytics aparece quando sem dados", async ({ page }) => {
    const emptyState = page.getByText(/clique em.*atualizar analytics/i).or(
      page.getByText(/atualizar analytics.*para carregar/i)
    );
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test("quick actions linkam para páginas corretas", async ({ page }) => {
    // Criar Post
    const createPostCard = page.getByText(/criar post com ia/i);
    await expect(createPostCard).toBeVisible({ timeout: 5000 });
    await createPostCard.click();
    await expect(page).toHaveURL(/\/create/);
    await page.goBack();

    // Criar Visual
    const createVisualCard = page.getByText(/criar visual com ia/i);
    await expect(createVisualCard).toBeVisible({ timeout: 5000 });
    await createVisualCard.click();
    await expect(page).toHaveURL(/\/visuals/);
    await page.goBack();
  });

  test("grid de redes disponíveis está presente", async ({ page }) => {
    const platforms = ["Instagram", "Twitter", "LinkedIn", "Facebook"];
    for (const platform of platforms) {
      await expect(page.getByText(platform).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("card de analytics com dados mostra KPIs", async ({ page }) => {
    // Injeta dados de analytics no localStorage
    await page.addInitScript(() => {
      const mockAnalytics = [
        {
          platform: "instagram",
          username: "testuser",
          displayName: "Test User",
          profileImageUrl: "",
          followers: 1500,
          following: 300,
          posts: 45,
          engagementRate: 3.2,
          avgLikes: 48,
          avgComments: 5,
          avgViews: null,
          recentPosts: [
            { text: "Post de teste", likes: 100, comments: 10, views: 500, date: new Date().toISOString(), url: "", mediaUrl: "" },
          ],
          fetchedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem("mega_analytics", JSON.stringify(mockAnalytics));
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // KPIs agregados
    await expect(page.getByText(/1\.5K|1500/)).toBeVisible({ timeout: 5000 });
  });
});
