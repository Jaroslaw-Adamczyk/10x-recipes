import type { Page } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { RecipesPage } from "./page-objects/RecipesPage";
import { TEST_USER } from "./test-data";

/**
 * Setup helper: Login and navigate to recipes page
 *
 * This is a convenience function for tests that require authentication.
 * Use this in beforeEach or at the start of tests that need a logged-in user.
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await setupAuthenticatedUser(page);
 * });
 * ```
 */
export async function setupAuthenticatedUser(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  const recipesPage = new RecipesPage(page);

  await loginPage.goto();
  await loginPage.login(TEST_USER.email, TEST_USER.password);
  await loginPage.waitForRedirect("/");
  await recipesPage.expectToBeOnRecipesPage();
}

/**
 * Setup helper: Login with custom credentials
 *
 * Use this when testing with different user accounts.
 *
 * @example
 * ```typescript
 * await setupAuthenticatedUserWithCredentials(page, 'user@test.com', 'password');
 * ```
 */
export async function setupAuthenticatedUserWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  const loginPage = new LoginPage(page);
  const recipesPage = new RecipesPage(page);

  await loginPage.goto();
  await loginPage.login(email, password);
  await loginPage.waitForRedirect("/");
  await recipesPage.expectToBeOnRecipesPage();
}
