"use client";

import { useMemo, useState } from "react";

// Gemeinsamer Baustein für die in fast jeder Listen-View wiederholte
// Kombination aus Suchbegriff + Filter + (optional) Archiviert-Pool-Umschaltung.
// Fasst die Logik zusammen, die zuvor in CustomersView, ProjectsView,
// DevicesView, ReportsView, SamplesView (Probenmanager), LaborbuchView,
// EmployeesView, LocationsView, InvitationsView und TestEntries-View fast
// identisch dupliziert war.
interface UseSearchAndFilterOptions<T, F extends string> {
  defaultFilter: F;
  alleValue?: F;
  archivedFilterValue?: F;
  isArchived?: (item: T) => boolean;
  matchesFilter: (item: T, filter: F) => boolean;
  matchesSearch: (item: T, query: string) => boolean;
}

export function useSearchAndFilter<T, F extends string>(
  items: T[],
  options: UseSearchAndFilterOptions<T, F>
) {
  const { defaultFilter, archivedFilterValue, isArchived, matchesFilter, matchesSearch } = options;
  const alleValue = options.alleValue ?? ("Alle" as F);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<F>(defaultFilter);

  const activeItems = useMemo(() => {
    if (!isArchived) return items;
    return items.filter((item) => !isArchived(item));
  }, [items, isArchived]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool =
      archivedFilterValue !== undefined && isArchived && filter === archivedFilterValue
        ? items.filter((item) => isArchived(item))
        : activeItems;

    return pool.filter((item) => {
      const matchesF =
        filter === alleValue ||
        (archivedFilterValue !== undefined && filter === archivedFilterValue) ||
        matchesFilter(item, filter);

      const matchesS = query.length === 0 || matchesSearch(item, query);

      return matchesF && matchesS;
    });
  }, [items, activeItems, search, filter, archivedFilterValue, isArchived, matchesFilter, matchesSearch, alleValue]);

  function resetFilters() {
    setSearch("");
    setFilter(defaultFilter);
  }

  return { search, setSearch, filter, setFilter, activeItems, filteredItems, resetFilters };
}
