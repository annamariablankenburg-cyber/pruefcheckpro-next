"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { locationService } from "@/lib/services/locationService";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { LocationFilter } from "@/components/shared/LocationFilters";
import {
  buildLocationHistoryEntry,
  sortLocations,
  type LocationFormValues,
} from "@/lib/locations/locationRules";
import type { NewLocationInput } from "@/lib/interfaces/ILocationService";
import type { CompanyLocationDetail } from "@/types/location";

// Lädt Standorte über locationService (Mock oder Firestore) und hält sie als
// lokalen State. Lokaler State ändert sich erst nach einem bestätigten
// Service-Ergebnis. Fehler (auch LocationRuleError) werden NICHT verschluckt,
// sondern an die UI weitergereicht.
// `enabled` (Standard true): Nur wenn der User die Collection lesen darf, wird
// geladen. Ist es false, wird NICHT abgefragt (kein erwarteter permission-denied),
// und der Hook liefert leere Daten ohne Ladezustand/Fehler. Das ist UI-Gating
// (Komfort); die Firestore Rules bleiben die Sicherheitsgrenze.
export function useLocations(enabled = true) {
  const [locations, setLocations] = useState<CompanyLocationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await locationService.getLocations();
      setLocations(sortLocations(data));
    } catch {
      setError("Standorte konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Lädt die Standorte beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshLocations();
  }, [enabled, refreshLocations]);

  // Ohne Leserecht (enabled = false): leere Daten, nichts wurde abgefragt.
  const visibleLocations = useMemo(() => (enabled ? locations : []), [enabled, locations]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredLocations,
    resetFilters,
  } = useSearchAndFilter<CompanyLocationDetail, LocationFilter>(visibleLocations, {
    defaultFilter: "Alle",
    matchesFilter: (location, filterValue) => filterValue === location.status || filterValue === location.type,
    matchesSearch: (location, query) =>
      location.name.toLowerCase().includes(query) ||
      location.street.toLowerCase().includes(query) ||
      location.city.toLowerCase().includes(query) ||
      location.contactPerson.toLowerCase().includes(query),
  });

  function replaceLocation(updated: CompanyLocationDetail | undefined) {
    if (!updated) return;
    setLocations((current) =>
      sortLocations(current.map((location) => (location.id === updated.id ? updated : location)))
    );
  }

  // Neue Standorte: aktiv, Zähler 0 (vorläufige Snapshot-Felder), Historie.
  async function createLocation(values: LocationFormValues): Promise<CompanyLocationDetail> {
    const input: NewLocationInput = {
      ...values,
      status: "Aktiv",
      employeeCount: 0,
      deviceCount: 0,
      projectCount: 0,
      history: [buildLocationHistoryEntry("Standort wurde angelegt.")],
    };
    const created = await locationService.createLocation(input);
    setLocations((current) => sortLocations([...current, created]));
    return created;
  }

  async function updateLocation(id: string, values: LocationFormValues) {
    const updated = await locationService.updateLocation(
      id,
      values,
      buildLocationHistoryEntry("Standort wurde bearbeitet.")
    );
    replaceLocation(updated);
    return updated;
  }

  async function deactivateLocation(id: string) {
    const updated = await locationService.deactivateLocation(
      id,
      buildLocationHistoryEntry("Standort wurde deaktiviert.")
    );
    replaceLocation(updated);
    return updated;
  }

  async function reactivateLocation(id: string) {
    const updated = await locationService.reactivateLocation(
      id,
      buildLocationHistoryEntry("Standort wurde reaktiviert.")
    );
    replaceLocation(updated);
    return updated;
  }

  return {
    locations: visibleLocations,
    filteredLocations,
    enabled,
    loading: enabled && loading,
    error: enabled ? error : null,
    refreshLocations,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    createLocation,
    updateLocation,
    deactivateLocation,
    reactivateLocation,
  };
}

// Gemeinsame Instanz für Company-Übersicht und Standorte-Tab (ein State,
// keine zweite Standortquelle).
export type LocationsData = ReturnType<typeof useLocations>;
