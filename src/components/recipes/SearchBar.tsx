import { useCallback, useId, useState } from "react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onClear: () => void;
  error?: string | null;
  disabled?: boolean;
}

export const SearchBar = ({ value, onChange, onSubmit, onClear, error, disabled }: SearchBarProps) => {
  const inputId = useId();
  const [showHelper, setShowHelper] = useState(false);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        setShowHelper(true);
        return;
      }

      setShowHelper(false);
      onChange(normalized);
      onSubmit(normalized);
    },
    [onChange, onSubmit, value]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setShowHelper(false);
      onChange(event.target.value);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setShowHelper(false);
    onClear();
  }, [onClear]);

  const helperText = showHelper ? "Enter at least one ingredient keyword to search." : "Search by ingredient.";
  const helperStyle = error ? "text-destructive" : "text-muted-foreground";

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
        Ingredient search
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={inputId}
          className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="e.g. chicken, garlic"
          disabled={disabled}
          aria-describedby={`${inputId}-helper`}
        />
        <Button type="submit" disabled={disabled}>
          Search
        </Button>
        {value ? (
          <Button type="button" variant="outline" onClick={handleClear} disabled={disabled}>
            Clear
          </Button>
        ) : null}
      </div>
      <p className={`text-xs ${helperStyle}`} id={`${inputId}-helper`}>
        {error ?? helperText}
      </p>
    </form>
  );
};
