"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Circle, CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Flashcard } from "@/components/shared/Flashcard";
import { cn } from "@/lib/utils";
import type { Flashcard as FlashcardType } from "@/types/learning";

interface FlashcardDeckProps {
  cards: FlashcardType[];
  onToggleLearned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onResetFilters?: () => void;
}

export function FlashcardDeck({
  cards,
  onToggleLearned,
  onToggleFavorite,
  onResetFilters,
}: FlashcardDeckProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [trackedCards, setTrackedCards] = useState(cards);

  if (cards !== trackedCards) {
    setTrackedCards(cards);
    setIndex(0);
    setFlipped(false);
  }

  if (cards.length === 0) {
    return (
      <EmptyState message="Keine Lernkarten gefunden." onReset={onResetFilters} />
    );
  }

  const safeIndex = Math.min(index, cards.length - 1);
  const currentCard = cards[safeIndex];

  function goTo(nextIndex: number) {
    setIndex(((nextIndex % cards.length) + cards.length) % cards.length);
    setFlipped(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Karte {safeIndex + 1} von {cards.length}
        </span>
        <span>{cards.filter((card) => card.learned).length} gelernt</span>
      </div>

      <Flashcard
        card={currentCard}
        flipped={flipped}
        onFlip={() => setFlipped((current) => !current)}
        onToggleFavorite={() => onToggleFavorite(currentCard.id)}
      />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" onClick={() => goTo(safeIndex - 1)}>
          <ChevronLeft className="size-4" />
          Vorherige
        </Button>
        <Button
          type="button"
          variant={currentCard.learned ? "secondary" : "default"}
          onClick={() => onToggleLearned(currentCard.id)}
        >
          {currentCard.learned ? <CircleCheck className="size-4" /> : <Circle className="size-4" />}
          {currentCard.learned ? "Als gelernt markiert" : "Als gelernt markieren"}
        </Button>
        <Button type="button" variant="outline" onClick={() => goTo(safeIndex + 1)}>
          Nächste
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card, cardIndex) => (
          <button
            key={card.id}
            type="button"
            onClick={() => goTo(cardIndex)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
              cardIndex === safeIndex
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <span className="truncate">{card.term}</span>
            {card.learned && <CircleCheck className="size-3.5 shrink-0 text-success" />}
          </button>
        ))}
      </div>
    </div>
  );
}
