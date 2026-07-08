"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Download, FileEdit, FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { NewReportDialog } from "@/components/shared/NewReportDialog";
import { ReportEditorDrawer } from "@/components/shared/ReportEditorDrawer";
import { ReportFilters, type ReportFilter } from "@/components/shared/ReportFilters";
import { ReportTable } from "@/components/shared/ReportTable";
import { StatCard } from "@/components/shared/StatCard";
import { HEUTE, reports as initialReports } from "@/config/reports";
import type { Report, ReportStatus } from "@/types/report";

type ConfirmActionType = "saveDraft" | "markDone" | "exportPdf" | "archive" | "reactivate";

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; nextStatus: ReportStatus }
> = {
  saveDraft: {
    title: "Als Entwurf speichern?",
    description: "Der Bericht wird wieder auf den Status „Entwurf“ gesetzt.",
    confirmLabel: "Als Entwurf speichern",
    nextStatus: "Entwurf",
  },
  markDone: {
    title: "Bericht als fertig markieren?",
    description: "Der Bericht wird als „Fertig“ markiert und kann exportiert werden.",
    confirmLabel: "Als fertig markieren",
    nextStatus: "Fertig",
  },
  exportPdf: {
    title: "Bericht als PDF exportieren?",
    description:
      "Der Bericht wird als PDF exportiert (nur UI-Vorschau, keine echte Erzeugung) und als „Exportiert“ markiert.",
    confirmLabel: "PDF exportieren",
    nextStatus: "Exportiert",
  },
  archive: {
    title: "Bericht archivieren?",
    description: "Der Bericht wird aus der aktiven Übersicht ausgeblendet, bleibt aber erhalten.",
    confirmLabel: "Archivieren",
    nextStatus: "Archiviert",
  },
  reactivate: {
    title: "Bericht reaktivieren?",
    description: "Der Bericht wird wieder als „Fertig“ in die aktive Übersicht aufgenommen.",
    confirmLabel: "Reaktivieren",
    nextStatus: "Fertig",
  },
};

export function ReportsView() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ReportFilter>("Alle");
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [editorReport, setEditorReport] = useState<Report | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ report: Report; type: ConfirmActionType } | null>(
    null
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2500);
  }

  function updateReport(id: string, changes: Partial<Report>) {
    setReports((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
    setEditorReport((current) => (current && current.id === id ? { ...current, ...changes } : current));
  }

  const kpis = useMemo(
    () => ({
      total: reports.length,
      entwuerfe: reports.filter((report) => report.status === "Entwurf").length,
      fertig: reports.filter((report) => report.status === "Fertig").length,
      exportiert: reports.filter((report) => report.status === "Exportiert").length,
      heute: reports.filter((report) => report.erstelltAm === HEUTE).length,
    }),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool =
      filter === "Archiviert"
        ? reports.filter((report) => report.status === "Archiviert")
        : reports.filter((report) => report.status !== "Archiviert");

    return pool.filter((report) => {
      const matchesSearch =
        query.length === 0 ||
        [report.titel, report.id, report.projekt, report.kunde].join(" ").toLowerCase().includes(query);

      const matchesFilter = filter === "Alle" || filter === "Archiviert" || filter === report.status;

      return matchesSearch && matchesFilter;
    });
  }, [reports, search, filter]);

  function requestAction(type: ConfirmActionType) {
    return (report: Report) => setConfirmAction({ report, type });
  }

  function handleConfirmAction(subject: Report) {
    if (!confirmAction) return;
    updateReport(subject.id, { status: confirmCopy[confirmAction.type].nextStatus });
    setConfirmAction(null);
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            PDF-Berichte
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Erstelle professionelle Prüfberichte für Kunden und Projekte.
          </p>
        </div>
        <Button onClick={() => setIsNewReportOpen(true)} className="w-fit">
          <Plus className="size-4" />
          Neuer Bericht
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={FileText} label="Berichte gesamt" value={kpis.total} />
        <StatCard icon={FileEdit} label="Entwürfe" value={kpis.entwuerfe} tone="warning" />
        <StatCard icon={CheckCircle2} label="Fertige Berichte" value={kpis.fertig} tone="success" />
        <StatCard icon={Download} label="Exportiert" value={kpis.exportiert} />
        <StatCard icon={CalendarClock} label="Heute erstellt" value={kpis.heute} />
      </div>

      <ReportFilters search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} />

      <ReportTable
        reports={filteredReports}
        onOpenEditor={setEditorReport}
        onPreview={() => showFeedback("Diese Funktion wird später angebunden.")}
        onMarkDone={requestAction("markDone")}
        onExportPdf={requestAction("exportPdf")}
        onExportExcel={() => showFeedback("Diese Funktion wird später angebunden.")}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
      />

      <ReportEditorDrawer
        report={editorReport}
        onOpenChange={(open) => !open && setEditorReport(null)}
        onSave={() => showFeedback("Diese Funktion wird später angebunden.")}
        onSaveDraft={requestAction("saveDraft")}
        onMarkDone={requestAction("markDone")}
        onExportPdf={requestAction("exportPdf")}
        onExportExcel={() => showFeedback("Diese Funktion wird später angebunden.")}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
        onPreview={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      <NewReportDialog open={isNewReportOpen} onOpenChange={setIsNewReportOpen} />

      <ConfirmActionDialog<Report>
        subject={confirmAction?.report ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      {feedback && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg">
          {feedback}
        </div>
      )}
    </div>
  );
}
