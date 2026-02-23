import { test, expect } from "./fixtures";
import { SAMPLE_RECIPES, createUniqueRecipe } from "./test-data";

test.describe("Recipe Search Flow", () => {
  test.beforeEach(async ({ recipesPage }) => {
    // Navigate to recipes page before each test
    await recipesPage.goto();
    await recipesPage.expectToBeOnRecipesPage();
  });

  test("should search recipes by ingredient", async ({ recipesPage }) => {
    // Create a recipe with unique ingredients
    const recipe = createUniqueRecipe(SAMPLE_RECIPES.margaritaPizza);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe);
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Search for the recipe by ingredient
    await recipesPage.searchByIngredient("mozzarella");

    // Recipe should be visible in results
    await recipesPage.expectRecipeInList(recipe.title);
  });

  test("should show no results message when no recipes match", async ({ recipesPage }) => {
    // Search for non-existent ingredient
    await recipesPage.searchByIngredient("unicornmeat");

    await recipesPage.page.waitForTimeout(100);
    // Should show no matches state
    await recipesPage.expectEmptyState("no-matches");
  });

  test("should clear search and show all recipes", async ({ recipesPage }) => {
    // Create a recipe
    const recipe = createUniqueRecipe(SAMPLE_RECIPES.bananaBread);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe);
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Search for specific ingredient
    await recipesPage.searchByIngredient("bananas");
    await recipesPage.expectRecipeInList(recipe.title);

    // Clear search
    await recipesPage.clearSearch();

    // Should show all recipes again
    await recipesPage.expectRecipeInList(recipe.title);
  });

  test("should be case-insensitive when searching", async ({ recipesPage }) => {
    // Create a recipe
    const recipe = createUniqueRecipe(SAMPLE_RECIPES.greekSalad);
    await recipesPage.openAddRecipeModal();
    await recipesPage.addRecipeModal.fillAndCreateManualRecipe(recipe);
    await recipesPage.addRecipeModal.expectModalToBeHidden();

    // Search with different cases
    await recipesPage.searchByIngredient("CUCUMBER");
    await recipesPage.expectRecipeInList(recipe.title);

    await recipesPage.clearSearch();

    await recipesPage.searchByIngredient("CuCuMbEr");
    await recipesPage.expectRecipeInList(recipe.title);
  });

  test("should handle empty search submission", async ({ recipesPage }) => {
    // Try to search with empty input
    await recipesPage.searchInput.fill("");
    await recipesPage.searchButton.click();

    // Should show helper text or remain on current view
    await expect(recipesPage.searchInput).toBeVisible();
  });
});
