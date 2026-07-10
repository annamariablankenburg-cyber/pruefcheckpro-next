"use client";

import { useMemo, useState } from "react";

import { flashcards as initialFlashcards } from "@/config/learning";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { LearningFilter } from "@/components/shared/LearningFilters";
import type { Flashcard } from "@/types/learning";

// Mock-Quote, bis Quiz- und Lernbereich echte, geteilte Fortschrittsdaten haben.
const MOCK_QUIZ_QUOTE = 78;
const INITIAL_LEARNED_TODAY = 4;

export function useLearning() {
  const { items: cards, update } = useEntityList<Flashcard>(
    initialFlashcards,
    (card) => card.id
  );
  const [learnedToday, setLearnedToday] = useState(INITIAL_LEARNED_TODAY);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredCards,
    resetFilters,
  } = useSearchAndFilter<Flashcard, LearningFilter>(cards, {
    defaultFilter: "Alle",
    matchesFilter: (card, filterValue) =>
      filterValue === "Favoriten"
        ? card.favorite
        : filterValue === "Noch offen"
          ? !card.learned
          : filterValue === "Gelernt"
            ? card.learned
            : filterValue === card.category,
    matchesSearch: (card, query) =>
      card.term.toLowerCase().includes(query) || card.definition.toLowerCase().includes(query),
  });

  function toggleLearned(id: string) {
    const card = cards.find((item) => item.id === id);
    if (!card) return;
    setLearnedToday((current) => Math.max(0, current + (card.learned ? -1 : 1)));
    update(id, { learned: !card.learned });
  }

  function toggleFavorite(id: string) {
    const card = cards.find((item) => item.id === id);
    if (!card) return;
    update(id, { favorite: !card.favorite });
  }

  const stats = useMemo(() => {
    const total = cards.length;
    const learnedCount = cards.filter((card) => card.learned).length;
    const favoriteCount = cards.filter((card) => card.favorite).length;
    return {
      total,
      learnedCount,
      progressPercent: total === 0 ? 0 : Math.round((learnedCount / total) * 100),
      openCount: total - learnedCount,
      learnedToday,
      quizQuote: MOCK_QUIZ_QUOTE,
      favoriteCount,
    };
  }, [cards, learnedToday]);

  const categoryProgress = useMemo(() => {
    const categories = Array.from(new Set(cards.map((card) => card.category)));
    return categories.map((category) => {
      const inCategory = cards.filter((card) => card.category === category);
      const learned = inCategory.filter((card) => card.learned).length;
      return {
        category,
        total: inCategory.length,
        learned,
        percent: inCategory.length === 0 ? 0 : Math.round((learned / inCategory.length) * 100),
      };
    });
  }, [cards]);

  return {
    cards,
    filteredCards,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    toggleLearned,
    toggleFavorite,
    stats,
    categoryProgress,
  };
}
