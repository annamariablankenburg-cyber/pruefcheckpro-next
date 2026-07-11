"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  FileEdit,
  FileSpreadsheet,
  FileText,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { type EmailDraftResult, SendReportEmailDialog } from "@/components/shared/SendReportEmailDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewReportDialog } from "@/components/shared/NewReportDialog";
import { ReportEditorDrawer, type Section } from "@/components/shared/ReportEditorDrawer";
import { ReportFilters } from "@/components/shared/ReportFilters";
import { ReportTable } from "@/components/shared/ReportTable";
import { StatCard } from "@/components/shared/StatCard";
import { HEUTE } from "@/config/reports";
import { useReports } from "@/hooks/useReports";
import type { Report, ReportEmailHistoryEntry, ReportStatus } from "@/types/report";

type ConfirmActionType = "saveDraft" | "markDone" | "exportPdf" | "exportExcel" | "archive" | "reactivate";

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
      "Der Bericht wird als PDF exportiert (nur UI-Vorschau, keine echte Erzeugung) und als „PDF exportiert“ markiert.",
    confirmLabel: "PDF exportieren",
    nextStatus: "PDF exportiert",
  },
  exportExcel: {
    title: "Bericht als Excel exportieren?",
    description:
      "Der Bericht wird als Excel-Protokoll exportiert (nur UI-Vorschau, keine echte Erzeugung) und als „Excel exportiert“ markiert.",
    confirmLabel: "Excel exportieren",
    nextStatus: "Excel exportiert",
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
  const router = useRouter();
  const {
    reports,
    filteredReports,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateReport: updateReportData,
    removeReport,
    createReport,
  } = useReports();
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [editorReport, setEditorReport] = useState<Report | null>(null);
  const [editorSection, setEditorSection] = useState<Section | undefined>(undefined);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ report: Report; type: ConfirmActionType } | null>(
    null
  );
  const [emailContext, setEmailContext] = useState<{
    report: Report;
    recipients?: string[];
    subject?: string;
  } | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  function updateReport(id: string, changes: Partial<Report>) {
    updateReportData(id, changes);
    setEditorReport((current) => (current && current.id === id ? { ...current, ...changes } : current));
  }

  function openEditor(report: Report, section?: Section) {
    setEditorSection(section);
    setEditorReport(report);
  }

  const kpis = useMemo(
    () => ({
      total: reports.length,
      entwuerfe: reports.filter((report) => report.status === "Entwurf").length,
      fertig: reports.filter((report) => report.status === "Fertig").length,
      pdfExportiert: reports.filter((report) => report.status === "PDF exportiert").length,
      excelExportiert: reports.filter((report) => report.status === "Excel exportiert").length,
      heute: reports.filter((report) => report.erstelltAm === HEUTE).length,
    }),
    [reports]
  );

  function requestAction(type: ConfirmActionType) {
    return (report: Report) => setConfirmAction({ report, type });
  }

  function handleConfirmAction(subject: Report) {
    if (!confirmAction) return;
    updateReport(subject.id, { ...subject, status: confirmCopy[confirmAction.type].nextStatus });
    setConfirmAction(null);
  }

  function handleSave(updated: Report) {
    updateReport(updated.id, updated);
  }

  function handleDuplicate(report: Report) {
    const newReport: Report = {
      ...report,
      id: `RPT-${Date.now()}`,
      berichtsnummer: `${report.berichtsnummer}-KOPIE`,
      titel: `${report.titel} (Kopie)`,
      status: "Entwurf",
      erstelltAm: HEUTE,
      historie: [{ message: `Dupliziert von ${report.id}.`, timestamp: HEUTE }],
      emailStatus: "Noch nicht versendet",
      emailSentTo: undefined,
      emailSentAt: undefined,
      emailSentBy: undefined,
      emailSubject: undefined,
      emailAttachmentCount: undefined,
      emailHistory: [],
    };
    createReport(newReport);
    showFeedback(`Bericht „${newReport.titel}" wurde dupliziert.`);
  }

  function handleConfirmDelete(subject: Report) {
    removeReport(subject.id);
    setEditorReport((current) => (current && current.id === subject.id ? null : current));
    setDeleteReport(null);
  }

  function openSendEmail(report: Report) {
    setEmailContext({ report });
  }

  function handleResendEmail(report: Report, entry: ReportEmailHistoryEntry) {
    setEmailContext({ report, recipients: entry.recipients, subject: entry.subject });
  }

  function handleCopyEmailText(entry: ReportEmailHistoryEntry) {
    const text = `An: ${entry.recipients.join(", ")}\nBetreff: ${entry.subject}\n\n${entry.message}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showFeedback("E-Mail-Text kopiert.");
  }

  function handleSaveEmailDraft(report: Report, draft: EmailDraftResult) {
    updateReport(report.id, {
      emailStatus: "Versand vorbereitet",
      emailSentTo: draft.to,
      emailSubject: draft.subject,
    });
    setEmailContext(null);
    showFeedback("E-Mail-Entwurf lokal gespeichert.");
  }

  function handleSendTestEmail() {
    showFeedback("E-Mail-Versand wird später sicher über eine Server-Funktion angebunden.");
  }

  function handleSendEmail(report: Report, draft: EmailDraftResult) {
    const attachmentCount = draft.attachments.filter((attachment) => attachment.selected).length;
    const timestamp = `${HEUTE} ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
    const newEntry: ReportEmailHistoryEntry = {
      id: `email-${Date.now()}`,
      timestamp,
      recipients: draft.to,
      cc: draft.cc.length > 0 ? draft.cc : undefined,
      bcc: draft.bcc.length > 0 ? draft.bcc : undefined,
      subject: draft.subject,
      message: draft.message,
      status: "Versendet",
      sentBy: "Max Mustermann",
      attachmentCount,
    };

    updateReport(report.id, {
      emailStatus: "Versendet",
      emailSentTo: draft.to,
      emailSentAt: timestamp,
      emailSentBy: newEntry.sentBy,
      emailSubject: draft.subject,
      emailAttachmentCount: attachmentCount,
      emailHistory: [newEntry, ...report.emailHistory],
    });
    setEmailContext(null);
    showFeedback("Prüfbericht wurde versandbereit vorbereitet.");
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Berichte & Exporte
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Erstelle Prüfberichte, PDF-Ausgaben und Excel-Protokolle für Kunden, Projekte und Proben.
          </p>
        </div>
        <Button onClick={() => setIsNewReportOpen(true)} className="w-fit">
          <Plus className="size-4" />
          Neuer Bericht
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={FileText} label="Berichte gesamt" value={kpis.total} />
        <StatCard icon={FileEdit} label="Entwürfe" value={kpis.entwuerfe} tone="warning" />
        <StatCard icon={CheckCircle2} label="Fertige Berichte" value={kpis.fertig} tone="success" />
        <StatCard icon={FileText} label="PDF exportiert" value={kpis.pdfExportiert} />
        <StatCard icon={FileSpreadsheet} label="Excel exportiert" value={kpis.excelExportiert} />
        <StatCard icon={CalendarClock} label="Heute erstellt" value={kpis.heute} />
      </div>

      <ReportFilters search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} />

      <ReportTable
        reports={filteredReports}
        onResetFilters={resetFilters}
        onOpenDetails={(report) => openEditor(report)}
        onEdit={(report) => openEditor(report)}
        onPreview={(report) => openEditor(report, "Export")}
        onMarkDone={requestAction("markDone")}
        onExportPdf={requestAction("exportPdf")}
        onExportExcel={requestAction("exportExcel")}
        onDuplicate={handleDuplicate}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
        onDelete={setDeleteReport}
        onSendEmail={openSendEmail}
      />

      <ReportEditorDrawer
        report={editorReport}
        initialSection={editorSection}
        onOpenChange={(open) => !open && setEditorReport(null)}
        onSave={handleSave}
        onSaveDraft={requestAction("saveDraft")}
        onMarkDone={requestAction("markDone")}
        onExportPdf={requestAction("exportPdf")}
        onExportExcel={requestAction("exportExcel")}
        onDuplicate={handleDuplicate}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
        onDelete={setDeleteReport}
        onOpenProject={() => router.push("/projekte")}
        onOpenCustomer={() => router.push("/kunden")}
        onOpenSample={() => router.push("/probekoerper")}
        onSendEmail={openSendEmail}
        onResendEmail={handleResendEmail}
        onCopyEmailText={handleCopyEmailText}
      />

      <SendReportEmailDialog
        report={emailContext?.report ?? null}
        initialRecipients={emailContext?.recipients}
        initialSubject={emailContext?.subject}
        onOpenChange={(open) => !open && setEmailContext(null)}
        onSaveDraft={handleSaveEmailDraft}
        onSendTest={handleSendTestEmail}
        onSend={handleSendEmail}
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

      <ConfirmActionDialog<Report>
        subject={deleteReport}
        title="Bericht wirklich löschen?"
        description="Diese Aktion kann später im Audit-Log dokumentiert werden. Der Bericht wird dauerhaft entfernt."
        confirmLabel="Löschen"
        confirmVariant="destructive"
        onOpenChange={(open) => !open && setDeleteReport(null)}
        onConfirm={handleConfirmDelete}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
