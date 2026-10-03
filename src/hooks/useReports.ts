"use client";

import { useCallback, useEffect, useState } from "react";

import { reportService } from "@/lib/services/reportService";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { ReportFilter } from "@/components/shared/ReportFilters";
import type { NewReportInput } from "@/lib/interfaces/IReportService";
import type { Report } from "@/types/report";

// Lädt Berichte über reportService (Mock oder Firestore, siehe
// src/config/dataSource.ts) und hält sie als lokalen State. Mutationen laufen
// über den Service (nicht mehr nur über lokalen React-State wie zuvor) und
// aktualisieren den State optimistisch mit dem vom Service zurückgegebenen
// Ergebnis. Fehler bei Mutationen werden bewusst NICHT hier abgefangen,
// sondern an die aufrufende UI (ReportsView, SendReportEmailDialog, …)
// weitergereicht, damit dort gezielt reagiert werden kann (z. B. keine
// Erfolgsmeldung bei fehlgeschlagener Mutation).
export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getReports();
      setReports(data);
    } catch {
      setError("Berichte konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lädt die Berichtsliste beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshReports();
  }, [refreshReports]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredReports,
    resetFilters,
  } = useSearchAndFilter<Report, ReportFilter>(reports, {
    defaultFilter: "Alle",
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

  function replaceReport(updated: Report | undefined) {
    if (!updated) return;
    setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)));
  }

  async function createReport(input: NewReportInput): Promise<Report> {
    const created = await reportService.createReport(input);
    setReports((current) => [created, ...current]);
    return created;
  }

  async function updateReport(id: string, changes: Partial<Report>) {
    const updated = await reportService.updateReport(id, changes);
    replaceReport(updated);
    return updated;
  }

  async function archiveReport(id: string) {
    const updated = await reportService.archiveReport(id);
    replaceReport(updated);
    return updated;
  }

  async function restoreReport(id: string) {
    const updated = await reportService.restoreReport(id);
    replaceReport(updated);
    return updated;
  }

  async function removeReport(id: string) {
    const success = await reportService.removeReport(id);
    if (success) {
      setReports((current) => current.filter((report) => report.id !== id));
    }
    return success;
  }

  return {
    reports,
    filteredReports,
    loading,
    error,
    refreshReports,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    createReport,
    updateReport,
    archiveReport,
    restoreReport,
    removeReport,
  };
}
