"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileEdit,
  FileSpreadsheet,
  FileText,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  { title: string; description: string; confirmLabel: string; nextStatus: ReportStatus; successMessage: string }
> = {
  saveDraft: {
    title: "Als Entwurf speichern?",
    description: "Der Bericht wird wieder auf den Status „Entwurf“ gesetzt.",
    confirmLabel: "Als Entwurf speichern",
    nextStatus: "Entwurf",
    successMessage: "Bericht als Entwurf gespeichert.",
  },
  markDone: {
    title: "Bericht als fertig markieren?",
    description: "Der Bericht wird als „Fertig“ markiert und kann exportiert werden.",
    confirmLabel: "Als fertig markieren",
    nextStatus: "Fertig",
    successMessage: "Bericht als fertig markiert.",
  },
  exportPdf: {
    title: "Bericht als PDF exportieren?",
    description:
      "Der Bericht wird als PDF exportiert (nur UI-Vorschau, keine echte Erzeugung) und als „PDF exportiert“ markiert.",
    confirmLabel: "PDF exportieren",
    nextStatus: "PDF exportiert",
    successMessage: "Bericht als PDF exportiert markiert.",
  },
  exportExcel: {
    title: "Bericht als Excel exportieren?",
    description:
      "Der Bericht wird als Excel-Protokoll exportiert (nur UI-Vorschau, keine echte Erzeugung) und als „Excel exportiert“ markiert.",
    confirmLabel: "Excel exportieren",
    nextStatus: "Excel exportiert",
    successMessage: "Bericht als Excel exportiert markiert.",
  },
  archive: {
    title: "Bericht archivieren?",
    description: "Der Bericht wird aus der aktiven Übersicht ausgeblendet, bleibt aber erhalten.",
    confirmLabel: "Archivieren",
    nextStatus: "Archiviert",
    successMessage: "Bericht archiviert.",
  },
  reactivate: {
    title: "Bericht reaktivieren?",
    description: "Der Bericht wird wieder als „Fertig“ in die aktive Übersicht aufgenommen.",
    confirmLabel: "Reaktivieren",
    nextStatus: "Fertig",
    successMessage: "Bericht reaktiviert.",
  },
};

export function ReportsView() {
  const router = useRouter();
  const {
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
    removeReport,
  } = useReports();
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [editorReport, setEditorReport] = useState<Report | null>(null);
  const [editorSection, setEditorSection] = useState<Section | undefined>(undefined);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ report: Report; type: ConfirmActionType } | null>(
    null
  );
  const [actionPending, setActionPending] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [emailContext, setEmailContext] = useState<{
    report: Report;
    recipients?: string[];
    subject?: string;
  } | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  function applyUpdatedReport(updated: Report | undefined) {
    if (!updated) return;
    setEditorReport((current) => (current && current.id === updated.id ? updated : current));
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

  async function handleConfirmAction(subject: Report) {
    if (!confirmAction || actionPending) return;
    setActionPending(true);
    try {
      const updated = await updateReport(subject.id, {
        ...subject,
        status: confirmCopy[confirmAction.type].nextStatus,
      });
      if (!updated) {
        showFeedback("Aktion konnte nicht ausgeführt werden.");
        return;
      }
      applyUpdatedReport(updated);
      setConfirmAction(null);
      showFeedback(confirmCopy[confirmAction.type].successMessage);
    } catch {
      showFeedback("Aktion konnte nicht ausgeführt werden.");
    } finally {
      setActionPending(false);
    }
  }

  // Wird von ReportEditorDrawer awaited: der Speichern-Button dort zeigt nur
  // bei einem tatsächlich zurückgegebenen Report eine Erfolgsmeldung, sonst
  // eine Fehlermeldung – keine falsche Erfolgsmeldung bei fehlgeschlagener
  // Firestore-Mutation.
  async function handleSave(updated: Report): Promise<Report | undefined> {
    try {
      const saved = await updateReport(updated.id, updated);
      applyUpdatedReport(saved);
      return saved;
    } catch {
      return undefined;
    }
  }

  async function handleDuplicate(report: Report) {
    if (isDuplicating) return;
    setIsDuplicating(true);
    try {
      const { id, ...rest } = report;
      void id;
      const duplicateInput = {
        ...rest,
        berichtsnummer: `${report.berichtsnummer}-KOPIE`,
        titel: `${report.titel} (Kopie)`,
        status: "Entwurf" as ReportStatus,
        erstelltAm: HEUTE,
        historie: [{ message: `Dupliziert von ${report.id}.`, timestamp: HEUTE }],
        emailStatus: "Noch nicht versendet" as const,
        emailSentTo: undefined,
        emailSentAt: undefined,
        emailSentBy: undefined,
        emailSubject: undefined,
        emailAttachmentCount: undefined,
        emailHistory: [],
      };
      const created = await createReport(duplicateInput);
      showFeedback(`Bericht „${created.titel}" wurde dupliziert.`);
    } catch {
      showFeedback("Bericht konnte nicht dupliziert werden.");
    } finally {
      setIsDuplicating(false);
    }
  }

  async function handleConfirmDelete(subject: Report) {
    if (deletePending) return;
    setDeletePending(true);
    try {
      const success = await removeReport(subject.id);
      if (!success) {
        showFeedback("Bericht konnte nicht gelöscht werden.");
        return;
      }
      setEditorReport((current) => (current && current.id === subject.id ? null : current));
      setDeleteReport(null);
      showFeedback("Bericht gelöscht.");
    } catch {
      showFeedback("Bericht konnte nicht gelöscht werden.");
    } finally {
      setDeletePending(false);
    }
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

  async function handleSaveEmailDraft(report: Report, draft: EmailDraftResult) {
    try {
      const updated = await updateReport(report.id, {
        emailStatus: "Versand vorbereitet",
        emailSentTo: draft.to,
        emailSubject: draft.subject,
      });
      if (!updated) {
        showFeedback("E-Mail-Entwurf konnte nicht gespeichert werden.");
        return;
      }
      applyUpdatedReport(updated);
      setEmailContext(null);
      showFeedback("E-Mail-Entwurf gespeichert.");
    } catch {
      showFeedback("E-Mail-Entwurf konnte nicht gespeichert werden.");
    }
  }

  function handleSendTestEmail() {
    showFeedback("E-Mail-Versand wird später sicher über eine Server-Funktion angebunden.");
  }

  async function handleSendEmail(report: Report, draft: EmailDraftResult) {
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

    try {
      const updated = await updateReport(report.id, {
        emailStatus: "Versendet",
        emailSentTo: draft.to,
        emailSentAt: timestamp,
        emailSentBy: newEntry.sentBy,
        emailSubject: draft.subject,
        emailAttachmentCount: attachmentCount,
        emailHistory: [newEntry, ...report.emailHistory],
      });
      if (!updated) {
        showFeedback("Bericht konnte nicht als versandbereit markiert werden.");
        return;
      }
      applyUpdatedReport(updated);
      setEmailContext(null);
      showFeedback("Prüfbericht wurde versandbereit vorbereitet.");
    } catch {
      showFeedback("Bericht konnte nicht als versandbereit markiert werden.");
    }
  }

  const hasBlockingState = loading || Boolean(error);

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
        <Button onClick={() => setIsNewReportOpen(true)} className="w-fit" disabled={hasBlockingState}>
          <Plus className="size-4" />
          Neuer Bericht
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-[104px] animate-pulse bg-muted/40" />
            ))}
          </div>
          <Card className="h-72 animate-pulse bg-muted/40" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={refreshReports}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
        </>
      )}

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

      <NewReportDialog
        open={isNewReportOpen}
        onOpenChange={setIsNewReportOpen}
        onCreate={createReport}
        onCreated={(created) => showFeedback(`Bericht „${created.titel}" angelegt.`)}
      />

      <ConfirmActionDialog<Report>
        subject={confirmAction?.report ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        isLoading={actionPending}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmActionDialog<Report>
        subject={deleteReport}
        title="Bericht wirklich löschen?"
        description="Diese Aktion kann später im Audit-Log dokumentiert werden. Der Bericht wird dauerhaft entfernt."
        confirmLabel="Löschen"
        confirmVariant="destructive"
        isLoading={deletePending}
        onOpenChange={(open) => !open && setDeleteReport(null)}
        onConfirm={handleConfirmDelete}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
