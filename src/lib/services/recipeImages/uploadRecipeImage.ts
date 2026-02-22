import type { SupabaseClient } from "../../../db/supabase.client";
import type { RecipeImageWithUrlDto } from "../../../types";

const BUCKET = "recipes-images";
const SIGNED_URL_EXPIRY_SEC = 300;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface UploadRecipeImageInput {
  file: ArrayBuffer | Buffer;
  mimetype: string;
  originalFilename?: string;
}

export interface UploadRecipeImageError {
  code: "NOT_FOUND" | "INVALID_FILE" | "DATABASE" | "STORAGE";
  message: string;
}

const buildError = (message: string, code: UploadRecipeImageError["code"]): UploadRecipeImageError => ({
  code,
  message,
});

function getExtension(mimetype: string): string | null {
  const ext = MIME_TO_EXT[mimetype];
  return ext ?? null;
}

export const uploadRecipeImage = async (
  supabase: SupabaseClient,
  userId: string,
  recipeId: string,
  input: UploadRecipeImageInput
): Promise<RecipeImageWithUrlDto> => {
  if (!ALLOWED_MIME.has(input.mimetype)) {
    throw buildError("Invalid file type. Allowed: image/jpeg, image/png, image/webp.", "INVALID_FILE");
  }

  const ext = getExtension(input.mimetype);
  if (!ext) {
    throw buildError("Invalid file type.", "INVALID_FILE");
  }

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (recipeError || !recipe) {
    throw buildError("Recipe not found.", "NOT_FOUND");
  }

  const path = `${userId}/${recipeId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType: input.mimetype,
    upsert: false,
  });

  if (uploadError) {
    // eslint-disable-next-line no-console
    console.error("Failed to upload recipe image", uploadError);
    throw buildError("Failed to upload image.", "STORAGE");
  }

  const { data: maxPos } = await supabase
    .from("recipe_images")
    .select("position")
    .eq("recipe_id", recipeId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (maxPos?.position ?? -1) + 1;

  const { data: row, error: insertError } = await supabase
    .from("recipe_images")
    .insert({ recipe_id: recipeId, storage_path: path, position })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    // eslint-disable-next-line no-console
    console.error("Failed to insert recipe image row", insertError);
    throw buildError("Failed to save image metadata.", "DATABASE");
  }

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_EXPIRY_SEC);
  const url = signed?.signedUrl ?? "";

  return { ...row, url };
};
