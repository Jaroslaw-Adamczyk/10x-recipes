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
  readonly cookTimeInput: Locator;
  readonly cancelButton: Locator;
  readonly createButton: Locator;
  readonly importUrlInput: Locator;
  readonly importButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId("add-recipe-modal");
    this.importTab = page.getByTestId("tab-import");
    this.manualTab = page.getByTestId("tab-manual");
    this.titleInput = page.getByTestId("input-recipe-title");
    this.cookTimeInput = page.getByTestId("input-recipe-cooktime");
    this.cancelButton = page.getByTestId("button-cancel");
    this.createButton = page.getByTestId("button-create-recipe");
    this.importUrlInput = page.locator("#import-url");
    this.importButton = page.getByRole("button", { name: /import recipe/i });
  }

  async expectModalToBeVisible() {
    await expect(this.modal).toBeVisible({ timeout: 10000 });
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

    // Fill ingredients
    const ingredientLines = recipe.ingredients.split("\n").filter((line) => line.trim() !== "");
    for (let i = 0; i < ingredientLines.length; i++) {
      const ingredientInput = this.page.getByTestId(`input-recipe-ingredient-${i}`);

      if (i > 0) {
        const prevInput = this.page.getByTestId(`input-recipe-ingredient-${i - 1}`);
        await prevInput.press("Enter");
      }
      await ingredientInput.fill(ingredientLines[i]);
    }

    // Fill steps
    const stepLines = recipe.steps.split("\n").filter((line) => line.trim() !== "");
    for (let i = 0; i < stepLines.length; i++) {
      const stepInput = this.page.getByTestId(`input-recipe-step-${i}`);

      if (i > 0) {
        const prevInput = this.page.getByTestId(`input-recipe-step-${i - 1}`);
        await prevInput.press("Enter");
      }
      await stepInput.fill(stepLines[i]);
    }

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

  /** Test ids for manual recipe form validation errors (one per field). */
  readonly validationErrorTestIds = {
    title: "validation-error-title",
    ingredients: "validation-error-ingredients",
    steps: "validation-error-steps",
    cooktime: "validation-error-cooktime",
    images: "validation-error-images",
    form: "validation-error-form",
  } as const;

  async expectValidationError(field: keyof AddRecipeModal["validationErrorTestIds"], errorText: string) {
    const error = this.page.getByTestId(this.validationErrorTestIds[field]);
    await expect(error).toBeVisible();
    await expect(error).toContainText(errorText);
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
