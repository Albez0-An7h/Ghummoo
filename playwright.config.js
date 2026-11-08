// End-to-end tests: npm run test:e2e  (builds the client, starts a seeded production server)
const { defineConfig, devices } = require('@playwright/test');

const APP = Number(process.env.E2E_APP_PORT || 5198);
const AI = Number(process.env.E2E_AI_PORT || 5199);

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.js/,
  fullyParallel: false,
  workers: 1, // journeys share one seeded database
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'e2e/results.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${APP}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    { command: 'node e2e/ai-stub.js', port: AI, reuseExistingServer: false, timeout: 20_000 },
    { command: 'npm run build && node e2e/start-app.js', url: `http://127.0.0.1:${APP}/api/health`, reuseExistingServer: false, timeout: 240_000, stdout: 'pipe' },
  ],
});
