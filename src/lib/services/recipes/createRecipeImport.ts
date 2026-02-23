import type { PostgrestError } from "@supabase/supabase-js";

import type { SupabaseClient } from "../../../db/supabase.client";
import type { RecipeDto, RecipeImportCreateCommand, RecipeImportDto } from "../../../types";

import { extractRecipeData } from "./extractRecipeData";

export interface RecipeImportCreateError {
  code: "CONFLICT" | "DATABASE";
  message: string;
}

interface RecipeImportCreateResult {
  recipe: RecipeDto;
  import: RecipeImportDto;
}

const BUCKET = "recipes-images";
const FETCH_IMAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
} as const;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

function getExtension(mimetype: string): string | null {
  const ext = MIME_TO_EXT[mimetype];
  return ext ?? null;
}

async function fetchAndUploadRecipeImage(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string,
  imageUrl: string,
  position: number
): Promise<void> {
  const res = await fetch(imageUrl, { headers: FETCH_IMAGE_HEADERS });
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (!contentType || !ALLOWED_MIME.has(contentType)) {
    throw new Error(`Unsupported image type: ${contentType ?? "unknown"}`);
  }
  const ext = getExtension(contentType);
  if (!ext) {
    throw new Error(`No extension for type: ${contentType}`);
  }
  const buffer = await res.arrayBuffer();
  const path = `${userId}/${recipeId}/import-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }
  const { error: insertError } = await supabase.from("recipe_images").insert({
    recipe_id: recipeId,
    storage_path: path,
    position,
  });
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(`DB insert failed: ${insertError.message}`);
  }
}

type WaitUntil = (promise: Promise<unknown>) => void;

export const createRecipeImport = async (
  supabase: SupabaseClient,
  userId: string,
  command: RecipeImportCreateCommand,
  waitUntil: WaitUntil
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
      attempt_count: 1,
      recipe_id: recipe.id,
    })
    .select()
    .single();

  if (recipeImportError) {
    throw buildError("Failed to create recipe import.", "DATABASE");
  }

  // 2. Start background extraction via waitUntil to keep the worker alive
  const backgroundWork = (async () => {
    try {
      // eslint-disable-next-line no-console
      console.log(`Starting background extraction for: ${command.source_url}`);

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

      // Insert images: fetch each URL, upload to storage, insert recipe_images
      const imageUrls = (extracted as { images?: string[] }).images ?? [];
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        if (!url || typeof url !== "string") continue;
        try {
          await fetchAndUploadRecipeImage(supabase, userId, recipe.id, url, i);
        } catch (imgErr) {
          // eslint-disable-next-line no-console
          console.warn(`Skipping recipe image ${i + 1}/${imageUrls.length} (${url}):`, imgErr);
        }
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

  waitUntil(backgroundWork);

  return {
    recipe,
    import: stripImportUserId(recipeImport),
  };
};
