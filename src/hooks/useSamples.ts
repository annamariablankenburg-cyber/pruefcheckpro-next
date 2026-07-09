"use client";

import { sampleService } from "@/lib/services/sampleService";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { SampleFilter } from "@/components/shared/SampleFilters";
import type { Sample } from "@/types/sample";

export function useSamples() {
  const { items: samples, update, remove, add } = useEntityList<Sample>(
    sampleService.getSamples(),
    (sample) => sample.id
  );

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredSamples,
    resetFilters,
  } = useSearchAndFilter<Sample, SampleFilter>(samples, {
    defaultFilter: "Alle",
    archivedFilterValue: "Archiviert",
    isArchived: (sample) => sample.status === "Archiviert",
    matchesFilter: (sample, filterValue) =>
      (filterValue === "Beton" && sample.fachbereich === "Beton") ||
      (filterValue === "Asphalt" && sample.fachbereich === "Asphalt") ||
      (filterValue === "Geotechnik" && sample.fachbereich === "Geotechnik") ||
      filterValue === sample.status,
    matchesSearch: (sample, query) =>
      [sample.id, sample.bezeichnung, sample.kunde, sample.projekt, sample.probenart]
        .join(" ")
        .toLowerCase()
        .includes(query),
  });

  function updateSample(id: string, changes: Partial<Sample>) {
    update(id, changes);
  }

  function archiveSample(id: string) {
    update(id, { status: "Archiviert" });
  }

  function restoreSample(id: string) {
    update(id, { status: "Abgeschlossen" });
  }

  function removeSample(id: string) {
    remove(id);
  }

  function createSample(sample: Sample) {
    add(sample);
  }

  return {
    samples,
    filteredSamples,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateSample,
    archiveSample,
    restoreSample,
    removeSample,
    createSample,
  };
}
