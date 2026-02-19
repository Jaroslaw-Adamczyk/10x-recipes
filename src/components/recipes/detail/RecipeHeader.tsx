import { Button } from "@/components/ui/button";
import type { RecipeDto } from "@/types";
import { formatCookTime } from "@/components/recipes/utils/formatters";
import { StatusIndicator } from "../StatusIndicator";
import { SourceLink } from "../SourceLink";

interface RecipeHeaderProps {
  recipe: RecipeDto;
  onEdit: () => void;
  onDelete: () => void;
}

export const RecipeHeader = ({ recipe, onEdit, onDelete }: RecipeHeaderProps) => (
  <header className="group flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-semibold text-foreground">{recipe.title}</h1>

        {recipe.source_url && <SourceLink url={recipe.source_url} size="lg" />}

        <StatusIndicator status={recipe.status} size="lg" />
      </div>

      {recipe.cook_time_minutes !== null ? (
        <p className="text-sm text-muted-foreground">{formatCookTime(recipe.cook_time_minutes)}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Cook time not set</p>
      )}
    </div>

    <div className="flex gap-2">
      <Button variant="outline" onClick={onEdit}>
        Edit
      </Button>

      <Button variant="destructive" onClick={onDelete}>
        Delete
      </Button>
    </div>
  </header>
);
