import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:3200",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: {
      ...(process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]
        ? { executablePath: process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"] }
        : {}),
      args: ["--no-sandbox"],
    },
  },
  webServer: [
    {
      command: "python3 scripts/start-e2e-backend.py",
      url: "http://127.0.0.1:8200/health",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "npm start -- --port 3200",
      url: "http://127.0.0.1:3200/login",
      env: { BACKEND_URL: "http://127.0.0.1:8200", APP_ORIGIN: "http://127.0.0.1:3200" },
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
