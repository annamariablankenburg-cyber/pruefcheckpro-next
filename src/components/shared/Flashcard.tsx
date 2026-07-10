"use client";

import { Check, RotateCw, Star } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { cn } from "@/lib/utils";
import type { Flashcard as FlashcardType } from "@/types/learning";

interface FlashcardProps {
  card: FlashcardType;
  flipped: boolean;
  onFlip: () => void;
  onToggleFavorite: () => void;
}

export function Flashcard({ card, flipped, onFlip, onToggleFavorite }: FlashcardProps) {
  return (
    <div className="[perspective:1200px]">
      <motion.div
        role="button"
        tabIndex={0}
        onClick={onFlip}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onFlip();
          }
        }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="relative h-64 w-full cursor-pointer [transform-style:preserve-3d] sm:h-72"
      >
        <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm shadow-foreground/5 [backface-visibility:hidden]">
          <div className="flex items-start justify-between gap-2">
            <CategoryBadge category={card.category} />
            <div className="flex items-center gap-1.5">
              {card.learned && (
                <span className="flex size-6 items-center justify-center rounded-full bg-success/10 text-success">
                  <Check className="size-3.5" />
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite();
                }}
                aria-label={card.favorite ? "Favorit entfernen" : "Als Favorit markieren"}
              >
                <Star className={cn("size-4", card.favorite && "fill-warning text-warning")} />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center text-center">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {card.term}
            </h3>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <RotateCw className="size-3.5" />
            Klicken zum Umdrehen
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm shadow-foreground/5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex items-start justify-between gap-2">
            <CategoryBadge category={card.category} />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite();
              }}
              aria-label={card.favorite ? "Favorit entfernen" : "Als Favorit markieren"}
            >
              <Star className={cn("size-4", card.favorite && "fill-warning text-warning")} />
            </Button>
          </div>

          <div className="flex flex-1 items-center overflow-y-auto py-2">
            <p className="text-sm leading-relaxed text-foreground sm:text-base">{card.definition}</p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <RotateCw className="size-3.5" />
            Klicken zum Umdrehen
          </div>
        </div>
      </motion.div>
    </div>
  );
}
