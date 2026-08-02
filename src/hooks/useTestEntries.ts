"use client";

import { useCallback, useEffect, useState } from "react";

import { testValueService } from "@/lib/services/testValueService";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { TestEntryFilter } from "@/components/shared/TestEntryFilters";
import type { TestEntry } from "@/types/testValue";

// Lädt Prüfungen über testValueService (Mock oder Firestore, siehe
// src/config/dataSource.ts) und hält sie als lokalen State. Mutationen laufen
// über den Service und aktualisieren den lokalen State optimistisch mit dem
// vom Service zurückgegebenen Ergebnis. Der geöffnete Workspace-Datensatz
// (activeTestEntry) lebt ebenfalls hier, damit er nach jeder Mutation
// synchron mit der Liste bleibt.
export function useTestEntries() {
  const [testEntries, setTestEntries] = useState<TestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTestEntry, setActiveTestEntryState] = useState<TestEntry | null>(null);

  const refreshTestEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await testValueService.getTestEntries();
      setTestEntries(data);
    } catch {
      setError("Prüfdaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lädt die Prüfliste beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshTestEntries();
  }, [refreshTestEntries]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredTestEntries,
    resetFilters,
  } = useSearchAndFilter<TestEntry, TestEntryFilter>(testEntries, {
    defaultFilter: "Alle",
    matchesFilter: (entry, filterValue) =>
      (filterValue === "Beton" && entry.fachbereich === "Beton") ||
      (filterValue === "Asphalt" && entry.fachbereich === "Asphalt") ||
      (filterValue === "Geotechnik" && entry.fachbereich === "Geotechnik") ||
      filterValue === entry.status,
    matchesSearch: (entry, query) =>
      [entry.sampleId, entry.titel, entry.projekt, entry.pruefer].join(" ").toLowerCase().includes(query),
  });

  function setActiveTestEntry(entry: TestEntry | null) {
    setActiveTestEntryState(entry);
  }

  function replaceTestEntry(updated: TestEntry | undefined) {
    if (!updated) return;
    setTestEntries((current) =>
      current.map((entry) => (entry.sampleId === updated.sampleId ? updated : entry))
    );
    setActiveTestEntryState((current) => (current && current.sampleId === updated.sampleId ? updated : current));
  }

  async function createTestEntry(entry: TestEntry): Promise<TestEntry> {
    const created = await testValueService.createTestEntry(entry);
    setTestEntries((current) => [created, ...current]);
    return created;
  }

  async function updateTestEntry(sampleId: string, changes: Partial<TestEntry>) {
    const updated = await testValueService.updateTestEntry(sampleId, changes);
    replaceTestEntry(updated);
    return updated;
  }

  async function saveDraft(sampleId: string, changes: Partial<TestEntry>) {
    const updated = await testValueService.saveDraft(sampleId, changes);
    replaceTestEntry(updated);
    return updated;
  }

  async function saveResult(sampleId: string, changes: Partial<TestEntry>) {
    const updated = await testValueService.saveResult(sampleId, changes);
    replaceTestEntry(updated);
    return updated;
  }

  async function startTest(sampleId: string) {
    const updated = await testValueService.startTest(sampleId);
    replaceTestEntry(updated);
    return updated;
  }

  async function completeTest(sampleId: string) {
    const updated = await testValueService.completeTest(sampleId);
    replaceTestEntry(updated);
    return updated;
  }

  async function reopenTest(sampleId: string) {
    const updated = await testValueService.reopenTest(sampleId);
    replaceTestEntry(updated);
    return updated;
  }

  async function removeTestEntry(sampleId: string) {
    const success = await testValueService.removeTestEntry(sampleId);
    if (success) {
      setTestEntries((current) => current.filter((entry) => entry.sampleId !== sampleId));
      setActiveTestEntryState((current) => (current && current.sampleId === sampleId ? null : current));
    }
    return success;
  }

  return {
    testEntries,
    filteredTestEntries,
    activeTestEntry,
    setActiveTestEntry,
    loading,
    error,
    refreshTestEntries,
    createTestEntry,
    updateTestEntry,
    saveDraft,
    saveResult,
    startTest,
    completeTest,
    reopenTest,
    removeTestEntry,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
  };
}
