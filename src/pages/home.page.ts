import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  readonly path = '/';

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/\S/);
  }
}
