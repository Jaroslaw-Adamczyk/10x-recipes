import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export interface IngredientItem {
  id: string;
  value: string;
}

interface IngredientListInputProps {
  ingredients: IngredientItem[];
  onChange: (ingredients: IngredientItem[]) => void;
  disabled?: boolean;
}

export const IngredientListInput = ({ ingredients, onChange, disabled }: IngredientListInputProps) => {
  const addIngredient = () => {
    onChange([...ingredients, { id: crypto.randomUUID(), value: "" }]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      onChange(ingredients.filter((ing) => ing.id !== id));
    } else {
      onChange([{ id: crypto.randomUUID(), value: "" }]);
    }
  };

  const updateIngredient = (id: string, value: string) => {
    onChange(ingredients.map((ing) => (ing.id === id ? { ...ing, value } : ing)));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newId = crypto.randomUUID();
      const newIngredients = [...ingredients];
      newIngredients.splice(index + 1, 0, { id: newId, value: "" });
      onChange(newIngredients);

      setTimeout(() => {
        const nextInput = document.querySelector(`[data-ingredient-id="${newId}"]`) as HTMLInputElement;
        nextInput?.focus();
      }, 0);
    } else if (e.key === "Backspace" && ingredients[index].value === "" && ingredients.length > 1) {
      e.preventDefault();
      const prevInput = document.querySelector(`[data-ingredient-index="${index - 1}"]`) as HTMLInputElement;
      removeIngredient(ingredients[index].id);
      setTimeout(() => prevInput?.focus(), 0);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground" id="ingredients-label">
        Ingredients
      </span>

      <div className="flex flex-col gap-2" role="group" aria-labelledby="ingredients-label">
        {ingredients.map((ing, index) => (
          <div key={ing.id} className="flex gap-2">
            <input
              className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              type="text"
              value={ing.value}
              onChange={(e) => updateIngredient(ing.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              placeholder={index === 0 ? "e.g. 1 cup flour" : ""}
              disabled={disabled}
              data-ingredient-id={ing.id}
              data-ingredient-index={index}
              data-testid={`input-recipe-ingredient-${index}`}
              aria-label={`Ingredient ${index + 1}`}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeIngredient(ing.id)}
              disabled={disabled || (ingredients.length === 1 && ing.value === "")}
              className="text-muted-foreground hover:text-destructive"
              title="Remove ingredient"
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addIngredient}
        disabled={disabled}
        className="mt-1 w-fit"
      >
        <PlusIcon className="size-4 mr-2" />
        Add ingredient
      </Button>
    </div>
  );
};
