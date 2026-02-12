import type { RecipeListItemDto } from "@/types";
import { RecipeRow } from "./RecipeRow";

interface RecipeListProps {
  items: RecipeListItemDto[];
  onSelect: (id: string) => void;
  onDelete: (item: RecipeListItemDto) => void;
  "data-testid"?: string;
}

export const RecipeList = ({ items, onSelect, onDelete, "data-testid": dataTestId }: RecipeListProps) => (
  <ul className="flex flex-col gap-3" data-testid={dataTestId}>
    {items.map((item) => (
      <li key={item.id}>
        <RecipeRow item={item} onSelect={() => onSelect(item.id)} onDelete={() => onDelete(item)} />
      </li>
    ))}
  </ul>
);
