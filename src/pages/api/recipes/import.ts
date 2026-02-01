import type { APIRoute } from "astro";
import { z } from "zod";

import type { RecipeImportCreateError } from "../../../lib/services/recipes/createRecipeImport";
import { createRecipeImport } from "../../../lib/services/recipes/createRecipeImport";
import type { RecipeImportCreateCommand } from "../../../types";

export const prerender = false;

const recipeImportSchema = z.object({
  source_url: z.string().trim().url("Source URL must be a valid URL."),
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

/**
 * POST /api/recipes/import
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const parsed = recipeImportSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse(400, {
      error: parsed.error.issues[0]?.message ?? "Invalid request body.",
    });
  }

  const command: RecipeImportCreateCommand = {
    source_url: parsed.data.source_url,
  };

  const userId = data.user.id;

  try {
    const result = await createRecipeImport(supabase, userId, command);
    return jsonResponse(202, result);
  } catch (error) {
    const importError = error as RecipeImportCreateError | undefined;
    if (importError?.code) {
      if (importError.code === "CONFLICT") {
        return jsonResponse(409, { error: importError.message });
      }

      return jsonResponse(500, { error: importError.message });
    }

    // eslint-disable-next-line no-console
    console.error("Unexpected error creating recipe import", error);
    return jsonResponse(500, { error: "Unexpected error creating recipe import." });
  }
};
