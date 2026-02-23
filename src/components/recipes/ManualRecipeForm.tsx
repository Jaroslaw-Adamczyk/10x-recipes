import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import type { RecipeCreateCommand } from "@/types";
import { normalizeIngredientName, normalizeText } from "./utils/recipeListUtils";
import { recipeFormSchema, type RecipeFormValues } from "./utils/recipeFormSchema";
import { useRecipeImageFiles } from "./hooks/useRecipeImageFiles";
import { IngredientListInput } from "./IngredientListInput";
import { StepListInput } from "./StepListInput";
import { IMAGE_ACCEPT } from "./constants/recipeImage";

interface ManualRecipeFormProps {
  onSubmit: (command: RecipeCreateCommand, imageFiles?: File[]) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  onDirtyChange: (dirty: boolean) => void;
}

export const ManualRecipeForm = ({ onSubmit, onCancel, isSubmitting, error, onDirtyChange }: ManualRecipeFormProps) => {
  const {
    imageFiles,
    imageError,
    previewUrls,
    fileInputRef,
    handleAddImageClick,
    handleImageFileChange,
    removeImageFile,
  } = useRecipeImageFiles();

  const {
    register,
    control,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty },
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
    onDirtyChange(isDirty || imageFiles.length > 0);
  }, [isDirty, imageFiles.length, onDirtyChange]);

  useEffect(() => {
    requestAnimationFrame(() => setFocus("title"));
  }, [setFocus]);

  const onFormSubmit = (data: RecipeFormValues) => {
    const ingredientItems = data.ingredients
      .map((ing) => normalizeText(ing.value))
      .filter(Boolean)
      .map((line, index) => ({
        raw_text: line,
        normalized_name: normalizeIngredientName(line),
        position: index + 1,
      }));

    const stepItems = data.steps
      .map((step) => normalizeText(step.value))
      .filter(Boolean)
      .map((line, index) => ({
        step_text: line,
        position: index + 1,
      }));

    const cookTimeValue = data.cookTime.trim() === "" ? null : Number(data.cookTime);

    onSubmit(
      {
        title: normalizeText(data.title),
        cook_time_minutes: cookTimeValue,
        source_url: null,
        ingredients: ingredientItems,
        steps: stepItems,
      },
      imageFiles.length > 0 ? imageFiles : undefined
    );
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onFormSubmit)} noValidate>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="manual-title">
          Title
        </label>

        <input
          id="manual-title"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          type="text"
          placeholder="Recipe title"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.title)}
          data-testid="input-recipe-title"
          {...register("title")}
        />

        {errors.title ? (
          <p className="text-xs text-destructive" data-testid="validation-error-title">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <Controller
        name="ingredients"
        control={control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1.5">
            <IngredientListInput ingredients={field.value} onChange={field.onChange} disabled={isSubmitting} />

            {fieldState.error ? (
              <p className="text-xs text-destructive" data-testid="validation-error-ingredients">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />

      <Controller
        name="steps"
        control={control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1.5">
            <StepListInput steps={field.value} onChange={field.onChange} disabled={isSubmitting} />

            {fieldState.error ? (
              <p className="text-xs text-destructive" data-testid="validation-error-steps">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="manual-cooktime">
          Cook time (minutes)
        </label>

        <input
          id="manual-cooktime"
          className="h-10 w-40 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          type="number"
          min={0}
          placeholder="30"
          disabled={isSubmitting}
          data-testid="input-recipe-cooktime"
          {...register("cookTime")}
        />

        {errors.cookTime ? (
          <p className="text-xs text-destructive" data-testid="validation-error-cooktime">
            {errors.cookTime.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium text-foreground" htmlFor="manual-recipe-photos">
            Recipe photos
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddImageClick}
            disabled={isSubmitting}
            aria-label="Add photo"
          >
            <PlusIcon className="size-4" />
            Add photo
          </Button>
        </div>
        <input
          id="manual-recipe-photos"
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          aria-hidden
          onChange={handleImageFileChange}
        />
        {imageError ? (
          <p className="text-xs text-destructive" data-testid="validation-error-images">
            {imageError}
          </p>
        ) : null}
        {imageFiles.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" data-testid="manual-form-image-previews">
            {imageFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="relative shrink-0 overflow-hidden rounded-md border border-border bg-muted"
              >
                {previewUrls[index] ? <img src={previewUrls[index]} alt="" className="size-full object-cover" /> : null}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 size-7 opacity-90"
                  aria-label="Remove photo"
                  onClick={() => removeImageFile(index)}
                  disabled={isSubmitting}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-destructive" role="alert" data-testid="validation-error-form">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} data-testid="button-cancel">
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting} data-testid="button-create-recipe">
          {isSubmitting ? "Saving..." : "Create recipe"}
        </Button>
      </div>
    </form>
  );
};
