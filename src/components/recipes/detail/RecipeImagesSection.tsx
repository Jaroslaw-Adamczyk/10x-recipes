import { useEffect, useState } from "react";

import type { RecipeImageWithUrlDto } from "@/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "@/components/ui/carousel";

interface RecipeImagesSectionProps {
  recipeId: string;
  /** Increment to trigger a refetch (e.g. after adding images in edit modal). */
  refreshKey?: number;
}

export const RecipeImagesSection = ({ recipeId, refreshKey = 0 }: RecipeImagesSectionProps) => {
  const [images, setImages] = useState<RecipeImageWithUrlDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/recipes/${recipeId}/images`);
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? "Unable to load images.");
          return;
        }

        const data = (await response.json()) as RecipeImageWithUrlDto[];
        setImages(data);
      } catch {
        setError("Network error while loading images.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadImages();
  }, [recipeId, refreshKey]);

  const hasImages = images.length > 0;

  if (!hasImages) {
    return;
  }

  return (
    <section>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading images…</p>
      ) : (
        <Carousel className="relative w-full" opts={{ loop: true }}>
          <CarouselContent className="items-stretch">
            {images.map((image) => (
              <CarouselItem key={image.id}>
                <div className="relative flex max-h-[500px] w-full items-center justify-center overflow-hidden rounded-md">
                  <img src={image.url} alt="Recipe" className="h-full w-full object-contain" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselDots />
        </Carousel>
      )}
    </section>
  );
};
