import type { RecipeIngredientDto } from "@/types";

interface RecipeIngredientsSectionProps {
  ingredients: RecipeIngredientDto[];
}

export const RecipeIngredientsSection = ({ ingredients }: RecipeIngredientsSectionProps) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold">Ingredients</h2>
    {ingredients.length === 0 ? (
      <p className="text-sm text-muted-foreground">No ingredients available.</p>
    ) : (
      <ul className="space-y-2 text-sm text-foreground">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id} className="rounded-md border border-border bg-card px-3 py-2 text-card-foreground">
            {ingredient.raw_text}
          </li>
        ))}
      </ul>
    )}
  </section>
);
