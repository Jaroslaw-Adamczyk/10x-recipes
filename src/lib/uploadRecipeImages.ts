import { apiClient } from "@/lib/apiClient";

export async function uploadRecipeImages(recipeId: string, files: File[]): Promise<void> {
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    await apiClient.postForm<undefined>(`/api/recipes/${recipeId}/images`, formData);
  }
}
