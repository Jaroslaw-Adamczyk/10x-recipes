import type { RecipeStepDto } from "@/types";

interface RecipeStepsSectionProps {
  steps: RecipeStepDto[];
}

export const RecipeStepsSection = ({ steps }: RecipeStepsSectionProps) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold">Steps</h2>
    {steps.length === 0 ? (
      <p className="text-sm text-muted-foreground">No steps available.</p>
    ) : (
      <ol className="space-y-3 text-sm text-foreground">
        {steps.map((step, index) => (
          <li key={step.id} className="rounded-md border border-border bg-card px-3 py-2 text-card-foreground">
            <span className="block text-xs text-muted-foreground">Step {index + 1}</span>
            <span className="mt-1 block">{step.step_text}</span>
          </li>
        ))}
      </ol>
    )}
  </section>
);
