import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IngredientListInput } from "@/components/recipes/IngredientListInput";
import { StepListInput } from "@/components/recipes/StepListInput";
import { recipeFormSchema, type RecipeFormValues } from "./utils/recipeFormSchema";
import { normalizeIngredientName, normalizeText } from "./utils/recipeListUtils";
import type { RecipeDetailDto, RecipeUpdateCommand, RecipeImageWithUrlDto } from "@/types";
import { apiClient, ApiError } from "@/lib/apiClient";

export const RECIPE_IMAGE_THUMBNAIL_SIZE = 198;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const IMAGE_ACCEPT = "image/jpeg,image/png";

interface UpdateError {
  message: string;
  statusCode?: number;
}

export interface EditRecipeModalProps {
  open: boolean;
  initialRecipe: RecipeDetailDto;
  onSubmit: (command: RecipeUpdateCommand, imageFiles?: File[]) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

function buildFormState(recipe: RecipeDetailDto) {
  const ingredientMap = new Map<string, string>();
  const ingredients = recipe.ingredients.map((ingredient) => {
    const localId = crypto.randomUUID();
    if (ingredient.id) ingredientMap.set(localId, ingredient.id);
    return { id: localId, value: ingredient.raw_text };
  });

  const stepMap = new Map<string, string>();
  const steps = recipe.steps.map((step) => {
    const localId = crypto.randomUUID();
    if (step.id) stepMap.set(localId, step.id);
    return { id: localId, value: step.step_text };
  });

  const values: RecipeFormValues = {
    title: recipe.recipe.title,
    ingredients: ingredients.length > 0 ? ingredients : [{ id: crypto.randomUUID(), value: "" }],
    steps: steps.length > 0 ? steps : [{ id: crypto.randomUUID(), value: "" }],
    cookTime: recipe.recipe.cook_time_minutes === null ? "" : String(recipe.recipe.cook_time_minutes),
  };

  return { values, ingredientMap, stepMap };
}

export const EditRecipeModal = ({ open, initialRecipe, onSubmit, onClose, isSaving }: EditRecipeModalProps) => {
  const [ingredientDbIdMap, setIngredientDbIdMap] = useState(() => new Map<string, string>());
  const [stepDbIdMap, setStepDbIdMap] = useState(() => new Map<string, string>());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<RecipeImageWithUrlDto[]>([]);
  const [existingImagesLoading, setExistingImagesLoading] = useState(false);
  const [existingImagesError, setExistingImagesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: "",
      ingredients: [{ id: crypto.randomUUID(), value: "" }],
      steps: [{ id: crypto.randomUUID(), value: "" }],
      cookTime: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    const { values, ingredientMap, stepMap } = buildFormState(initialRecipe);
    setIngredientDbIdMap(ingredientMap);
    setStepDbIdMap(stepMap);
    reset(values);
    setSubmitError(null);
    setImageFiles([]);
    setImageError(null);
    setExistingImages([]);
    setExistingImagesError(null);
  }, [open, initialRecipe, reset, setFocus]);

  useEffect(() => {
    if (!open) return;

    const recipeId = initialRecipe.recipe.id;
    const controller = new AbortController();

    const loadImages = async () => {
      setExistingImagesLoading(true);
      setExistingImagesError(null);
      try {
        const data = await apiClient.get<RecipeImageWithUrlDto[]>(
          `/api/recipes/${recipeId}/images?size=${RECIPE_IMAGE_THUMBNAIL_SIZE}`,
          controller.signal
        );
        setExistingImages(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (err instanceof ApiError) {
          const body = err.body as { error?: string } | null;
          setExistingImagesError(body?.error ?? "Unable to load images.");
        } else {
          setExistingImagesError("Network error while loading images.");
        }
      } finally {
        if (!controller.signal.aborted) setExistingImagesLoading(false);
      }
    };

    void loadImages();
    return () => {
      controller.abort();
    };
  }, [open, initialRecipe.recipe.id]);

  const removeExistingImage = useCallback(
    async (imageId: string) => {
      setExistingImagesError(null);
      const recipeId = initialRecipe.recipe.id;
      try {
        await apiClient.delete(`/api/recipes/${recipeId}/images/${imageId}`);
        setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      } catch (err) {
        if (err instanceof ApiError) {
          const body = err.body as { error?: string } | null;
          setExistingImagesError(body?.error ?? "Unable to delete photo.");
        } else {
          setExistingImagesError("Network error while deleting photo.");
        }
      }
    },
    [initialRecipe.recipe.id]
  );

  const handleAddImageClick = useCallback(() => {
    setImageError(null);
    fileInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError("File too large. Maximum size is 5MB.");
      return;
    }
    setImageError(null);
    setImageFiles((prev) => [...prev, file]);
  }, []);

  const removeImageFile = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageError(null);
  }, []);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [imageFiles]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const onFormSubmit = async (data: RecipeFormValues) => {
    setSubmitError(null);

    const normalizedIngredients = data.ingredients
      .filter((ing) => normalizeText(ing.value).length > 0)
      .map((ing, index) => ({
        id: ingredientDbIdMap.get(ing.id) ?? null,
        raw_text: normalizeText(ing.value),
        normalized_name: normalizeIngredientName(ing.value),
        position: index,
      }));

    const normalizedSteps = data.steps
      .filter((step) => normalizeText(step.value).length > 0)
      .map((step, index) => ({
        id: stepDbIdMap.get(step.id) ?? null,
        step_text: normalizeText(step.value),
        position: index,
      }));

    const cookTimeValue = data.cookTime.trim() === "" ? null : Number(data.cookTime);

    const command: RecipeUpdateCommand = {
      title: normalizeText(data.title),
      cook_time_minutes: cookTimeValue,
      ingredients: normalizedIngredients,
      steps: normalizedSteps,
    };

    try {
      await onSubmit(command, imageFiles.length > 0 ? imageFiles : undefined);
      onClose();
    } catch (error) {
      const updateError = error as UpdateError | undefined;
      if (updateError?.statusCode === 409) {
        setSubmitError(updateError.message || "This recipe already exists.");
        return;
      }

      setSubmitError(updateError?.message ?? "Unable to update recipe. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit recipe</DialogTitle>
          <DialogDescription>Update details, ingredients, and steps.</DialogDescription>
        </DialogHeader>

        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit(onFormSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="recipe-title">
              Title
            </label>
            <input
              id="recipe-title"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-invalid={Boolean(errors.title)}
              disabled={isSaving}
              {...register("title")}
            />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>

          <Controller
            name="ingredients"
            control={control}
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <IngredientListInput ingredients={field.value} onChange={field.onChange} disabled={isSaving} />
                {fieldState.error ? <p className="text-xs text-destructive">{fieldState.error.message}</p> : null}
              </div>
            )}
          />

          <Controller
            name="steps"
            control={control}
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <StepListInput steps={field.value} onChange={field.onChange} disabled={isSaving} />
                {fieldState.error ? <p className="text-xs text-destructive">{fieldState.error.message}</p> : null}
              </div>
            )}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="cook-time">
              Cook time (minutes)
            </label>
            <input
              id="cook-time"
              className="h-10 w-40 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              type="number"
              min={0}
              aria-invalid={Boolean(errors.cookTime)}
              disabled={isSaving}
              {...register("cookTime")}
            />
            {errors.cookTime ? <p className="text-xs text-destructive">{errors.cookTime.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-foreground" htmlFor="edit-recipe-photos">
                Recipe photos
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImageClick}
                disabled={isSaving}
                aria-label="Add photo"
              >
                <PlusIcon className="size-4" />
                Add photo
              </Button>
            </div>
            <input
              id="edit-recipe-photos"
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="sr-only"
              aria-hidden
              onChange={handleImageFileChange}
            />
            {existingImagesLoading ? <p className="text-sm text-muted-foreground">Loading photos…</p> : null}
            {existingImagesError ? <p className="text-xs text-destructive">{existingImagesError}</p> : null}
            {imageError ? <p className="text-xs text-destructive">{imageError}</p> : null}
            {existingImages.length > 0 || imageFiles.length > 0 ? (
              <ul className="flex flex-wrap gap-3" data-testid="edit-form-image-previews">
                {existingImages.map((image) => (
                  <li
                    key={image.id}
                    className="group relative shrink-0 overflow-hidden rounded-md border border-border bg-muted"
                    style={{
                      width: RECIPE_IMAGE_THUMBNAIL_SIZE,
                      height: RECIPE_IMAGE_THUMBNAIL_SIZE,
                    }}
                  >
                    <img src={image.url} alt="" className="size-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Delete photo"
                      onClick={() => removeExistingImage(image.id)}
                      disabled={isSaving}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </li>
                ))}
                {imageFiles.map((file, index) => (
                  <li
                    key={`new-${file.name}-${index}`}
                    className="group relative shrink-0 overflow-hidden rounded-md border border-border bg-muted"
                    style={{
                      width: RECIPE_IMAGE_THUMBNAIL_SIZE,
                      height: RECIPE_IMAGE_THUMBNAIL_SIZE,
                    }}
                  >
                    {previewUrls[index] ? (
                      <img src={previewUrls[index]} alt="" className="size-full object-cover" />
                    ) : null}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove photo"
                      onClick={() => removeImageFile(index)}
                      disabled={isSaving}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {submitError ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {submitError}
            </p>
          ) : null}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
