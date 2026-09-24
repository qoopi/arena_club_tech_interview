import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

export type TestOptions = { hermetic: boolean };
type Pages = { homePage: HomePage };

export const test = base.extend<TestOptions & Pages>({
  hermetic: [false, { option: true }],

  // Hermetic mode: only the base URL's host is reached; every other request is dropped.
  page: async ({ page, baseURL, hermetic }, use) => {
    if (hermetic && baseURL) {
      const ownHost = new URL(baseURL).host;
      await page.route(
        (url) => url.host !== ownHost,
        (route) => route.abort(),
      );
    }
    await use(page);
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

export { expect };
