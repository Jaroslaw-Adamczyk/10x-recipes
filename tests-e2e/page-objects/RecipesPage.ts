import { expect, type Locator, type Page } from "@playwright/test";
import { AddRecipeModal } from "./AddRecipeModal";

export class RecipesPage {
  readonly page: Page;
  readonly addRecipeButton: Locator;
  readonly refreshButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;
  readonly recipeList: Locator;
  readonly recipeItems: Locator;
  readonly emptyState: Locator;
  readonly errorBanner: Locator;
  readonly addRecipeModal: AddRecipeModal;

  constructor(page: Page) {
    this.page = page;
    this.addRecipeButton = page.getByTestId("add-recipe-button");
    this.refreshButton = page.getByRole("button", { name: /refresh/i });
    this.searchInput = page.locator('input[type="text"]').first();
    this.searchButton = page.getByRole("button", { name: /search/i });
    this.clearButton = page.getByRole("button", { name: /clear/i });
    this.recipeList = page.getByTestId("recipe-list");
    this.recipeItems = page.getByTestId("recipe-item");
    this.emptyState = page.locator(".border-dashed");
    this.errorBanner = page.locator('[role="alert"]');
    this.addRecipeModal = new AddRecipeModal(page);
  }

  async goto() {
    await this.page.goto("/");
  }

  async expectToBeOnRecipesPage() {
    await expect(this.page).toHaveURL("/");
    await expect(this.page).toHaveTitle(/Recipes/);
    await expect(this.addRecipeButton).toBeVisible();
    await expect(this.recipeList).toBeVisible();
  }

  async openAddRecipeModal() {
    await expect(this.addRecipeButton).toBeVisible();
    await expect(this.addRecipeButton).toBeEnabled();
    await this.page.waitForTimeout(300);
    await this.addRecipeButton.click();
    await this.page.waitForTimeout(100);
    await this.addRecipeModal.expectModalToBeVisible();
  }

  async refreshRecipes() {
    await this.refreshButton.click();
  }

  async searchByIngredient(ingredient: string) {
    await this.searchInput.isEditable();
    await this.page.waitForTimeout(100);
    await this.searchInput.fill(ingredient);
    await this.searchButton.click();
  }

  async clearSearch() {
    await this.clearButton.click();
  }

  async expectRecipeInList(recipeTitle: string) {
    await expect(this.recipeList).toBeVisible();
    await expect(this.page.getByText(recipeTitle)).toBeVisible();
  }

  async expectRecipeNotInList(recipeTitle: string) {
    await expect(this.page.getByText(recipeTitle)).not.toBeVisible();
  }

  async expectRecipeCount(count: number) {
    await expect(this.recipeItems).toHaveCount(count);
  }

  async expectAtLeastOneRecipe() {
    await expect(this.recipeList).toBeVisible();
    await expect(this.recipeItems.first()).toBeVisible();
  }

  async expectEmptyState(variant: "no-recipes" | "no-matches") {
    await expect(this.emptyState).toBeVisible();

    if (variant === "no-recipes") {
      await expect(this.emptyState).toContainText(/no recipes yet/i);
    } else {
      await expect(this.emptyState).toContainText(/no matching recipes/i);
    }
  }

  async expectIngredientInPreview(ingredient: string) {
    await this.page.waitForTimeout(1000);
    const ingredientText = this.page.getByText(ingredient);
    await expect(ingredientText.first()).toBeVisible();
  }

  async clickRecipe(recipeTitle: string) {
    await this.page.getByRole("button", { name: `Open recipe ${recipeTitle}` }).click();
  }

  async deleteRecipe(recipeTitle: string) {
    const recipeCard = this.page.getByRole("button", { name: new RegExp(recipeTitle, "i") });
    const deleteButton = recipeCard.locator("..").getByRole("button", { name: /delete/i });
    await deleteButton.click();
  }

  async expectErrorBanner(errorMessage: string) {
    await expect(this.errorBanner).toBeVisible();
    await expect(this.errorBanner).toContainText(errorMessage);
  }

  async dismissError() {
    const dismissButton = this.errorBanner.getByRole("button", { name: /dismiss/i });
    await dismissButton.click();
    await expect(this.errorBanner).not.toBeVisible();
  }
}
