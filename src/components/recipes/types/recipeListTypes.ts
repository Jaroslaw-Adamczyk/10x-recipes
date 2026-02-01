export interface RecipeListErrorViewModel {
  message: string;
  statusCode?: number;
  context?: "load" | "search" | "import" | "create" | "delete" | "refresh";
}
