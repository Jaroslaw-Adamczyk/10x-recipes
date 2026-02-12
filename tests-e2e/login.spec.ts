import { test, expect } from "./fixtures";
import { TEST_USER } from "./test-data";

test.describe("Login Flow", () => {
  test("should login successfully with valid credentials", async ({ loginPage, recipesPage }) => {
    await loginPage.goto();
    await loginPage.expectToBeOnLoginPage();

    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForRedirect("/");

    await recipesPage.expectToBeOnRecipesPage();
  });

  test("should show error with invalid email format", async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.emailInput.fill("invalid-email");
    await loginPage.passwordInput.fill("password123");
    await loginPage.submitButton.click();

    // Form validation should prevent submission
    await loginPage.expectToBeOnLoginPage();
  });

  test("should show error with empty fields", async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.submitButton.click();

    // Should remain on login page
    await loginPage.expectToBeOnLoginPage();
  });

  test("should show error with incorrect credentials", async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.login("wrong@example.com", "wrongpassword");

    // Should show error message
    await loginPage.expectToBeOnLoginPage();
    await expect(loginPage.formError).toBeVisible();
  });

  test("should have link to register page", async ({ loginPage }) => {
    await loginPage.goto();

    await expect(loginPage.registerLink).toBeVisible();
    await expect(loginPage.registerLink).toHaveAttribute("href", "/auth/register");
  });
});
