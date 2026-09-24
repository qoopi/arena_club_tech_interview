import { type Page } from '@playwright/test';

export abstract class BasePage {
  abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(this.path);
    await this.expectLoaded();
  }

  abstract expectLoaded(): Promise<void>;
}
