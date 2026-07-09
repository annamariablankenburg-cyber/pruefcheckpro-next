"use client";

import { locationRepository } from "@/lib/repositories/locationRepository";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { LocationFilter } from "@/components/shared/LocationFilters";
import type { CompanyLocationDetail } from "@/types/location";

export function useLocations() {
  const { items: locations, update } = useEntityList<CompanyLocationDetail>(
    locationRepository.getAll(),
    (location) => location.id
  );

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredLocations,
    resetFilters,
  } = useSearchAndFilter<CompanyLocationDetail, LocationFilter>(locations, {
    defaultFilter: "Alle",
    matchesFilter: (location, filterValue) => filterValue === location.status || filterValue === location.type,
    matchesSearch: (location, query) =>
      location.name.toLowerCase().includes(query) ||
      location.street.toLowerCase().includes(query) ||
      location.city.toLowerCase().includes(query) ||
      location.contactPerson.toLowerCase().includes(query),
  });

  function updateLocation(id: string, changes: Partial<CompanyLocationDetail>) {
    update(id, changes);
  }

  function deactivateLocation(id: string) {
    update(id, { status: "Inaktiv" });
  }

  function reactivateLocation(id: string) {
    update(id, { status: "Aktiv" });
  }

  return {
    locations,
    filteredLocations,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateLocation,
    deactivateLocation,
    reactivateLocation,
  };
}
