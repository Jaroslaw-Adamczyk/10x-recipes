import type { RecipeListItemDto } from "@/types";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "./StatusIndicator";
import { SourceLink } from "./SourceLink";
import { RECIPE_ROW_THUMBNAIL_SIZE } from "@/lib/services/recipes/listRecipes";

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
      className="group flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground transition hover:border-primary/40"
      data-testid="recipe-item"
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className="flex shrink-0  items-center justify-center overflow-hidden rounded-md border border-border bg-muted"
          style={{ width: RECIPE_ROW_THUMBNAIL_SIZE, height: RECIPE_ROW_THUMBNAIL_SIZE }}
        >
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground" aria-hidden>
              No image
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-foreground">{item.title}</p>

            {item.source_url && <SourceLink url={item.source_url} />}

            <StatusIndicator status={item.status} />
          </div>
          {item.ingredients_preview.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {item.ingredients_preview.slice(0, 8).join(", ")}
              {item.ingredients_preview.length > 8 ? "..." : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">No ingredients preview yet.</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            variant="destructive"
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
