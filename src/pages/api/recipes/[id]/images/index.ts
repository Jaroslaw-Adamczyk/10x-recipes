import type { APIRoute } from "astro";
import { z } from "zod";

import type { ListRecipeImagesError } from "../../../../../lib/services/recipeImages/listRecipeImages";
import { listRecipeImages } from "../../../../../lib/services/recipeImages/listRecipeImages";
import type { UploadRecipeImageError } from "../../../../../lib/services/recipeImages/uploadRecipeImage";
import { uploadRecipeImage } from "../../../../../lib/services/recipeImages/uploadRecipeImage";

export const prerender = false;

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);

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

export const GET: APIRoute = async ({ locals, params, url }) => {
  const supabase = locals.supabase;
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonResponse(400, {
      error: parsed.error.issues[0]?.message ?? "Invalid recipe id.",
    });
  }

  const sizeParam = url.searchParams.get("size");
  let size: number | undefined;
  if (sizeParam !== null) {
    const sizeNumber = Number.parseInt(sizeParam, 10);
    if (Number.isNaN(sizeNumber)) {
      return jsonResponse(400, { error: "Invalid size." });
    }
    size = sizeNumber;
  }

  try {
    const images = await listRecipeImages(supabase, data.user.id, parsed.data.id, {
      size,
    });
    return jsonResponse(200, images);
  } catch (err) {
    const listError = err as ListRecipeImagesError;
    if (listError?.code) {
      if (listError.code === "NOT_FOUND") {
        return jsonResponse(404, { error: listError.message });
      }
      return jsonResponse(500, { error: listError.message });
    }
    // eslint-disable-next-line no-console
    console.error("Unexpected error listing recipe images", err);
    return jsonResponse(500, { error: "Unexpected error listing recipe images." });
  }
};

export const POST: APIRoute = async ({ locals, params, request }) => {
  const supabase = locals.supabase;
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonResponse(400, {
      error: parsed.error.issues[0]?.message ?? "Invalid recipe id.",
    });
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonResponse(400, { error: "Request must be multipart/form-data." });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse(400, { error: "Invalid form data." });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return jsonResponse(400, { error: "Missing or invalid file field." });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return jsonResponse(400, {
      error: "Invalid file type.",
    });
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return jsonResponse(413, { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` });
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return jsonResponse(400, { error: "Failed to read file." });
  }

  try {
    const image = await uploadRecipeImage(supabase, data.user.id, parsed.data.id, {
      file: buffer,
      mimetype: file.type,
      originalFilename: file.name,
    });
    return jsonResponse(201, image);
  } catch (err) {
    const uploadError = err as UploadRecipeImageError;
    if (uploadError?.code) {
      if (uploadError.code === "NOT_FOUND") {
        return jsonResponse(404, { error: uploadError.message });
      }
      if (uploadError.code === "INVALID_FILE") {
        return jsonResponse(400, { error: uploadError.message });
      }
      return jsonResponse(500, { error: uploadError.message });
    }
    // eslint-disable-next-line no-console
    console.error("Unexpected error uploading recipe image", err);
    return jsonResponse(500, { error: "Unexpected error uploading recipe image." });
  }
};
