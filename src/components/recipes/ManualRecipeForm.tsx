import { useEffect, type RefObject } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import type { RecipeCreateCommand } from "@/types";
import { normalizeIngredientName, normalizeText } from "./utils/recipeListUtils";
import { recipeFormSchema, type RecipeFormValues } from "./utils/recipeFormSchema";
import { useRecipeImageFiles } from "./hooks/useRecipeImageFiles";
import { IngredientListInput } from "./IngredientListInput";
import { StepListInput } from "./StepListInput";
import { RecipeImagesInput } from "./RecipeImagesInput";

interface ManualRecipeFormProps {
  onSubmit: (command: RecipeCreateCommand, imageFiles?: File[]) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  onDirtyChange: (dirty: boolean) => void;
}

export const ManualRecipeForm = ({ onSubmit, onCancel, isSubmitting, error, onDirtyChange }: ManualRecipeFormProps) => {
  const { imageFiles, imageError, previewUrls, fileInputRef, handleImageFileChange, handleImageDrop, removeImageFile } =
    useRecipeImageFiles();

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

      <RecipeImagesInput
        imageFiles={imageFiles}
        imageError={imageError}
        previewUrls={previewUrls}
        fileInputRef={fileInputRef as RefObject<HTMLInputElement>}
        isSubmitting={isSubmitting}
        handleImageFileChange={handleImageFileChange}
        handleImageDrop={handleImageDrop}
        removeImageFile={removeImageFile}
        label="Recipe photos"
      />

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
