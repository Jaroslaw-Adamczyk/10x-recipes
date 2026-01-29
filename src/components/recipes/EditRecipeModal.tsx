import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { RecipeDetailDto, RecipeUpdateCommand } from "@/types";

interface UpdateError {
  message: string;
  statusCode?: number;
}

interface IngredientFormItem {
  id?: string | null;
  rawText: string;
}

interface StepFormItem {
  id?: string | null;
  stepText: string;
}

export interface EditRecipeModalProps {
  open: boolean;
  initialRecipe: RecipeDetailDto;
  onSubmit: (command: RecipeUpdateCommand) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

const normalizeText = (value: string): string => value.trim().replace(/\s+/g, " ");

const normalizeIngredientName = (value: string): string => normalizeText(value).toLowerCase();

const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [removed] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, removed);
  return nextItems;
};
const isEmptyValue = (value: string): boolean => normalizeText(value).length === 0;

const getValidationIndexes = (items: string[]) =>
  items.reduce<number[]>((acc, value, index) => {
    if (isEmptyValue(value)) {
      acc.push(index);
    }
    return acc;
  }, []);

export const EditRecipeModal = ({ open, initialRecipe, onSubmit, onClose, isSaving }: EditRecipeModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialRecipe.recipe.title);
  const [cookTime, setCookTime] = useState<string>(
    initialRecipe.recipe.cook_time_minutes === null ? "" : String(initialRecipe.recipe.cook_time_minutes)
  );
  const [ingredients, setIngredients] = useState<IngredientFormItem[]>(
    initialRecipe.ingredients.map((ingredient) => ({ id: ingredient.id, rawText: ingredient.raw_text }))
  );
  const [steps, setSteps] = useState<StepFormItem[]>(
    initialRecipe.steps.map((step) => ({ id: step.id, stepText: step.step_text }))
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(initialRecipe.recipe.title);
    setCookTime(initialRecipe.recipe.cook_time_minutes === null ? "" : String(initialRecipe.recipe.cook_time_minutes));
    setIngredients(
      initialRecipe.ingredients.map((ingredient) => ({ id: ingredient.id, rawText: ingredient.raw_text }))
    );
    setSteps(initialRecipe.steps.map((step) => ({ id: step.id, stepText: step.step_text })));
    setFormError(null);
    setShowValidation(false);
    requestAnimationFrame(() => titleInputRef.current?.focus());
  }, [open, initialRecipe]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleFocusTrap);

    return () => {
      window.removeEventListener("keydown", handleFocusTrap);
    };
  }, [open]);

  const invalidIngredientIndexes = useMemo(
    () => getValidationIndexes(ingredients.map((item) => item.rawText)),
    [ingredients]
  );
  const invalidStepIndexes = useMemo(() => getValidationIndexes(steps.map((item) => item.stepText)), [steps]);
  const isTitleInvalid = isEmptyValue(title);
  const cookTimeValue = cookTime === "" ? null : Number(cookTime);
  const isCookTimeInvalid = cookTimeValue !== null && (Number.isNaN(cookTimeValue) || cookTimeValue < 0);
  const isFormValid =
    !isTitleInvalid &&
    !isCookTimeInvalid &&
    ingredients.length > 0 &&
    steps.length > 0 &&
    invalidIngredientIndexes.length === 0 &&
    invalidStepIndexes.length === 0;

  if (!open) {
    return null;
  }

  const handleIngredientChange = (index: number, value: string) => {
    setIngredients((current) => current.map((item, idx) => (idx === index ? { ...item, rawText: value } : item)));
  };

  const handleStepChange = (index: number, value: string) => {
    setSteps((current) => current.map((item, idx) => (idx === index ? { ...item, stepText: value } : item)));
  };

  const handleIngredientMove = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= ingredients.length) {
      return;
    }

    setIngredients((current) => moveItem(current, index, nextIndex));
  };

  const handleStepMove = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= steps.length) {
      return;
    }

    setSteps((current) => moveItem(current, index, nextIndex));
  };

  const handleIngredientAdd = () => {
    setIngredients((current) => [...current, { rawText: "" }]);
  };

  const handleStepAdd = () => {
    setSteps((current) => [...current, { stepText: "" }]);
  };

  const handleIngredientRemove = (index: number) => {
    setIngredients((current) => current.filter((_, idx) => idx !== index));
  };

  const handleStepRemove = (index: number) => {
    setSteps((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    setFormError(null);
    setShowValidation(true);

    if (isTitleInvalid) {
      setFormError("Title is required.");
      return;
    }

    if (ingredients.length === 0) {
      setFormError("Add at least one ingredient.");
      return;
    }

    if (steps.length === 0) {
      setFormError("Add at least one step.");
      return;
    }

    if (invalidIngredientIndexes.length > 0) {
      setFormError("Each ingredient needs a valid description.");
      return;
    }

    if (invalidStepIndexes.length > 0) {
      setFormError("Each step needs a valid description.");
      return;
    }

    if (isCookTimeInvalid) {
      setFormError("Cook time must be 0 or greater.");
      return;
    }

    const normalizedIngredients = ingredients.map((ingredient, index) => ({
      id: ingredient.id,
      raw_text: normalizeText(ingredient.rawText),
      normalized_name: normalizeIngredientName(ingredient.rawText),
      position: index,
    }));

    const normalizedSteps = steps.map((step, index) => ({
      id: step.id,
      step_text: normalizeText(step.stepText),
      position: index,
    }));

    const hasIngredientError = normalizedIngredients.some(
      (ingredient) => !ingredient.raw_text || !ingredient.normalized_name || ingredient.position < 0
    );
    if (hasIngredientError) {
      setFormError("Each ingredient needs a valid description.");
      return;
    }

    const hasStepError = normalizedSteps.some((step) => !step.step_text || step.position < 0);
    if (hasStepError) {
      setFormError("Each step needs a valid description.");
      return;
    }

    if (cookTimeValue !== null && (Number.isNaN(cookTimeValue) || cookTimeValue < 0)) {
      setFormError("Cook time must be 0 or greater.");
      return;
    }

    const command: RecipeUpdateCommand = {
      title: normalizeText(title),
      cook_time_minutes: cookTimeValue,
      ingredients: normalizedIngredients,
      steps: normalizedSteps,
    };

    try {
      await onSubmit(command);
    } catch (error) {
      const updateError = error as UpdateError | undefined;
      if (updateError?.statusCode === 409) {
        setFormError(updateError.message || "This recipe already exists.");
        return;
      }

      setFormError(updateError?.message ?? "Unable to update recipe. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-recipe-title"
      aria-describedby="edit-recipe-description"
    >
      <div
        className="w-full max-w-3xl rounded-lg border border-border bg-background p-6 text-foreground shadow-lg"
        ref={modalRef}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" id="edit-recipe-title">
              Edit recipe
            </h2>
            <p className="text-sm text-muted-foreground" id="edit-recipe-description">
              Update details, ingredients, and steps.
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {formError ? (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="recipe-title">
              Title
            </label>
            <input
              id="recipe-title"
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                showValidation && isTitleInvalid ? "border-destructive" : "border-input"
              }`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              ref={titleInputRef}
              aria-invalid={showValidation && isTitleInvalid}
            />
            {showValidation && isTitleInvalid ? <p className="text-xs text-destructive">Title is required.</p> : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="cook-time">
              Cook time (minutes)
            </label>
            <input
              id="cook-time"
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                showValidation && isCookTimeInvalid ? "border-destructive" : "border-input"
              }`}
              type="number"
              min={0}
              value={cookTime}
              onChange={(event) => setCookTime(event.target.value)}
              aria-invalid={showValidation && isCookTimeInvalid}
            />
            {showValidation && isCookTimeInvalid ? (
              <p className="text-xs text-destructive">Enter 0 or greater.</p>
            ) : null}
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Ingredients</h3>
              <Button size="sm" variant="outline" onClick={handleIngredientAdd}>
                Add ingredient
              </Button>
            </div>
            {ingredients.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                No ingredients yet. Add at least one to continue.
              </p>
            ) : (
              <div className="grid gap-3">
                {ingredients.map((ingredient, index) => {
                  const isInvalid = showValidation && invalidIngredientIndexes.includes(index);
                  return (
                    <div
                      key={`${ingredient.id ?? "new"}-${index}`}
                      className={`grid gap-2 rounded-md border p-3 ${
                        isInvalid ? "border-destructive" : "border-border"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Ingredient {index + 1}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleIngredientMove(index, "up")}>
                            Up
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleIngredientMove(index, "down")}>
                            Down
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleIngredientRemove(index)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                      <input
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={ingredient.rawText}
                        onChange={(event) => handleIngredientChange(index, event.target.value)}
                        placeholder="e.g. 2 cups flour"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid ? <p className="text-xs text-destructive">Ingredient text is required.</p> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Steps</h3>
              <Button size="sm" variant="outline" onClick={handleStepAdd}>
                Add step
              </Button>
            </div>
            {steps.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                No steps yet. Add at least one to continue.
              </p>
            ) : (
              <div className="grid gap-3">
                {steps.map((step, index) => {
                  const isInvalid = showValidation && invalidStepIndexes.includes(index);
                  return (
                    <div
                      key={`${step.id ?? "new"}-${index}`}
                      className={`grid gap-2 rounded-md border p-3 ${
                        isInvalid ? "border-destructive" : "border-border"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleStepMove(index, "up")}>
                            Up
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleStepMove(index, "down")}>
                            Down
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleStepRemove(index)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                      <textarea
                        className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={step.stepText}
                        onChange={(event) => handleStepChange(index, event.target.value)}
                        placeholder="Describe this step"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid ? <p className="text-xs text-destructive">Step text is required.</p> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !isFormValid} aria-disabled={isSaving || !isFormValid}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};
