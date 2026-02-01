import type { APIRoute } from "astro";
import { z } from "zod";

import type { RecipeCreateError } from "../../../lib/services/recipes/createRecipe";
import { createRecipe } from "../../../lib/services/recipes/createRecipe";
import type { RecipeListError } from "../../../lib/services/recipes/listRecipes";
import { listRecipes } from "../../../lib/services/recipes/listRecipes";
import type { RecipeCreateCommand } from "../../../types";

export const prerender = false;

const ingredientSchema = z.object({
  raw_text: z.string().trim().min(1, "Ingredient raw_text is required."),
  normalized_name: z.string().trim().min(1, "Ingredient is required."),
  position: z.number().min(0, "Ingredient position must be >= 0.").optional(),
});

const stepSchema = z.object({
  step_text: z.string().trim().min(1, "Step text is required."),
  position: z.number().min(0, "Step position must be >= 0."),
});

const recipeCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  cook_time_minutes: z.number().min(0, "Cook time must be >= 0.").optional(),
  source_url: z.union([z.string().url("Invalid source_url."), z.null()]).optional(),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required."),
  steps: z.array(stepSchema).min(1, "At least one step is required."),
});

const recipeListQuerySchema = z.object({
  status: z.enum(["processing", "succeeded", "failed"]).optional(),
  q: z.string().trim().min(1, "Query must not be empty.").optional(),
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  // Get authenticated user
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  const userId = data.user.id;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const parsed = recipeCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse(400, {
      error: parsed.error.issues[0]?.message ?? "Invalid request body.",
    });
  }

  const command: RecipeCreateCommand = {
    ...parsed.data,
    cook_time_minutes: parsed.data.cook_time_minutes ?? null,
    source_url: parsed.data.source_url ?? null,
    ingredients: parsed.data.ingredients.map((ingredient) => ({
      ...ingredient,
      normalized_name: ingredient.normalized_name.trim().toLowerCase(),
      position: ingredient.position ?? null,
    })),
  };

  try {
    const result = await createRecipe(supabase, userId, command);

    return jsonResponse(201, result);
  } catch (error) {
    const createError = error as RecipeCreateError | undefined;
    if (createError?.code) {
      if (createError.code === "CONFLICT") {
        return jsonResponse(409, { error: createError.message });
      }

      return jsonResponse(500, { error: createError.message });
    }

    // eslint-disable-next-line no-console
    console.error("Unexpected error creating recipe", error);
    return jsonResponse(500, { error: "Unexpected error creating recipe." });
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  // Get authenticated user
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  const userId = data.user.id;

  // Validate user ID format (UUID v4)
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return jsonResponse(401, { error: "Invalid user ID." });
  }

  const url = new URL(request.url);
  const qParam = url.searchParams.get("q") ?? undefined;
  const rawQuery = {
    status: url.searchParams.get("status") ?? undefined,
    q: qParam?.trim() ? qParam : undefined,
  };

  const parsed = recipeListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return jsonResponse(400, {
      error: parsed.error.issues[0]?.message ?? "Invalid query parameters.",
    });
  }

  try {
    const result = await listRecipes(supabase, userId, parsed.data);
    return jsonResponse(200, result);
  } catch (error) {
    const listError = error as RecipeListError | undefined;
    if (listError?.code) {
      return jsonResponse(500, { error: listError.message });
    }

    // eslint-disable-next-line no-console
    console.error("Unexpected error listing recipes", error);
    return jsonResponse(500, { error: "Unexpected error listing recipes." });
  }
};
