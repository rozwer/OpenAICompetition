import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:3001",
    browserName: "chromium",
    launchOptions: { channel: "chrome" },
  },
  webServer: {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    env: { GROW_MAP_DB: `.local/e2e-${Date.now()}.sqlite` },
  },
  workers: 1,
});
