import type { SupabaseClient } from "../../../db/supabase.client";
import type { RecipeUpdateCommand, RecipeUpdateResultDto } from "../../../types";

export interface RecipeUpdateError {
  code: "NOT_FOUND" | "DATABASE";
  message: string;
}

const buildError = (message: string, code: RecipeUpdateError["code"]): RecipeUpdateError => ({
  code,
  message,
});

export const updateRecipe = async (
  supabase: SupabaseClient,
  userId: string,
  recipeId: string,
  command: RecipeUpdateCommand
): Promise<RecipeUpdateResultDto> => {
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (command.title !== undefined) {
    updatePayload.title = command.title;
  }

  if (command.cook_time_minutes !== undefined) {
    updatePayload.cook_time_minutes = command.cook_time_minutes;
  }

  if (command.prep_time_minutes !== undefined) {
    updatePayload.prep_time_minutes = command.prep_time_minutes;
  }
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .update(updatePayload)
    .eq("id", recipeId)
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  if (recipeError) {
    // eslint-disable-next-line no-console
    console.error("Failed to update recipe", recipeError);
    throw buildError("Failed to update recipe.", "DATABASE");
  }

  if (!recipe) {
    throw buildError("Recipe not found.", "NOT_FOUND");
  }

  if (command.ingredients) {
    const { error: deleteIngredientsError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipeId);

    if (deleteIngredientsError) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete ingredients", deleteIngredientsError);
      throw buildError("Failed to update ingredients.", "DATABASE");
    }

    if (command.ingredients.length > 0) {
      const { error: insertIngredientsError } = await supabase.from("recipe_ingredients").insert(
        command.ingredients.map((ingredient) => ({
          recipe_id: recipeId,
          raw_text: ingredient.raw_text,
          normalized_name: ingredient.normalized_name,
          position: ingredient.position ?? null,
        }))
      );

      if (insertIngredientsError) {
        // eslint-disable-next-line no-console
        console.error("Failed to insert ingredients", insertIngredientsError);
        throw buildError("Failed to update ingredients.", "DATABASE");
      }
    }
  }

  if (command.steps) {
    const { error: deleteStepsError } = await supabase.from("recipe_steps").delete().eq("recipe_id", recipeId);

    if (deleteStepsError) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete steps", deleteStepsError);
      throw buildError("Failed to update steps.", "DATABASE");
    }

    if (command.steps.length > 0) {
      const { error: insertStepsError } = await supabase.from("recipe_steps").insert(
        command.steps.map((step) => ({
          recipe_id: recipeId,
          step_text: step.step_text,
          position: step.position,
        }))
      );

      if (insertStepsError) {
        // eslint-disable-next-line no-console
        console.error("Failed to insert steps", insertStepsError);
        throw buildError("Failed to update steps.", "DATABASE");
      }
    }
  }

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("position", { ascending: true });

  if (ingredientsError) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch ingredients", ingredientsError);
    throw buildError("Failed to fetch updated ingredients.", "DATABASE");
  }

  const { data: steps, error: stepsError } = await supabase
    .from("recipe_steps")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("position", { ascending: true });

  if (stepsError) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch steps", stepsError);
    throw buildError("Failed to fetch updated steps.", "DATABASE");
  }

  return {
    recipe,
    ingredients: ingredients ?? [],
    steps: steps ?? [],
  };
};
