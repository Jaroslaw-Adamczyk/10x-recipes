import type { PostgrestError } from "@supabase/supabase-js";

import type { SupabaseClient } from "../../../db/supabase.client";
import type { RecipeCreateCommand, RecipeCreateResultDto } from "../../../types";

export interface RecipeCreateError {
  code: "CONFLICT" | "DATABASE";
  message: string;
}

const isUniqueViolation = (error: PostgrestError) => error.code === "23505";
const buildError = (message: string, code: RecipeCreateError["code"]): RecipeCreateError => ({
  code,
  message,
});

export const createRecipe = async (
  supabase: SupabaseClient,
  userId: string,
  command: RecipeCreateCommand
): Promise<RecipeCreateResultDto> => {
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: command.title,
      cook_time_minutes: command.cook_time_minutes,
      source_url: command.source_url ?? null,
      status: "succeeded",
    })
    .select()
    .single();

  if (recipeError) {
    if (isUniqueViolation(recipeError)) {
      throw buildError("Recipe source_url already exists.", "CONFLICT");
    }

    // eslint-disable-next-line no-console
    console.error("Failed to insert recipe", recipeError);
    throw buildError("Failed to create recipe.", "DATABASE");
  }

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(
      command.ingredients.map((ingredient) => ({
        recipe_id: recipe.id,
        raw_text: ingredient.raw_text,
        normalized_name: ingredient.normalized_name,
        position: ingredient.position ?? null,
      }))
    )
    .select();

  if (ingredientsError) {
    // eslint-disable-next-line no-console
    console.error("Failed to insert ingredients", ingredientsError);
    throw buildError("Failed to create ingredients.", "DATABASE");
  }

  const { data: steps, error: stepsError } = await supabase
    .from("recipe_steps")
    .insert(
      command.steps.map((step) => ({
        recipe_id: recipe.id,
        step_text: step.step_text,
        position: step.position,
      }))
    )
    .select();

  if (stepsError) {
    // eslint-disable-next-line no-console
    console.error("Failed to insert steps", stepsError);
    throw buildError("Failed to create steps.", "DATABASE");
  }

  return {
    recipe,
    ingredients,
    steps,
  };
};
