import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  // CI's runner has four cores: a browser for each of two workers, beside the preview server.
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    // The visitor is in Switzerland, where the fixtures are: numbers, times and
    // distances are written as en-CH writes them. Tests of other regions set their own.
    locale: 'en-CH',
    // Without the visitor's location the map opens on the covered city nearest the
    // time zone; UTC keeps the Switzerland start the tests are written for.
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --ip 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 240_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-webkit',
      use: {
        ...devices['iPhone 15'],
        // WebKit routes service-worker-controlled fetches outside Playwright's
        // request mocking. PWA behavior has its own production Chromium test.
        serviceWorkers: 'block',
      },
    },
  ],
});
