"use client";

import { testValueService } from "@/lib/services/testValueService";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { TestEntryFilter } from "@/components/shared/TestEntryFilters";
import type { TestEntry } from "@/types/testValue";

export function useTestEntries() {
  const { items: entries, update } = useEntityList<TestEntry>(
    testValueService.getTestEntries(),
    (entry) => entry.sampleId
  );

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredEntries,
    resetFilters,
  } = useSearchAndFilter<TestEntry, TestEntryFilter>(entries, {
    defaultFilter: "Alle",
    matchesFilter: (entry, filterValue) =>
      (filterValue === "Beton" && entry.fachbereich === "Beton") ||
      (filterValue === "Asphalt" && entry.fachbereich === "Asphalt") ||
      (filterValue === "Geotechnik" && entry.fachbereich === "Geotechnik") ||
      filterValue === entry.status,
    matchesSearch: (entry, query) =>
      [entry.sampleId, entry.titel, entry.projekt, entry.pruefer].join(" ").toLowerCase().includes(query),
  });

  function updateEntry(sampleId: string, changes: Partial<TestEntry>) {
    update(sampleId, changes);
  }

  return {
    entries,
    filteredEntries,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateEntry,
  };
}
