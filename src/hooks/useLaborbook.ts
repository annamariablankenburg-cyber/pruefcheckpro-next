"use client";

import { useCallback, useEffect, useState } from "react";

import { HEUTE } from "@/config/laborbook";
import { laborbookService } from "@/lib/services/laborbookService";
import { useReferenceDate } from "@/hooks/shared/useReferenceDate";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { LaborbookFilter } from "@/components/shared/LaborbookFilters";
import {
  buildHistoryEntry,
  sortLaborbookEntries,
  type LaborbookFormValues,
} from "@/lib/laborbook/laborbookEntries";
import type { NewLaborbookEntryInput } from "@/lib/interfaces/ILaborbookService";
import type { LaborbookEntry } from "@/types/laborbook";

// Lädt Laborbuch-Einträge über laborbookService (Mock oder Firestore) und hält
// sie als lokalen State, sortiert (neueste zuerst). Lokaler State wird erst nach
// einem bestätigten Service-Ergebnis geändert. Fehler werden NICHT verschluckt,
// sondern an die UI weitergereicht (Dialog bleibt offen, kein Erfolgs-Feedback).
export function useLaborbook() {
  const [entries, setEntries] = useState<LaborbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Mock: Demo-Datum der Laborbuch-Mockdaten. Firestore: echtes Datum.
  const referenceDate = useReferenceDate(HEUTE);

  const refreshLaborbookEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await laborbookService.getLaborbookEntries();
      setEntries(sortLaborbookEntries(data));
    } catch {
      setError("Laborbuch-Einträge konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lädt die Einträge beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshLaborbookEntries();
  }, [refreshLaborbookEntries]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredEntries,
    resetFilters,
  } = useSearchAndFilter<LaborbookEntry, LaborbookFilter>(entries, {
    defaultFilter: "Alle",
    archivedFilterValue: "Archiviert",
    isArchived: (entry) => entry.status === "Archiviert",
    matchesFilter: (entry, filterValue) =>
      (filterValue === "Prüfungen" && entry.typ === "Prüfung") ||
      (filterValue === "Geräte" && entry.typ === "Gerät") ||
      (filterValue === "Kalibrierungen" && entry.typ === "Kalibrierung") ||
      (filterValue === "Wartungen" && entry.typ === "Wartung") ||
      (filterValue === "Notizen" && entry.typ === "Notiz") ||
      (filterValue === "Ereignisse" && entry.typ === "Ereignis") ||
      (filterValue === "Beton" && entry.fachbereich === "Beton") ||
      (filterValue === "Asphalt" && entry.fachbereich === "Asphalt") ||
      (filterValue === "Geotechnik" && entry.fachbereich === "Geotechnik"),
    matchesSearch: (entry, query) =>
      [entry.titel, entry.beschreibung, entry.projekt, entry.probeId, entry.mitarbeiter, entry.kunde]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
  });

  function replaceEntry(updated: LaborbookEntry | undefined) {
    if (!updated) return;
    setEntries((current) =>
      sortLaborbookEntries(current.map((entry) => (entry.id === updated.id ? updated : entry)))
    );
  }

  async function createEntry(values: LaborbookFormValues): Promise<LaborbookEntry> {
    const input: NewLaborbookEntryInput = {
      ...values,
      status: "Aktiv",
      fotos: [],
      dokumente: [],
      historie: [buildHistoryEntry("Eintrag angelegt.")],
    };
    const created = await laborbookService.createLaborbookEntry(input);
    setEntries((current) => sortLaborbookEntries([created, ...current]));
    return created;
  }

  async function updateEntry(id: string, values: LaborbookFormValues): Promise<LaborbookEntry | undefined> {
    const updated = await laborbookService.updateLaborbookEntry(id, values, buildHistoryEntry("Eintrag bearbeitet."));
    replaceEntry(updated);
    return updated;
  }

  async function archiveEntry(id: string): Promise<LaborbookEntry | undefined> {
    const updated = await laborbookService.archiveLaborbookEntry(id, buildHistoryEntry("Eintrag archiviert."));
    replaceEntry(updated);
    return updated;
  }

  async function restoreEntry(id: string): Promise<LaborbookEntry | undefined> {
    const updated = await laborbookService.restoreLaborbookEntry(id, buildHistoryEntry("Eintrag reaktiviert."));
    replaceEntry(updated);
    return updated;
  }

  async function removeEntry(id: string): Promise<boolean> {
    const success = await laborbookService.removeLaborbookEntry(id);
    if (success) {
      setEntries((current) => current.filter((entry) => entry.id !== id));
    }
    return success;
  }

  return {
    entries,
    filteredEntries,
    loading,
    error,
    referenceDate,
    refreshLaborbookEntries,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    createEntry,
    updateEntry,
    archiveEntry,
    restoreEntry,
    removeEntry,
  };
}
