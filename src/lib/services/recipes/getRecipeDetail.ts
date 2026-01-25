import type { SupabaseClient } from "../../../db/supabase.client";
import type { RecipeDetailDto, RecipeImportDto } from "../../../types";

export interface RecipeDetailError {
  code: "NOT_FOUND" | "DATABASE";
  message: string;
}

const buildError = (message: string, code: RecipeDetailError["code"]): RecipeDetailError => ({
  code,
  message,
});

const stripImportUserId = (recipeImport: (RecipeImportDto & { user_id?: string }) | null): RecipeImportDto | null => {
  if (!recipeImport) {
    return null;
  }

  const { user_id: _userId, ...rest } = recipeImport;
  void _userId;
  return rest;
};

export const getRecipeDetail = async (
  supabase: SupabaseClient,
  userId: string,
  recipeId: string
): Promise<RecipeDetailDto> => {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_ingredients(*),
      recipe_steps(*),
      recipe_imports(*)
    `
    )
    .eq("id", recipeId)
    .eq("user_id", userId)
    .order("position", { referencedTable: "recipe_ingredients", ascending: true })
    .order("position", { referencedTable: "recipe_steps", ascending: true })
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch recipe detail", error);
    throw buildError("Failed to fetch recipe detail.", "DATABASE");
  }

  if (!data) {
    throw buildError("Recipe not found.", "NOT_FOUND");
  }

  const { recipe_ingredients, recipe_steps, recipe_imports, ...recipe } = data;
  const recipeImport = recipe_imports?.[0] ?? null;

  return {
    recipe,
    ingredients: recipe_ingredients ?? [],
    steps: recipe_steps ?? [],
    import: stripImportUserId(recipeImport),
  };
};
