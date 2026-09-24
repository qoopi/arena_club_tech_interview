import { test, expect } from '../../src/fixtures/test';

// template smoke, no plan id: proves the base URL answers before any test work
test('the site answers at the base url', { tag: '@smoke' }, async ({ page, homePage }) => {
  // Arrange
  // Act
  const response = await page.goto(homePage.path);
  // Assert
  expect(response?.ok(), 'response status is 2xx').toBe(true);
  await homePage.expectLoaded();
});
