import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — Social Hub
 *
 * Testes E2E cobrem: navegação, criar post, galeria, marcas, dashboard, setup.
 * Para rodar: npx playwright test
 * Para rodar com UI: npx playwright test --ui
 * Para ver report: npx playwright show-report
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Dev server — inicia automaticamente antes dos testes
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
