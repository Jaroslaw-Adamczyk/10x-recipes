import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import type { RecipeDetailDto, RecipeUpdateCommand } from "@/types";

interface UpdateError {
  message: string;
  statusCode?: number;
}

export interface EditRecipeModalProps {
  open: boolean;
  initialRecipe: RecipeDetailDto;
  onSubmit: (command: RecipeUpdateCommand) => Promise<void>;
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
  }, [open, initialRecipe, reset, setFocus]);

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
      await onSubmit(command);
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
