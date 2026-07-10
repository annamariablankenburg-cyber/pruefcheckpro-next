"use client";

import { useMemo } from "react";

import { fieldAreas } from "@/config/fieldAreas";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { FieldAreaFilterTag, FieldAreaId, FieldAreaProcedure } from "@/types/fieldArea";

export type FieldAreaProcedureFilter = FieldAreaFilterTag | "Alle" | "Favoriten";

// Ein Hook für alle drei Fachbereichsseiten (/beton, /asphalt, /geotechnik) –
// bewusst datengetrieben über config/fieldAreas.ts statt drei getrennter
// Implementierungen.
export function useFieldArea(id: FieldAreaId) {
  const config = fieldAreas[id];

  const { items: procedures, update } = useEntityList<FieldAreaProcedure>(
    config.procedures,
    (procedure) => procedure.id
  );

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredProcedures,
    resetFilters,
  } = useSearchAndFilter<FieldAreaProcedure, FieldAreaProcedureFilter>(procedures, {
    defaultFilter: "Alle",
    matchesFilter: (procedure, filterValue) =>
      filterValue === "Favoriten"
        ? procedure.favorite
        : procedure.tags.includes(filterValue as FieldAreaFilterTag),
    matchesSearch: (procedure, query) =>
      procedure.title.toLowerCase().includes(query) ||
      procedure.shortDescription.toLowerCase().includes(query) ||
      procedure.category.toLowerCase().includes(query),
  });

  function toggleFavorite(procedureId: string) {
    const procedure = procedures.find((item) => item.id === procedureId);
    if (!procedure) return;
    update(procedureId, { favorite: !procedure.favorite });
  }

  function toggleLearned(procedureId: string) {
    const procedure = procedures.find((item) => item.id === procedureId);
    if (!procedure) return;
    update(procedureId, { learned: !procedure.learned });
  }

  const stats = useMemo(() => {
    const total = procedures.length;
    const learned = procedures.filter((procedure) => procedure.learned).length;
    return {
      procedureCount: total,
      calculatorCount: config.calculators.length,
      normCount: config.norms.length,
      favoriteCount: procedures.filter((procedure) => procedure.favorite).length,
      learningProgress: total === 0 ? 0 : Math.round((learned / total) * 100),
      learnedCount: learned,
    };
  }, [procedures, config.calculators.length, config.norms.length]);

  const categoryProgress = useMemo(() => {
    const categories = Array.from(new Set(procedures.map((procedure) => procedure.category)));
    return categories.map((category) => {
      const inCategory = procedures.filter((procedure) => procedure.category === category);
      const learned = inCategory.filter((procedure) => procedure.learned).length;
      return {
        category,
        total: inCategory.length,
        learned,
        percent: inCategory.length === 0 ? 0 : Math.round((learned / inCategory.length) * 100),
      };
    });
  }, [procedures]);

  const filterOptions = useMemo<FieldAreaProcedureFilter[]>(
    () => ["Alle", ...config.applicableFilterTags, "Favoriten"],
    [config.applicableFilterTags]
  );

  return {
    config,
    procedures,
    filteredProcedures,
    search,
    setSearch,
    filter,
    setFilter,
    filterOptions,
    resetFilters,
    toggleFavorite,
    toggleLearned,
    stats,
    categoryProgress,
  };
}
