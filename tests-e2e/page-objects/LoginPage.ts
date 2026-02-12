import { expect, type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("input-email");
    this.passwordInput = page.getByTestId("input-password");
    this.submitButton = page.getByTestId("submit-button");
    this.formError = page.locator('[role="alert"]');
    this.registerLink = page.locator('a[href="/auth/register"]');
  }

  async goto() {
    await this.page.goto("/auth/login");
  }

  async login(email: string, password: string) {
    // Wait for the page to be fully loaded and stable
    await this.page.waitForTimeout(1000);

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    // Wait for either redirect to home or an error message to appear
    await Promise.race([
      this.page.waitForURL("/", { timeout: 5000 }).catch(),
      this.formError.waitFor({ state: "visible", timeout: 5000 }).catch(),
    ]);
  }

  async waitForRedirect(url = "/") {
    await this.page.waitForURL(url);
  }

  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL(/\/auth\/login/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async expectFormError(errorMessage: string) {
    await expect(this.formError).toBeVisible();
    await expect(this.formError).toContainText(errorMessage);
  }
}
