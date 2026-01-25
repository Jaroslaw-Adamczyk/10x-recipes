import type { PostgrestError } from "@supabase/supabase-js";

import type { SupabaseClient } from "../../../db/supabase.client";
import type { RecipeDto, RecipeImportCreateCommand, RecipeImportDto } from "../../../types";

export interface RecipeImportCreateError {
  code: "CONFLICT" | "DATABASE";
  message: string;
}

interface RecipeImportCreateResult {
  recipe: RecipeDto;
  import: RecipeImportDto;
}

const isUniqueViolation = (error: PostgrestError) => error.code === "23505";
const buildError = (message: string, code: RecipeImportCreateError["code"]): RecipeImportCreateError => ({
  code,
  message,
});

const stripImportUserId = (recipeImport: RecipeImportDto & { user_id?: string }): RecipeImportDto => {
  const { user_id: _userId, ...rest } = recipeImport;
  void _userId;
  return rest;
};

/**
 * Creates a processing recipe placeholder and its import record.
 */
export const createRecipeImport = async (
  supabase: SupabaseClient,
  userId: string,
  command: RecipeImportCreateCommand
): Promise<RecipeImportCreateResult> => {
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: "Importing recipe",
      cook_time_minutes: null,
      source_url: command.source_url,
      status: "processing",
    })
    .select()
    .single();

  if (recipeError) {
    if (isUniqueViolation(recipeError)) {
      throw buildError("Recipe source_url already exists.", "CONFLICT");
    }

    // eslint-disable-next-line no-console
    console.error("Failed to insert recipe placeholder", recipeError);
    throw buildError("Failed to create recipe placeholder.", "DATABASE");
  }

  const { data: recipeImport, error: recipeImportError } = await supabase
    .from("recipe_imports")
    .insert({
      user_id: userId,
      source_url: command.source_url,
      status: "processing",
      attempt_count: 0,
      recipe_id: recipe.id,
    })
    .select()
    .single();

  if (recipeImportError) {
    if (isUniqueViolation(recipeImportError)) {
      throw buildError("Recipe import already exists for this URL.", "CONFLICT");
    }

    // eslint-disable-next-line no-console
    console.error("Failed to insert recipe import", recipeImportError);
    throw buildError("Failed to create recipe import.", "DATABASE");
  }

  return {
    recipe,
    import: stripImportUserId(recipeImport),
  };
};
