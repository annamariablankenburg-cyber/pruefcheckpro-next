"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2, GraduationCap, Heart, Info, ListTodo, Percent } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { FlashcardDeck } from "@/components/shared/FlashcardDeck";
import { FormulaCard } from "@/components/shared/FormulaCard";
import { GlossaryList } from "@/components/shared/GlossaryList";
import { LearningFilters } from "@/components/shared/LearningFilters";
import { LearningProgressCard } from "@/components/shared/LearningProgressCard";
import { LearningTabs } from "@/components/shared/LearningTabs";
import { NormReferenceCard } from "@/components/shared/NormReferenceCard";
import { StatCard } from "@/components/shared/StatCard";
import { formulas, glossaryTerms, normDisclaimer, norms } from "@/config/learning";
import { useLearning } from "@/hooks/useLearning";
import type { LearningTab, LearningTabId } from "@/types/learning";

const learningTabs: LearningTab[] = [
  { value: "lernkarten", label: "Lernkarten" },
  { value: "formeln", label: "Formelsammlung" },
  { value: "normen", label: "Normenübersicht" },
  { value: "glossar", label: "Glossar" },
  { value: "favoriten", label: "Favoriten" },
  { value: "fortschritt", label: "Lernfortschritt" },
];

const learningCategories = ["Beton", "Asphalt", "Geotechnik", "Fachrechnen", "Normen"] as const;

export default function LernenPage() {
  const {
    filteredCards,
    cards,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    toggleLearned,
    toggleFavorite,
    stats,
    categoryProgress,
  } = useLearning();
  const [activeTab, setActiveTab] = useState<LearningTabId>("lernkarten");

  const isCategoryFilterActive = (learningCategories as readonly string[]).includes(filter);
  const query = search.trim().toLowerCase();

  const filteredFormulas = useMemo(
    () =>
      formulas.filter(
        (formula) =>
          (!isCategoryFilterActive || filter === formula.category) &&
          (query.length === 0 ||
            formula.name.toLowerCase().includes(query) ||
            formula.formula.toLowerCase().includes(query))
      ),
    [filter, isCategoryFilterActive, query]
  );

  const filteredNorms = useMemo(
    () =>
      norms.filter(
        (norm) =>
          (!isCategoryFilterActive || filter === norm.category) &&
          (query.length === 0 ||
            norm.code.toLowerCase().includes(query) ||
            norm.title.toLowerCase().includes(query) ||
            norm.summary.toLowerCase().includes(query))
      ),
    [filter, isCategoryFilterActive, query]
  );

  const filteredGlossary = useMemo(
    () =>
      glossaryTerms.filter(
        (term) =>
          query.length === 0 ||
          term.term.toLowerCase().includes(query) ||
          term.definition.toLowerCase().includes(query)
      ),
    [query]
  );

  const favoriteCards = useMemo(
    () =>
      cards.filter(
        (card) =>
          card.favorite &&
          (query.length === 0 ||
            card.term.toLowerCase().includes(query) ||
            card.definition.toLowerCase().includes(query))
      ),
    [cards, query]
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Lernen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lernkarten, Formeln, Normen und Glossar für deine Prüfungsvorbereitung.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={GraduationCap}
          label="Lernfortschritt"
          value={`${stats.progressPercent}%`}
          tone="success"
        />
        <StatCard icon={ListTodo} label="Offene Karten" value={stats.openCount} tone="warning" />
        <StatCard icon={CalendarCheck2} label="Heute gelernt" value={stats.learnedToday} />
        <StatCard icon={Percent} label="Quizquote" value={`${stats.quizQuote}%`} />
        <StatCard icon={Heart} label="Favoriten" value={stats.favoriteCount} />
      </div>

      <LearningFilters search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} />

      <LearningTabs tabs={learningTabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === "lernkarten" && (
        <FlashcardDeck
          cards={filteredCards}
          onToggleLearned={toggleLearned}
          onToggleFavorite={toggleFavorite}
          onResetFilters={resetFilters}
        />
      )}

      {activeTab === "formeln" &&
        (filteredFormulas.length === 0 ? (
          <EmptyState message="Keine Formeln gefunden." onReset={resetFilters} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFormulas.map((formula) => (
              <FormulaCard key={formula.id} formula={formula} />
            ))}
          </div>
        ))}

      {activeTab === "normen" && (
        <div className="flex flex-col gap-4">
          <Card className="border-dashed">
            <CardContent className="flex items-start gap-3 py-4">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{normDisclaimer}</p>
            </CardContent>
          </Card>
          {filteredNorms.length === 0 ? (
            <EmptyState message="Keine Normen gefunden." onReset={resetFilters} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredNorms.map((norm) => (
                <NormReferenceCard key={norm.id} norm={norm} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "glossar" &&
        (filteredGlossary.length === 0 ? (
          <EmptyState message="Keine Begriffe gefunden." onReset={resetFilters} />
        ) : (
          <GlossaryList terms={filteredGlossary} />
        ))}

      {activeTab === "favoriten" && (
        <FlashcardDeck
          cards={favoriteCards}
          onToggleLearned={toggleLearned}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {activeTab === "fortschritt" && (
        <LearningProgressCard
          overallPercent={stats.progressPercent}
          learnedCount={stats.learnedCount}
          total={stats.total}
          categoryProgress={categoryProgress}
        />
      )}
    </div>
  );
}
