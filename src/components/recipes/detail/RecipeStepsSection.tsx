import type { RecipeStepDto } from "@/types";

interface RecipeStepsSectionProps {
  steps: RecipeStepDto[];
}

export const RecipeStepsSection = ({ steps }: RecipeStepsSectionProps) => (
  <section className="space-y-3 bg-card rounded-md p-6">
    <h2 className="text-lg font-semibold">Steps</h2>
    {steps.length === 0 ? (
      <p className="text-sm text-muted-foreground">No steps available.</p>
    ) : (
      <ol className="divide-y divide-dotted divide-border text-sm text-foreground">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xs font-bold text-primary">
              {index + 1}
            </span>
            <div className="space-y-1">
              <span className="block leading-relaxed">{step.step_text}</span>
            </div>
          </li>
        ))}
      </ol>
    )}
  </section>
);
