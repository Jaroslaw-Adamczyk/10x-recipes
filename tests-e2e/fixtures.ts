import { test as base } from "@playwright/test";
import { LoginPage, RecipesPage } from "./page-objects";

interface PageFixtures {
  loginPage: LoginPage;
  recipesPage: RecipesPage;
}

/**
 * Extended Playwright test with page object fixtures
 * Usage:
 *   test('my test', async ({ loginPage, recipesPage }) => {
 *     await loginPage.goto();
 *     await loginPage.login('user@example.com', 'password');
 *     await recipesPage.expectToBeOnRecipesPage();
 *   });
 */
export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  recipesPage: async ({ page }, use) => {
    const recipesPage = new RecipesPage(page);
    await use(recipesPage);
  },
});

export { expect } from "@playwright/test";
