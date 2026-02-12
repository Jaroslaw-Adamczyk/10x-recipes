import { expect, type Locator, type Page } from "@playwright/test";

export interface RecipeData {
  title: string;
  ingredients: string;
  steps: string;
  cookTime?: string;
}

export class AddRecipeModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly importTab: Locator;
  readonly manualTab: Locator;
  readonly titleInput: Locator;
  readonly ingredientsInput: Locator;
  readonly stepsInput: Locator;
  readonly cookTimeInput: Locator;
  readonly cancelButton: Locator;
  readonly createButton: Locator;
  readonly importUrlInput: Locator;
  readonly importButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId("add-recipe-modal");
    this.importTab = page.getByTestId("tab-import");
    this.manualTab = page.getByTestId("tab-manual");
    this.titleInput = page.getByTestId("input-recipe-title");
    this.ingredientsInput = page.getByTestId("input-recipe-ingredients");
    this.stepsInput = page.getByTestId("input-recipe-steps");
    this.cookTimeInput = page.getByTestId("input-recipe-cooktime");
    this.cancelButton = page.getByTestId("button-cancel");
    this.createButton = page.getByTestId("button-create-recipe");
    this.importUrlInput = page.locator("#import-url");
    this.importButton = page.getByRole("button", { name: /import recipe/i });
    this.errorMessage = page.locator(".text-destructive").first();
  }

  async expectModalToBeVisible() {
    await expect(this.modal).toBeVisible();
  }

  async expectModalToBeHidden() {
    await expect(this.modal).not.toBeVisible();
  }

  async switchToManualEntry() {
    await this.manualTab.click();
    await expect(this.titleInput).toBeVisible();
  }

  async switchToImport() {
    await this.importTab.click();
    await expect(this.importUrlInput).toBeVisible();
  }

  async fillManualRecipe(recipe: RecipeData) {
    await this.titleInput.fill(recipe.title);
    await this.ingredientsInput.fill(recipe.ingredients);
    await this.stepsInput.fill(recipe.steps);

    if (recipe.cookTime) {
      await this.cookTimeInput.fill(recipe.cookTime);
    }
  }

  async createRecipe() {
    await this.createButton.click();
  }

  async fillAndCreateManualRecipe(recipe: RecipeData) {
    await this.switchToManualEntry();
    await this.fillManualRecipe(recipe);
    await this.createRecipe();
  }

  async importRecipeFromUrl(url: string) {
    await this.switchToImport();
    await this.importUrlInput.fill(url);
    await this.importButton.click();
  }

  async cancel() {
    // Use force: true to bypass astro-dev-toolbar overlay interception
    await this.cancelButton.click({ force: true });
  }

  async expectValidationError(errorText: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(errorText);
  }

  async cancelWithConfirmation(accept = true) {
    // Set up dialog handler before clicking cancel
    this.page.once("dialog", async (dialog) => {
      if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });

    // Click cancel button which will trigger the confirmation dialog
    // Use force: true to bypass astro-dev-toolbar overlay interception
    await this.cancelButton.click({ force: true });
  }
}
