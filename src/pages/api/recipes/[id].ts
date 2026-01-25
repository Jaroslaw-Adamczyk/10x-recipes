import type { APIRoute } from "astro";
import { z } from "zod";

import type { RecipeDeleteError } from "../../../lib/services/recipes/deleteRecipe";
import { deleteRecipe } from "../../../lib/services/recipes/deleteRecipe";
import type { RecipeDetailError } from "../../../lib/services/recipes/getRecipeDetail";
import { getRecipeDetail } from "../../../lib/services/recipes/getRecipeDetail";

export const prerender = false;

const paramsSchema = z.object({
  id: z.string().uuid("Recipe id must be a valid UUID."),
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

export const DELETE: APIRoute = async ({ locals, params }) => {
  const supabase = locals.supabase;
  const devUserId = import.meta.env.DEV_USER_ID;
  // Auth is temporarily disabled for development.
  // const { data, error } = await supabase.auth.getUser();
  //
  // if (error || !data.user) {
  //   return jsonResponse(401, { error: "Unauthorized." });
  // }

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonResponse(400, {
      error: parsed.error.issues[0]?.message ?? "Invalid recipe id.",
    });
  }

  const userId = devUserId ?? "00000000-0000-0000-0000-000000000000";

  try {
    await deleteRecipe(supabase, userId, parsed.data.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    const deleteError = error as RecipeDeleteError | undefined;
    if (deleteError?.code) {
      if (deleteError.code === "NOT_FOUND") {
        return jsonResponse(404, { error: deleteError.message });
      }

      return jsonResponse(500, { error: deleteError.message });
    }

    // eslint-disable-next-line no-console
    console.error("Unexpected error deleting recipe", error);
    return jsonResponse(500, { error: "Unexpected error deleting recipe." });
  }
};

export const GET: APIRoute = async ({ locals, params }) => {
  const supabase = locals.supabase;
  const devUserId = import.meta.env.DEV_USER_ID;
  // Auth is temporarily disabled for development.
  // const { data, error } = await supabase.auth.getUser();
  //
  // if (error || !data.user) {
  //   return jsonResponse(401, { error: "Unauthorized." });
  // }

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonResponse(400, {
      error: parsed.error.issues[0]?.message ?? "Invalid recipe id.",
    });
  }

  const userId = devUserId ?? "00000000-0000-0000-0000-000000000000";

  try {
    const result = await getRecipeDetail(supabase, userId, parsed.data.id);
    return jsonResponse(200, result);
  } catch (error) {
    const detailError = error as RecipeDetailError | undefined;
    if (detailError?.code) {
      if (detailError.code === "NOT_FOUND") {
        return jsonResponse(404, { error: detailError.message });
      }

      return jsonResponse(500, { error: detailError.message });
    }

    // eslint-disable-next-line no-console
    console.error("Unexpected error fetching recipe detail", error);
    return jsonResponse(500, { error: "Unexpected error fetching recipe detail." });
  }
};
