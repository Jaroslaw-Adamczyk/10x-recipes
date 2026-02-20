import { z } from "zod";

export const recipeFormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  ingredients: z
    .array(z.object({ id: z.string(), value: z.string() }))
    .refine((items) => items.some((item) => item.value.trim().length > 0), "Add at least one ingredient."),
  steps: z
    .array(z.object({ id: z.string(), value: z.string() }))
    .refine((items) => items.some((item) => item.value.trim().length > 0), "Add at least one step."),
  cookTime: z.string().refine((val) => {
    if (val.trim() === "") return true;
    const num = Number(val);
    return !Number.isNaN(num) && num >= 0;
  }, "Cook time must be a positive number."),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
