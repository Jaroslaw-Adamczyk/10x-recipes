import { test, expect } from "@playwright/test";

test("root redirects to recipes when authenticated", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/recipes/);
  await expect(page).toHaveTitle(/Recipes/);
});
