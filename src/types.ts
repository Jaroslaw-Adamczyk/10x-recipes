import type { Enums, Tables } from "./db/database.types";

export type RecipeStatus = Enums<"recipe_status">;

type Recipe = Tables<"recipes">;
type RecipeIngredient = Tables<"recipe_ingredients">;
type RecipeStep = Tables<"recipe_steps">;
type RecipeImport = Tables<"recipe_imports">;
type RecipeRevision = Tables<"recipe_revisions">;
type RecipeImage = Tables<"recipe_images">;
type AuthEventLog = Tables<"auth_event_logs">;

// DTOs
export type RecipeDto = Recipe;
export type RecipeIngredientDto = RecipeIngredient;
export type RecipeStepDto = RecipeStep;
export type RecipeImportDto = Omit<RecipeImport, "user_id">;
export type RecipeRevisionDto = RecipeRevision;
export type RecipeImageDto = RecipeImage;
export type AuthEventLogDto = AuthEventLog;

export interface RecipeImageWithUrlDto extends RecipeImageDto {
  url: string;
}

export type RecipeListItemDto = Pick<
  Recipe,
  "id" | "title" | "status" | "error_message" | "created_at" | "updated_at" | "source_url"
> & {
  // Derived server-side from ingredient names.
  ingredients_preview: string[];
};

export interface RecipeDetailDto {
  recipe: RecipeDto;
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  import: RecipeImportDto | null;
  recipe_images: RecipeImageDto[];
}

export interface RecipeCreateResultDto {
  recipe: RecipeDto;
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
}

export type RecipeUpdateResultDto = RecipeCreateResultDto;

export interface RecipeImportListDto {
  data: RecipeImportDto[];
  next_cursor: string | null;
}

export interface RecipeListDto {
  data: RecipeListItemDto[];
  next_cursor: string | null;
}

export interface RecipeRevisionListDto {
  data: RecipeRevisionDto[];
  next_cursor: string | null;
}

export interface AuthEventLogListDto {
  data: AuthEventLogDto[];
  next_cursor: string | null;
}

// OpenRouter API Types
export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: OpenRouterMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface JsonSchemaFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export type ResponseFormat = { type: "json_object" } | JsonSchemaFormat;

export interface ChatParams {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: ResponseFormat;
}

export interface ExtractionParams extends Omit<ChatParams, "response_format"> {
  response_format: JsonSchemaFormat;
}

export interface ChatResponse {
  content: string;
  usage: OpenRouterResponse["usage"];
}

// Command Models
export type RecipeImportCreateCommand = Pick<RecipeImport, "source_url">;

export type RecipeIngredientCreateCommand = Pick<RecipeIngredient, "raw_text" | "normalized_name" | "position">;

export type RecipeStepCreateCommand = Pick<RecipeStep, "step_text" | "position">;

export type RecipeCreateCommand = Pick<Recipe, "title" | "cook_time_minutes" | "source_url"> & {
  ingredients: RecipeIngredientCreateCommand[];
  steps: RecipeStepCreateCommand[];
};

export type RecipeIngredientUpsertCommand = RecipeIngredientCreateCommand & {
  // Null or undefined indicates a new ingredient.
  id?: RecipeIngredient["id"] | null;
};

export type RecipeStepUpsertCommand = RecipeStepCreateCommand & {
  // Null or undefined indicates a new step.
  id?: RecipeStep["id"] | null;
};

export type RecipeUpdateCommand = Partial<Pick<Recipe, "title" | "cook_time_minutes" | "prep_time_minutes">> & {
  ingredients?: RecipeIngredientUpsertCommand[];
  steps?: RecipeStepUpsertCommand[];
};

export interface RecipeImportListQuery {
  status?: RecipeStatus;
  limit?: number;
  cursor?: string;
  sort?: string;
}

export interface RecipeListQuery {
  status?: RecipeStatus;
  q?: string;
  limit?: number;
  cursor?: string;
  sort?: string;
}
