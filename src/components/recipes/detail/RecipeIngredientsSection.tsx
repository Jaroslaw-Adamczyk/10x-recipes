import type { RecipeIngredientDto } from "@/types";

interface RecipeIngredientsSectionProps {
  ingredients: RecipeIngredientDto[];
}

export const RecipeIngredientsSection = ({ ingredients }: RecipeIngredientsSectionProps) => (
  <div className="space-y-3 bg-card rounded-md p-6">
    <h2 className="text-2xl font-semibold">Ingredients</h2>
    {ingredients.length === 0 ? (
      <p className="text-sm text-muted-foreground">No ingredients available.</p>
    ) : (
      <ul className="divide-y divide-dotted divide-border text-sm text-foreground list-disc list-outside px-4">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id} className="text-base py-2 first:pt-0 last:pb-0 ">
            {ingredient.raw_text}
          </li>
        ))}
      </ul>
    )}
  </div>
);
