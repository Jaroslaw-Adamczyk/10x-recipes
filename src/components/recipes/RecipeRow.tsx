import type { RecipeListItemDto } from "@/types";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "./StatusIndicator";

interface RecipeRowProps {
  item: RecipeListItemDto;
  onSelect: () => void;
  onDelete: () => void;
}

export const RecipeRow = ({ item, onSelect, onDelete }: RecipeRowProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      aria-label={`Open recipe ${item.title}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground transition hover:border-primary/40"
      data-testid="recipe-item"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground">{item.title}</p>
          {item.ingredients_preview.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {item.ingredients_preview.slice(0, 5).join(", ")}
              {item.ingredients_preview.length > 5 ? "..." : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">No ingredients preview yet.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusIndicator status={item.status} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Delete recipe ${item.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      {item.error_message ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {item.error_message}
        </p>
      ) : null}
    </div>
  );
};
