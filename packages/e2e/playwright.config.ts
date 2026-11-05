import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against production builds (`next start`) of the apps that need no outside services.
 * Build first: `pnpm turbo run build --filter=portfolio --filter=data-explorer --filter=kiosk`.
 */
const DB_PORT = 5544;
const reuse = !process.env.CI;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /lighthouse/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /lighthouse/ },
    // Runs alone after the others, so CPU contention doesn't skew the scores.
    { name: "lighthouse", testMatch: /lighthouse\.spec\.ts/, dependencies: ["desktop", "mobile"], fullyParallel: false },
  ],
  webServer: [
    { command: "node scripts/db.mjs", port: DB_PORT, reuseExistingServer: reuse, env: { E2E_DB_PORT: String(DB_PORT) } },
    { command: "pnpm --filter portfolio exec next start -p 3000", url: "http://localhost:3000", reuseExistingServer: reuse },
    { command: "pnpm --filter data-explorer start", url: "http://localhost:3003/explorer", reuseExistingServer: reuse },
    {
      command: "pnpm --filter kiosk start",
      url: "http://localhost:3004/kiosk",
      reuseExistingServer: reuse,
      env: { DATABASE_URL: `postgres://postgres:postgres@127.0.0.1:${DB_PORT}/postgres` },
    },
  ],
});
