import { memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { AutoGrowingTextarea } from "@/components/ui/auto-growing-textarea";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface StepItem {
  id: string;
  value: string;
}

interface StepListInputProps {
  steps: StepItem[];
  onChange: (steps: StepItem[]) => void;
  disabled?: boolean;
}

interface SortableStepProps {
  step: StepItem;
  index: number;
  disabled?: boolean;
  onUpdate: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
  isOnlyItem: boolean;
}

const SortableStep = memo(({ step, index, disabled, onUpdate, onRemove, onKeyDown, isOnlyItem }: SortableStepProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-center bg-background">
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-8 h-10 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        title="Drag to reorder"
      >
        <Bars3Icon className="size-4" />
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <AutoGrowingTextarea
          className="min-h-5 w-full"
          value={step.value}
          onChange={(e) => onUpdate(step.id, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index)}
          placeholder={index === 0 ? "e.g. Preheat oven to 180°C" : ""}
          disabled={disabled}
          data-step-id={step.id}
          data-step-index={index}
          data-testid={`input-recipe-step-${index}`}
          aria-label={`Step ${index + 1}`}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(step.id)}
        disabled={disabled || (isOnlyItem && step.value === "")}
        className="text-muted-foreground hover:text-destructive shrink-0 h-10"
        title="Remove step"
      >
        <TrashIcon className="size-4" />
      </Button>
    </div>
  );
});

SortableStep.displayName = "SortableStep";

export const StepListInput = ({ steps, onChange, disabled }: StepListInputProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addStep = useCallback(() => {
    onChange([...steps, { id: crypto.randomUUID(), value: "" }]);
  }, [steps, onChange]);

  const removeStep = useCallback(
    (id: string) => {
      if (steps.length > 1) {
        onChange(steps.filter((step) => step.id !== id));
      } else {
        onChange([{ id: crypto.randomUUID(), value: "" }]);
      }
    },
    [steps, onChange]
  );

  const updateStep = useCallback(
    (id: string, value: string) => {
      onChange(steps.map((step) => (step.id === id ? { ...step, value } : step)));
    },
    [steps, onChange]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = steps.findIndex((step) => step.id === active.id);
        const newIndex = steps.findIndex((step) => step.id === over.id);
        onChange(arrayMove(steps, oldIndex, newIndex));
      }
    },
    [steps, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const newId = crypto.randomUUID();
        const newSteps = [...steps];
        newSteps.splice(index + 1, 0, { id: newId, value: "" });
        onChange(newSteps);

        setTimeout(() => {
          const nextInput = document.querySelector(`[data-step-id="${newId}"]`) as HTMLTextAreaElement;
          nextInput?.focus();
        }, 0);
      } else if (e.key === "Backspace" && steps[index].value === "" && steps.length > 1) {
        e.preventDefault();
        const prevInput = document.querySelector(`[data-step-index="${index - 1}"]`) as HTMLTextAreaElement;
        removeStep(steps[index].id);
        setTimeout(() => prevInput?.focus(), 0);
      }
    },
    [steps, onChange, removeStep]
  );

  const stepIds = useMemo(() => steps.map((s) => s.id), [steps]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground" id="steps-label">
        Steps
      </span>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stepIds}>
          <div className="flex flex-col gap-2" role="group" aria-labelledby="steps-label">
            {steps.map((step, index) => (
              <SortableStep
                key={step.id}
                step={step}
                index={index}
                disabled={disabled}
                onUpdate={updateStep}
                onRemove={removeStep}
                onKeyDown={handleKeyDown}
                isOnlyItem={steps.length === 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" size="sm" onClick={addStep} disabled={disabled} className="mt-1 w-fit">
        <PlusIcon className="size-4 mr-2" />
        Add step
      </Button>
    </div>
  );
};
