"use client";

import { useMemo, useState } from "react";

import { sampleService } from "@/lib/services/sampleService";
import { useEntityList } from "@/hooks/shared/useEntityList";
import type { SampleFilter } from "@/components/shared/SampleFilters";
import type { Sample, SampleStatus } from "@/types/sample";

export interface SampleAdvancedFilters {
  projekt: string;
  kunde: string;
  pruefer: string;
  alter: string;
  datum: string;
}

export const emptyAdvancedFilters: SampleAdvancedFilters = {
  projekt: "Alle",
  kunde: "Alle",
  pruefer: "Alle",
  alter: "Alle",
  datum: "",
};

export function useSamples() {
  const { items: samples, update, remove, add, setItems } = useEntityList<Sample>(
    sampleService.getSamples(),
    (sample) => sample.id
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SampleFilter>("Alle");
  const [advancedFilters, setAdvancedFilters] = useState<SampleAdvancedFilters>(emptyAdvancedFilters);

  const activeSamples = useMemo(() => samples.filter((sample) => sample.status !== "Archiviert"), [samples]);

  const filteredSamples = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool = filter === "Archiviert" ? samples.filter((sample) => sample.status === "Archiviert") : activeSamples;

    return pool.filter((sample) => {
      const matchesChip =
        filter === "Alle" ||
        filter === "Archiviert" ||
        sample.fachbereich === filter ||
        sample.status === filter;

      const matchesSearch =
        query.length === 0 ||
        [sample.id, sample.bezeichnung, sample.kunde, sample.projekt, sample.probenart]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesProjekt = advancedFilters.projekt === "Alle" || sample.projekt === advancedFilters.projekt;
      const matchesKunde = advancedFilters.kunde === "Alle" || sample.kunde === advancedFilters.kunde;
      const matchesPruefer = advancedFilters.pruefer === "Alle" || sample.pruefer === advancedFilters.pruefer;
      const matchesAlter = advancedFilters.alter === "Alle" || sample.pruefalter === advancedFilters.alter;
      const matchesDatum = advancedFilters.datum === "" || sample.entnahmedatum === advancedFilters.datum;

      return (
        matchesChip &&
        matchesSearch &&
        matchesProjekt &&
        matchesKunde &&
        matchesPruefer &&
        matchesAlter &&
        matchesDatum
      );
    });
  }, [samples, activeSamples, search, filter, advancedFilters]);

  function resetFilters() {
    setSearch("");
    setFilter("Alle");
    setAdvancedFilters(emptyAdvancedFilters);
  }

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

  function bulkUpdateStatus(ids: string[], status: SampleStatus) {
    const idSet = new Set(ids);
    setItems((current) => current.map((item) => (idSet.has(item.id) ? { ...item, status } : item)));
  }

  function bulkUpdatePruefer(ids: string[], pruefer: string) {
    const idSet = new Set(ids);
    setItems((current) => current.map((item) => (idSet.has(item.id) ? { ...item, pruefer } : item)));
  }

  function bulkRemove(ids: string[]) {
    const idSet = new Set(ids);
    setItems((current) => current.filter((item) => !idSet.has(item.id)));
  }

  return {
    samples,
    filteredSamples,
    search,
    setSearch,
    filter,
    setFilter,
    advancedFilters,
    setAdvancedFilters,
    resetFilters,
    updateSample,
    archiveSample,
    restoreSample,
    removeSample,
    createSample,
    bulkUpdateStatus,
    bulkUpdatePruefer,
    bulkRemove,
  };
}
