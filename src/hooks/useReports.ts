"use client";

import { reportRepository } from "@/lib/repositories/reportRepository";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { ReportFilter } from "@/components/shared/ReportFilters";
import type { Report } from "@/types/report";

export function useReports() {
  const { items: reports, update, remove, add } = useEntityList<Report>(
    reportRepository.getAll(),
    (report) => report.id
  );

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredReports,
    resetFilters,
  } = useSearchAndFilter<Report, ReportFilter>(reports, {
    defaultFilter: "Alle",
    archivedFilterValue: "Archiviert",
    isArchived: (report) => report.status === "Archiviert",
    matchesFilter: (report, filterValue) =>
      filterValue === report.status ||
      (filterValue === "Beton" && report.fachbereich === "Beton") ||
      (filterValue === "Asphalt" && report.fachbereich === "Asphalt") ||
      (filterValue === "Geotechnik" && report.fachbereich === "Geotechnik"),
    matchesSearch: (report, query) =>
      [report.titel, report.id, report.projekt, report.kunde, report.probeId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
  });

  function updateReport(id: string, changes: Partial<Report>) {
    update(id, changes);
  }

  function archiveReport(id: string) {
    update(id, { status: "Archiviert" });
  }

  function restoreReport(id: string) {
    update(id, { status: "Fertig" });
  }

  function removeReport(id: string) {
    remove(id);
  }

  function createReport(report: Report) {
    add(report);
  }

  return {
    reports,
    filteredReports,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateReport,
    archiveReport,
    restoreReport,
    removeReport,
    createReport,
  };
}
