import { Button } from "@/components/ui/button";
import type { RecipeDto } from "@/types";
import { formatCookTime } from "@/components/recipes/utils/formatters";

interface RecipeHeaderProps {
  recipe: RecipeDto;
  onEdit: () => void;
  onDelete: () => void;
}

export const RecipeHeader = ({ recipe, onEdit, onDelete }: RecipeHeaderProps) => (
  <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-foreground">{recipe.title}</h1>
      {recipe.cook_time_minutes !== null ? (
        <p className="text-sm text-muted-foreground">{formatCookTime(recipe.cook_time_minutes)}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Cook time not set</p>
      )}
    </div>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={onEdit}>
        Edit
      </Button>
      <Button variant="destructive" onClick={onDelete}>
        Delete
      </Button>
    </div>
  </header>
);
