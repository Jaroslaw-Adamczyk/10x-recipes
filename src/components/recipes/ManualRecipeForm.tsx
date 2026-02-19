import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AutoGrowingTextarea } from "@/components/ui/auto-growing-textarea";
import type { RecipeCreateCommand } from "@/types";
import { normalizeIngredientName, normalizeText } from "./utils/recipeListUtils";
import { IngredientListInput, type IngredientItem } from "./IngredientListInput";

interface ManualRecipeFormProps {
  onSubmit: (command: RecipeCreateCommand) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  onDirtyChange: (dirty: boolean) => void;
}

export const ManualRecipeForm = ({ onSubmit, onCancel, isSubmitting, error, onDirtyChange }: ManualRecipeFormProps) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState<IngredientItem[]>([{ id: crypto.randomUUID(), value: "" }]);
  const [steps, setSteps] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
  }, [error]);

  useEffect(() => {
    const isDirty =
      title.trim().length > 0 ||
      ingredients.some((ing) => ing.value.trim().length > 0) ||
      steps.trim().length > 0 ||
      cookTime.trim().length > 0;
    onDirtyChange(isDirty);
  }, [cookTime, ingredients, onDirtyChange, steps, title]);

  useEffect(() => {
    requestAnimationFrame(() => titleRef.current?.focus());
  }, []);

  const buildIngredients = (items: IngredientItem[]) =>
    items
      .map((ing) => normalizeText(ing.value))
      .filter(Boolean)
      .map((line, index) => ({
        raw_text: line,
        normalized_name: normalizeIngredientName(line),
        position: index + 1,
      }));

  const buildSteps = (value: string) =>
    value
      .split("\n")
      .map((line) => normalizeText(line))
      .filter(Boolean)
      .map((line, index) => ({
        step_text: line,
        position: index + 1,
      }));

  const handleSubmit = () => {
    const trimmedTitle = normalizeText(title);
    if (!trimmedTitle) {
      setLocalError("Title is required.");
      return;
    }

    const ingredientItems = buildIngredients(ingredients);
    if (ingredientItems.length === 0) {
      setLocalError("Add at least one ingredient.");
      return;
    }

    const stepItems = buildSteps(steps);
    if (stepItems.length === 0) {
      setLocalError("Add at least one step.");
      return;
    }

    const cookTimeValue = cookTime.trim() === "" ? null : Number(cookTime);
    if (cookTimeValue !== null && (Number.isNaN(cookTimeValue) || cookTimeValue < 0)) {
      setLocalError("Cook time must be a positive number.");
      return;
    }

    setLocalError(null);
    onSubmit({
      title: trimmedTitle,
      cook_time_minutes: cookTimeValue,
      source_url: null,
      ingredients: ingredientItems,
      steps: stepItems,
    });
  };

  const message = error ?? localError;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="manual-title">
          Title
        </label>
        <input
          id="manual-title"
          ref={titleRef}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Recipe title"
          disabled={isSubmitting}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? errorId : undefined}
          data-testid="input-recipe-title"
        />
      </div>

      <IngredientListInput ingredients={ingredients} onChange={setIngredients} disabled={isSubmitting} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="manual-steps">
          Steps (one per line)
        </label>
        <AutoGrowingTextarea
          id="manual-steps"
          value={steps}
          onChange={(event) => setSteps(event.target.value)}
          placeholder="Mix the batter"
          disabled={isSubmitting}
          data-testid="input-recipe-steps"
          className="max-h-[400px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="manual-cooktime">
          Cook time (minutes)
        </label>
        <input
          id="manual-cooktime"
          className="h-10 w-40 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          type="number"
          min={0}
          value={cookTime}
          onChange={(event) => setCookTime(event.target.value)}
          placeholder="30"
          disabled={isSubmitting}
          data-testid="input-recipe-cooktime"
        />
      </div>

      {message ? (
        <p className="text-xs text-destructive" id={errorId}>
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting} data-testid="button-cancel">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} data-testid="button-create-recipe">
          {isSubmitting ? "Saving..." : "Create recipe"}
        </Button>
      </div>
    </div>
  );
};
