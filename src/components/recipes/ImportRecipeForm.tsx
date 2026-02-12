import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RecipeImportCreateCommand } from "@/types";
import { isValidUrl } from "./utils/recipeListUtils";

interface ImportRecipeFormProps {
  onSubmit: (command: RecipeImportCreateCommand) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  onDirtyChange: (dirty: boolean) => void;
}

export const ImportRecipeForm = ({ onSubmit, onCancel, isSubmitting, error, onDirtyChange }: ImportRecipeFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [sourceUrl, setSourceUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
  }, [error]);

  useEffect(() => {
    onDirtyChange(sourceUrl.trim().length > 0);
  }, [onDirtyChange, sourceUrl]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSubmit = () => {
    const trimmed = sourceUrl.trim();
    if (!trimmed) {
      setLocalError("Source URL is required.");
      return;
    }
    if (!isValidUrl(trimmed)) {
      setLocalError("Enter a valid URL.");
      return;
    }

    setLocalError(null);
    onSubmit({ source_url: trimmed });
  };

  const message = error ?? localError;

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium text-foreground" htmlFor="import-url">
        Recipe URL
      </label>
      <input
        id="import-url"
        ref={inputRef}
        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        type="url"
        value={sourceUrl}
        onChange={(event) => setSourceUrl(event.target.value)}
        placeholder="https://example.com/recipe"
        disabled={isSubmitting}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? errorId : undefined}
      />
      {message ? (
        <p className="text-xs text-destructive" id={errorId}>
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting} data-testid="button-cancel">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Importing..." : "Import recipe"}
        </Button>
      </div>
    </div>
  );
};
