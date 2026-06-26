import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/admin/e2e',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: 'http://localhost:5175',
    headless: true,
  },
  webServer: [
    {
      command: 'pnpm --filter @platform/bff dev',
      port: 3000,
      cwd: __dirname,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'pnpm --filter @platform/admin dev',
      port: 5175,
      cwd: __dirname,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
