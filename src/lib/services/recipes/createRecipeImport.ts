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

import { extractRecipeData } from "./extractRecipeData";

export const createRecipeImport = async (
  supabase: SupabaseClient,
  userId: string,
  command: RecipeImportCreateCommand
): Promise<RecipeImportCreateResult> => {
  // 1. Create placeholders
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: "Importing recipe...",
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
    console.error("Failed to insert recipe placeholder", recipeError);
    throw buildError("Failed to create recipe placeholder.", "DATABASE");
  }

  const { data: recipeImport, error: recipeImportError } = await supabase
    .from("recipe_imports")
    .insert({
      user_id: userId,
      source_url: command.source_url,
      status: "processing",
      attempt_count: 1,
      recipe_id: recipe.id,
    })
    .select()
    .single();

  if (recipeImportError) {
    console.error("Failed to insert recipe import", recipeImportError);
    throw buildError("Failed to create recipe import.", "DATABASE");
  }

  // 2. Start background extraction (simulated for MVP)
  // In a real app, this would be a background job.
  // For now, we'll run it and update the records.
  (async () => {
    try {
      // eslint-disable-next-line no-console
      console.log(`Starting background extraction for: ${command.source_url}`);

      // Fetch the content from the URL (simplified for MVP)
      const response = await fetch(command.source_url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch source URL: ${response.statusText} (${response.status})`);
      }

      const html = await response.text();

      // Extract data using LLM
      const extracted = await extractRecipeData(html);

      // eslint-disable-next-line no-console
      console.log(`Successfully extracted recipe: ${extracted.title}`);

      // Update recipe
      const { error: updateError } = await supabase
        .from("recipes")
        .update({
          title: extracted.title,
          cook_time_minutes: extracted.cook_time_minutes,
          prep_time_minutes: extracted.prep_time_minutes,
          status: "succeeded",
        })
        .eq("id", recipe.id);

      if (updateError) throw updateError;

      // Insert ingredients
      if (extracted.ingredients.length > 0) {
        const { error: ingError } = await supabase.from("recipe_ingredients").insert(
          extracted.ingredients.map((ing, index) => ({
            recipe_id: recipe.id,
            raw_text: ing.raw_text,
            normalized_name: ing.normalized_name,
            position: index,
          }))
        );
        if (ingError) throw ingError;
      }

      // Insert steps
      if (extracted.steps.length > 0) {
        const { error: stepError } = await supabase.from("recipe_steps").insert(
          extracted.steps.map((step, index) => ({
            recipe_id: recipe.id,
            step_text: step.step_text,
            position: index,
          }))
        );
        if (stepError) throw stepError;
      }

      // Update import record
      await supabase
        .from("recipe_imports")
        .update({
          status: "succeeded",
          metadata: { ...extracted },
        })
        .eq("id", recipeImport.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Background extraction failed for ${command.source_url}:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      await supabase
        .from("recipes")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", recipe.id);

      await supabase
        .from("recipe_imports")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", recipeImport.id);
    }
  })();

  return {
    recipe,
    import: stripImportUserId(recipeImport),
  };
};
