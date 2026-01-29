import type { APIRoute } from "astro";
import { z } from "zod";

import type { RecipeDeleteError } from "../../../lib/services/recipes/deleteRecipe";
import { deleteRecipe } from "../../../lib/services/recipes/deleteRecipe";
import type { RecipeDetailError } from "../../../lib/services/recipes/getRecipeDetail";
import { getRecipeDetail } from "../../../lib/services/recipes/getRecipeDetail";
import type { RecipeUpdateError } from "../../../lib/services/recipes/updateRecipe";
import { updateRecipe } from "../../../lib/services/recipes/updateRecipe";
import type { RecipeUpdateCommand } from "../../../types";

export const prerender = false;

const paramsSchema = z.object({
  id: z.string().uuid("Recipe id must be a valid UUID."),
});

const ingredientUpdateSchema = z.object({
  id: z.string().uuid("Ingredient id must be a valid UUID.").nullable().optional(),
  raw_text: z.string().trim().min(1, "Ingredient raw_text is required."),
  normalized_name: z.string().trim().min(1, "Ingredient is required."),
  position: z.number().min(0, "Ingredient position must be >= 0.").optional(),
});

const stepUpdateSchema = z.object({
  id: z.string().uuid("Step id must be a valid UUID.").nullable().optional(),
  step_text: z.string().trim().min(1, "Step text is required."),
  position: z.number().min(0, "Step position must be >= 0."),
});

const recipeUpdateSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").optional(),
    cook_time_minutes: z.number().min(0, "Cook time must be >= 0.").nullable().optional(),
    prep_time_minutes: z.number().min(0, "Prep time must be >= 0.").nullable().optional(),
    ingredients: z.array(ingredientUpdateSchema).min(1, "At least one ingredient is required.").optional(),
    steps: z.array(stepUpdateSchema).min(1, "At least one step is required.").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
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

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const supabase = locals.supabase;
  const devUserId = import.meta.env.DEV_USER_ID;
  // Auth is temporarily disabled for development.
  // const { data, error } = await supabase.auth.getUser();
  //
  // if (error || !data.user) {
  //   return jsonResponse(401, { error: "Unauthorized." });
  // }

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return jsonResponse(400, {
      error: parsedParams.error.issues[0]?.message ?? "Invalid recipe id.",
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const parsedBody = recipeUpdateSchema.safeParse(payload);
  if (!parsedBody.success) {
    return jsonResponse(400, {
      error: parsedBody.error.issues[0]?.message ?? "Invalid request body.",
    });
  }

  const userId = devUserId ?? "00000000-0000-0000-0000-000000000000";
  const body = parsedBody.data;

  const command: RecipeUpdateCommand = {};
  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    command.title = body.title;
  }
  if (Object.prototype.hasOwnProperty.call(body, "cook_time_minutes")) {
    command.cook_time_minutes = body.cook_time_minutes ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "prep_time_minutes")) {
    command.prep_time_minutes = body.prep_time_minutes ?? null;
  }
  if (body.ingredients) {
    command.ingredients = body.ingredients.map((ingredient) => ({
      id: ingredient.id ?? null,
      raw_text: ingredient.raw_text.trim(),
      normalized_name: ingredient.normalized_name.trim().toLowerCase(),
      position: ingredient.position ?? null,
    }));
  }
  if (body.steps) {
    command.steps = body.steps.map((step) => ({
      id: step.id ?? null,
      step_text: step.step_text.trim(),
      position: step.position,
    }));
  }

  try {
    const result = await updateRecipe(supabase, userId, parsedParams.data.id, command);
    return jsonResponse(200, result);
  } catch (error) {
    const updateError = error as RecipeUpdateError | undefined;
    if (updateError?.code) {
      if (updateError.code === "NOT_FOUND") {
        return jsonResponse(404, { error: updateError.message });
      }

      return jsonResponse(500, { error: updateError.message });
    }

    // eslint-disable-next-line no-console
    console.error("Unexpected error updating recipe", error);
    return jsonResponse(500, { error: "Unexpected error updating recipe." });
  }
};
