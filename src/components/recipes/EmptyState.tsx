import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  variant: "no-recipes" | "no-matches";
  onAdd: () => void;
}

export const EmptyState = ({ variant, onAdd }: EmptyStateProps) => (
  <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-card-foreground">
    <h2 className="text-lg font-semibold">{variant === "no-recipes" ? "No recipes yet" : "No matching recipes"}</h2>
    <p className="mt-2 text-sm text-muted-foreground">
      {variant === "no-recipes"
        ? "Start by importing a recipe URL or adding one manually."
        : "Try another ingredient keyword or clear your search."}
    </p>
    {variant === "no-recipes" ? (
      <Button className="mt-4" onClick={onAdd}>
        Add recipe
      </Button>
    ) : null}
  </div>
);
