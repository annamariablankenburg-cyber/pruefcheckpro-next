"use client";

import { laborbookRepository } from "@/lib/repositories/laborbookRepository";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { LaborbookFilter } from "@/components/shared/LaborbookFilters";
import type { LaborbookEntry } from "@/types/laborbook";

export function useLaborbook() {
  const { items: entries, update, remove, add } = useEntityList<LaborbookEntry>(
    laborbookRepository.getAll(),
    (entry) => entry.id
  );

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

  function updateEntry(id: string, changes: Partial<LaborbookEntry>) {
    update(id, changes);
  }

  function archiveEntry(id: string) {
    update(id, { status: "Archiviert" });
  }

  function restoreEntry(id: string) {
    update(id, { status: "Aktiv" });
  }

  function removeEntry(id: string) {
    remove(id);
  }

  function createEntry(entry: LaborbookEntry) {
    add(entry);
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
    archiveEntry,
    restoreEntry,
    removeEntry,
    createEntry,
  };
}
