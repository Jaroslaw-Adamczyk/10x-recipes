import type { APIRoute } from "astro";
import { z } from "zod";

import type { DeleteRecipeImageError } from "../../../../../lib/services/recipeImages/deleteRecipeImage";
import { deleteRecipeImage } from "../../../../../lib/services/recipeImages/deleteRecipeImage";

export const prerender = false;

const paramsSchema = z.object({
  id: z.string().uuid("Recipe id must be a valid UUID."),
  imageId: z.string().uuid("Image id must be a valid UUID."),
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
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonResponse(400, {
      error: parsed.error.issues[0]?.message ?? "Invalid recipe or image id.",
    });
  }

  try {
    await deleteRecipeImage(supabase, data.user.id, parsed.data.imageId);
    return new Response(null, { status: 204 });
  } catch (err) {
    const deleteError = err as DeleteRecipeImageError;
    if (deleteError?.code) {
      if (deleteError.code === "NOT_FOUND") {
        return jsonResponse(404, { error: deleteError.message });
      }
      return jsonResponse(500, { error: deleteError.message });
    }
    // eslint-disable-next-line no-console
    console.error("Unexpected error deleting recipe image", err);
    return jsonResponse(500, { error: "Unexpected error deleting recipe image." });
  }
};
