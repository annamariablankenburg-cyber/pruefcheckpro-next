"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { sampleService } from "@/lib/services/sampleService";
import type { SampleFilter } from "@/components/shared/SampleFilters";
import type { BulkResult } from "@/lib/interfaces/ISampleService";
import type { Sample } from "@/types/sample";

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

// Lädt Proben über sampleService (Mock oder Firestore, siehe
// src/config/dataSource.ts) und hält sie als lokalen State. Mutationen laufen
// über den Service und aktualisieren den lokalen State optimistisch mit dem
// vom Service zurückgegebenen Ergebnis. Die Tabellenauswahl (für die
// Massenerfassung) lebt ebenfalls hier, damit sie nach Archivieren/Löschen
// zentral bereinigt werden kann, statt das in jeder aufrufenden Komponente
// separat nachzuziehen.
export function useSamples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SampleFilter>("Alle");
  const [advancedFilters, setAdvancedFilters] = useState<SampleAdvancedFilters>(emptyAdvancedFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const refreshSamples = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sampleService.getSamples();
      setSamples(data);
    } catch {
      setError("Probendaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lädt die Probenliste beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSamples();
  }, [refreshSamples]);

  const activeSamples = useMemo(
    () => samples.filter((sample) => sample.status !== "Archiviert"),
    [samples]
  );

  const filteredSamples = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool =
      filter === "Archiviert" ? samples.filter((sample) => sample.status === "Archiviert") : activeSamples;

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

  const selectedSamples = useMemo(
    () => samples.filter((sample) => selectedIds.has(sample.id)),
    [samples, selectedIds]
  );

  function resetFilters() {
    setSearch("");
    setFilter("Alle");
    setAdvancedFilters(emptyAdvancedFilters);
  }

  function dropFromSelection(ids: Iterable<string>) {
    setSelectedIds((current) => {
      let changed = false;
      const next = new Set(current);
      for (const id of ids) {
        if (next.delete(id)) changed = true;
      }
      return changed ? next : current;
    });
  }

  function replaceSample(updated: Sample | undefined) {
    if (!updated) return;
    setSamples((current) => current.map((sample) => (sample.id === updated.id ? updated : sample)));
  }

  async function createSample(sample: Sample): Promise<Sample> {
    const created = await sampleService.createSample(sample);
    setSamples((current) => [created, ...current]);
    return created;
  }

  async function updateSample(id: string, changes: Partial<Sample>) {
    const updated = await sampleService.updateSample(id, changes);
    replaceSample(updated);
    return updated;
  }

  async function startSample(id: string) {
    const updated = await sampleService.startSample(id);
    replaceSample(updated);
    return updated;
  }

  async function completeSample(id: string) {
    const updated = await sampleService.completeSample(id);
    replaceSample(updated);
    return updated;
  }

  async function reopenSample(id: string) {
    const updated = await sampleService.reopenSample(id);
    replaceSample(updated);
    return updated;
  }

  async function archiveSample(id: string) {
    const updated = await sampleService.archiveSample(id);
    replaceSample(updated);
    dropFromSelection([id]);
    return updated;
  }

  async function reactivateSample(id: string) {
    const updated = await sampleService.reactivateSample(id);
    replaceSample(updated);
    return updated;
  }

  async function duplicateSample(id: string): Promise<Sample> {
    const created = await sampleService.duplicateSample(id);
    setSamples((current) => [created, ...current]);
    return created;
  }

  async function removeSample(id: string) {
    const success = await sampleService.removeSample(id);
    if (success) {
      setSamples((current) => current.filter((sample) => sample.id !== id));
      dropFromSelection([id]);
    }
    return success;
  }

  async function bulkUpdateSamples(ids: string[], changes: Partial<Sample>): Promise<BulkResult> {
    const result = await sampleService.bulkUpdateSamples(ids, changes);
    if (result.succeededIds.length > 0) {
      const succeeded = new Set(result.succeededIds);
      setSamples((current) =>
        current.map((sample) => (succeeded.has(sample.id) ? { ...sample, ...changes } : sample))
      );
    }
    return result;
  }

  async function bulkArchiveSamples(ids: string[]): Promise<BulkResult> {
    const result = await sampleService.bulkArchiveSamples(ids);
    if (result.succeededIds.length > 0) {
      const succeeded = new Set(result.succeededIds);
      setSamples((current) =>
        current.map((sample) => (succeeded.has(sample.id) ? { ...sample, status: "Archiviert" } : sample))
      );
      dropFromSelection(result.succeededIds);
    }
    return result;
  }

  async function bulkRemoveSamples(ids: string[]): Promise<BulkResult> {
    const result = await sampleService.bulkRemoveSamples(ids);
    if (result.succeededIds.length > 0) {
      const succeeded = new Set(result.succeededIds);
      setSamples((current) => current.filter((sample) => !succeeded.has(sample.id)));
      dropFromSelection(result.succeededIds);
    }
    return result;
  }

  function toggleSampleSelection(sample: Sample) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(sample.id)) next.delete(sample.id);
      else next.add(sample.id);
      return next;
    });
  }

  function selectAllVisibleSamples(visibleSamples: Sample[]) {
    setSelectedIds((current) => {
      const allSelected =
        visibleSamples.length > 0 && visibleSamples.every((sample) => current.has(sample.id));
      if (allSelected) return new Set();
      return new Set(visibleSamples.map((sample) => sample.id));
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return {
    samples,
    filteredSamples,
    activeSamples,
    selectedSamples,
    selectedIds,
    loading,
    error,
    refreshSamples,
    search,
    setSearch,
    filter,
    setFilter,
    advancedFilters,
    setAdvancedFilters,
    resetFilters,
    createSample,
    updateSample,
    startSample,
    completeSample,
    reopenSample,
    archiveSample,
    reactivateSample,
    duplicateSample,
    removeSample,
    bulkUpdateSamples,
    bulkArchiveSamples,
    bulkRemoveSamples,
    toggleSampleSelection,
    selectAllVisibleSamples,
    clearSelection,
  };
}
