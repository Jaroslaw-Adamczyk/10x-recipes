import type { JsonSchemaFormat, OpenRouterMessage } from "../../../types";
import { openRouterService } from "../ai";

export interface ExtractedRecipe {
  title: string;
  cook_time_minutes: number | null;
  prep_time_minutes: number | null;
  ingredients: {
    raw_text: string;
    normalized_name: string;
  }[];
  steps: {
    step_text: string;
  }[];
  images: string[];
}

const RECIPE_SCHEMA: JsonSchemaFormat = {
  type: "json_schema",
  json_schema: {
    name: "recipe_extraction",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        cook_time_minutes: { type: ["number", "null"] },
        prep_time_minutes: { type: ["number", "null"] },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              raw_text: { type: "string" },
              normalized_name: { type: "string" },
            },
            required: ["raw_text", "normalized_name"],
            additionalProperties: false,
          },
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step_text: { type: "string" },
            },
            required: ["step_text"],
            additionalProperties: false,
          },
        },
        images: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["title", "cook_time_minutes", "prep_time_minutes", "ingredients", "steps"],
      additionalProperties: false,
    },
  },
};

/**
 * Extracts structured recipe data from raw text or HTML content.
 */
export const extractRecipeData = async (content: string): Promise<ExtractedRecipe> => {
  // Simple cleanup to reduce token usage and noise
  const sanitizedContent = content
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
    .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gim, "");

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content:
        "You are a culinary data extraction expert. Your goal is to transform messy HTML or text from cooking websites into structured recipe data.\n\n" +
        "Rules:\n" +
        "1. **Title**: The main name of the dish.\n" +
        "2. **Times**: Extract 'cook_time_minutes' and 'prep_time_minutes' as integers. If not found, use null.\n" +
        "3. **Ingredients**: \n" +
        "   - 'raw_text': The full line as found on the page (e.g., '2 tbsp extra virgin olive oil').\n" +
        "   - 'normalized_name': The simple name of the ingredient, lowercase, without quantities (e.g., 'olive oil').\n" +
        "4. **Steps**: Extract each instruction step separately. Do not hallucinate steps. \n" +
        "5. **Images**: Extract the URLs of the images in the recipe. Don't pick random images from the page. Pick maximum 3 images. Only pick images that are relevant to the recipe. Prefer images that of the final dish. Only .jpg, .png images.\n" +
        "6. **Cleanliness**: Remove any non-recipe content like ads, related posts, or site navigation.",
    },
    {
      role: "user",
      content: `Extract the recipe from the following content:\n\n${sanitizedContent}`,
    },
  ];

  try {
    return await openRouterService.extractData<ExtractedRecipe>({
      model: "google/gemini-2.5-flash-lite",
      messages,
      response_format: RECIPE_SCHEMA,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Recipe extraction failed:", error);
    throw error;
  }
};
