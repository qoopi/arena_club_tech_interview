import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import type { TestOptions } from './src/fixtures/test';

// This file is the only place that decides where tests run, who is logged in, which browsers
// are used, and how the runner behaves. Everything else in the project inherits from it.
// Values marked "init-project" were set from the answers given at project setup.

loadEnv({ quiet: true });

// 1. Environment
// TEST_ENV names one of the profiles below. A profile says which tags run there and whether
// requests to hosts other than the site are blocked. The site's URL is not here: it comes from
// BASE_URL_<NAME> in .env, so the same config serves every environment and CI.
// init-project: environments, tags per environment, hermetic mode
const PROFILES = {
  pr: { tags: '@smoke', hermetic: true },
  staging: { tags: '@smoke|@regression', hermetic: false },
  prod: { tags: '@smoke', hermetic: false },
} as const;
type Env = keyof typeof PROFILES;

function isEnv(value: string): value is Env {
  return value in PROFILES;
}

// init-project: local environment
const TEST_ENV = process.env.TEST_ENV ?? 'pr';
if (!isEnv(TEST_ENV)) {
  throw new Error(`TEST_ENV must be one of ${Object.keys(PROFILES).join(', ')}, got "${TEST_ENV}"`);
}
const BASE_URL_NAME = `BASE_URL_${TEST_ENV.toUpperCase()}`;
const BASE_URL = process.env[BASE_URL_NAME];
if (!BASE_URL) {
  throw new Error(`${BASE_URL_NAME} is missing. Copy .env.example to .env and fill it.`);
}
const profile = PROFILES[TEST_ENV];

// 2. Tags
// A run executes the profile's tags. TAGS=@cart narrows one run to a single area.
// Quarantined tests stay out unless a run asks for them by tag.
const TAGS = process.env.TAGS ?? profile.tags;
const EXCLUDE_QUARANTINE = !TAGS.includes('@quarantine');

// 3. Login
// The setup project signs in once with the session account and saves the browser state to a
// file. Every browser project starts from that file, so tests begin logged in and never type
// a password. Off in this project: login is out of scope; the mechanism stays for later.
// init-project: login
const LOGIN = false;
export const AUTH_FILE = '.playwright/auth/user.json';

// 4. Browsers
// One Playwright project per entry, with that device's settings. All of them run by default;
// BROWSERS=chromium narrows one run to some of them. To add one, add a line: firefox is
// devices['Desktop Firefox'], webkit 'Desktop Safari', iphone 'iPhone 14', android 'Pixel 7'.
// init-project: browsers
const BROWSERS = {
  chromium: devices['Desktop Chrome'],
} as const;
type Browser = keyof typeof BROWSERS;

function isBrowser(value: string): value is Browser {
  return value in BROWSERS;
}

const SELECTED = (process.env.BROWSERS ?? Object.keys(BROWSERS).join(',')).split(',').map((name) => {
  if (!isBrowser(name)) {
    throw new Error(`BROWSERS must list ${Object.keys(BROWSERS).join(', ')}, got "${name}"`);
  }
  return name;
});

// 5. Runner
// On CI a failed test gets one isolated retry, a pass on retry still fails the run, and a
// stray test.only fails it too. Locally there are no retries, so a flaky test is seen at once.
const IS_CI = !!process.env.CI;

export default defineConfig<TestOptions>({
  testDir: './tests',
  outputDir: '.playwright/test-results',
  fullyParallel: true,
  forbidOnly: IS_CI,
  failOnFlakyTests: IS_CI,
  // init-project: retries on CI
  retries: IS_CI ? 1 : 0,
  retryStrategy: 'isolated',
  // init-project: workers
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : IS_CI ? 2 : 9,
  // Every timeout lives here. A test gets 30 s; one retrying assertion 5 s; one action 10 s;
  // one navigation 15 s; a whole CI run 20 min, so it ends with a report and not a killed job.
  // init-project: timeouts
  timeout: 30_000,
  expect: { timeout: 5_000 },
  globalTimeout: IS_CI ? 20 * 60_000 : 0,
  // Locally: the terminal list and an HTML report. On CI: the same, plus annotations on the
  // pull request and a JUnit file for the test report check.
  // init-project: reporters
  reporter: IS_CI
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: '.playwright/report' }],
        ['github'],
        ['junit', { outputFile: '.playwright/results.xml' }],
      ]
    : [['list'], ['html', { open: 'never', outputFolder: '.playwright/report' }]],

  // Every browser context starts with these, so a run on a laptop and a run on CI see the same
  // page. Trace and screenshot are collected only when something fails.
  use: {
    baseURL: BASE_URL,
    hermetic: profile.hermetic,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // init-project: test id attribute
    testIdAttribute: 'data-qa',
    // init-project: locale, timezone, viewport
    locale: 'en-US',
    timezoneId: 'UTC',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // One setup project that logs in, then one project per browser that depends on it and
  // starts from the saved session. Each browser project runs only the tags of the profile.
  projects: [
    // No trace for the login: it would carry the session.
    ...(LOGIN ? [{ name: 'setup', testMatch: /.*\.setup\.ts/, use: { trace: 'off' as const } }] : []),
    ...SELECTED.map((name) => ({
      name,
      use: { ...BROWSERS[name], ...(LOGIN ? { storageState: AUTH_FILE } : {}) },
      dependencies: LOGIN ? ['setup'] : [],
      grep: new RegExp(TAGS),
      grepInvert: EXCLUDE_QUARANTINE ? /@quarantine/ : undefined,
    })),
  ],
});
