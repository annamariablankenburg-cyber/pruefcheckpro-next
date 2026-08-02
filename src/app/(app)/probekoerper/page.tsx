"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  FlaskConical,
  ListTodo,
  Plus,
  TestTubeDiagonal,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BulkActionsToolbar } from "@/components/shared/BulkActionsToolbar";
import { BulkFieldDialog } from "@/components/shared/BulkFieldDialog";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { DeleteSampleDialog } from "@/components/shared/DeleteSampleDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewSampleDialog } from "@/components/shared/NewSampleDialog";
import { SampleDetailDrawer } from "@/components/shared/SampleDetailDrawer";
import { SampleFilters } from "@/components/shared/SampleFilters";
import { SampleTable } from "@/components/shared/SampleTable";
import { StatCard } from "@/components/shared/StatCard";
import { employees } from "@/config/employees";
import { useSamples } from "@/hooks/useSamples";
import type { Sample, SampleStatus } from "@/types/sample";

type ConfirmActionType = "start" | "complete" | "reopen" | "archive" | "reactivate";
type BulkConfirmType = "delete" | "archive";

interface ConfirmActionState {
  sample: Sample;
  type: ConfirmActionType;
}

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; successMessage: string }
> = {
  start: {
    title: "Prüfung starten?",
    description: "Die Probe wird auf den Status „In Prüfung“ gesetzt.",
    confirmLabel: "In Prüfung starten",
    successMessage: "Prüfung gestartet.",
  },
  complete: {
    title: "Probe abschließen?",
    description: "Die Probe wird als „Abgeschlossen“ markiert.",
    confirmLabel: "Abschließen",
    successMessage: "Probe abgeschlossen.",
  },
  reopen: {
    title: "Probe wieder öffnen?",
    description: "Die Probe wird erneut auf „In Prüfung“ gesetzt.",
    confirmLabel: "Wieder öffnen",
    successMessage: "Probe wieder geöffnet.",
  },
  archive: {
    title: "Probe archivieren?",
    description: "Die Probe wird archiviert und aus der aktiven Übersicht ausgeblendet.",
    confirmLabel: "Archivieren",
    successMessage: "Probe archiviert.",
  },
  reactivate: {
    title: "Probe reaktivieren?",
    description: "Die Probe wird wieder als „Abgeschlossen“ in die aktive Übersicht aufgenommen.",
    confirmLabel: "Reaktivieren",
    successMessage: "Probe reaktiviert.",
  },
};

const bulkConfirmCopy: Record<
  BulkConfirmType,
  { title: string; description: (count: number) => string; confirmLabel: string }
> = {
  delete: {
    title: "Ausgewählte Proben löschen?",
    description: (count) =>
      `${count} ${count === 1 ? "Probe wird" : "Proben werden"} unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden. Verknüpfte Prüfwerte und Berichte werden nicht automatisch gelöscht.`,
    confirmLabel: "Löschen",
  },
  archive: {
    title: "Ausgewählte Proben archivieren?",
    description: (count) =>
      `${count} ${count === 1 ? "Probe wird" : "Proben werden"} archiviert und aus der aktiven Übersicht ausgeblendet.`,
    confirmLabel: "Archivieren",
  },
};

const testerOptions = employees.map((employee) => employee.name);
const statusOptions: SampleStatus[] = [
  "Offen",
  "Vorbereitung",
  "In Prüfung",
  "Überfällig",
  "Abgeschlossen",
  "Archiviert",
];

type SampleDialogState = { mode: "create" } | { mode: "edit"; sample: Sample } | null;

function bulkResultMessage(action: string, succeeded: number, failed: number): string {
  if (failed === 0) {
    return `${succeeded} ${succeeded === 1 ? "Probe" : "Proben"} ${action}.`;
  }
  if (succeeded === 0) {
    return `${action[0].toUpperCase()}${action.slice(1)} fehlgeschlagen.`;
  }
  return `${succeeded} von ${succeeded + failed} Proben ${action}, ${failed} fehlgeschlagen.`;
}

export default function ProbekoerperPage() {
  const router = useRouter();
  const {
    samples,
    filteredSamples,
    selectedSamples,
    selectedIds,
    loading,
    error,
    refreshSamples,
    search,
    setSearch,
    filter,
    setFilter,
    advancedFilters,
    setAdvancedFilters,
    resetFilters,
    createSample,
    updateSample,
    startSample,
    completeSample,
    reopenSample,
    archiveSample,
    reactivateSample,
    duplicateSample,
    removeSample,
    bulkUpdateSamples,
    bulkArchiveSamples,
    bulkRemoveSamples,
    toggleSampleSelection,
    selectAllVisibleSamples,
    clearSelection,
  } = useSamples();

  const [sampleDialog, setSampleDialog] = useState<SampleDialogState>(null);
  const [detailSample, setDetailSample] = useState<Sample | null>(null);
  const [deleteSample, setDeleteSample] = useState<Sample | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<BulkConfirmType | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [isBulkTesterOpen, setIsBulkTesterOpen] = useState(false);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const { message: feedback, showFeedback } = useFeedbackToast();

  function applyUpdatedSample(updated: Sample | undefined) {
    if (!updated) return;
    setDetailSample((current) => (current && current.id === updated.id ? updated : current));
  }

  const kpis = useMemo(
    () => ({
      total: samples.length,
      inProgress: samples.filter((s) => s.status === "In Prüfung").length,
      prepOrOpen: samples.filter((s) => s.status === "Vorbereitung" || s.status === "Offen").length,
      overdue: samples.filter((s) => s.status === "Überfällig").length,
      done: samples.filter((s) => s.status === "Abgeschlossen").length,
      archived: samples.filter((s) => s.status === "Archiviert").length,
    }),
    [samples]
  );

  function requestAction(type: ConfirmActionType) {
    return (sample: Sample) => setConfirmAction({ sample, type });
  }

  function openEditDialog(sample: Sample) {
    setSampleDialog({ mode: "edit", sample });
  }

  async function handleConfirmAction(subject: Sample) {
    if (!confirmAction || actionPending) return;
    setActionPending(true);
    try {
      let updated: Sample | undefined;
      switch (confirmAction.type) {
        case "start":
          updated = await startSample(subject.id);
          break;
        case "complete":
          updated = await completeSample(subject.id);
          break;
        case "reopen":
          updated = await reopenSample(subject.id);
          break;
        case "archive":
          updated = await archiveSample(subject.id);
          break;
        case "reactivate":
          updated = await reactivateSample(subject.id);
          break;
      }
      applyUpdatedSample(updated);
      setConfirmAction(null);
      showFeedback(confirmCopy[confirmAction.type].successMessage);
    } catch {
      showFeedback("Aktion konnte nicht ausgeführt werden.");
    } finally {
      setActionPending(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteSample || deletePending) return;
    setDeletePending(true);
    try {
      const success = await removeSample(deleteSample.id);
      if (success) {
        setDetailSample((current) => (current && current.id === deleteSample.id ? null : current));
        showFeedback("Probe gelöscht.");
      } else {
        showFeedback("Probe konnte nicht gelöscht werden.");
      }
      setDeleteSample(null);
    } catch {
      showFeedback("Probe konnte nicht gelöscht werden.");
    } finally {
      setDeletePending(false);
    }
  }

  async function handleDuplicate(sample: Sample) {
    if (isDuplicating) return;
    setIsDuplicating(true);
    try {
      const created = await duplicateSample(sample.id);
      showFeedback(`Probe „${sample.id}" wurde als „${created.id}" dupliziert.`);
    } catch {
      showFeedback("Probe konnte nicht dupliziert werden.");
    } finally {
      setIsDuplicating(false);
    }
  }

  async function handleBulkConfirm() {
    if (!bulkConfirm || bulkPending) return;
    setBulkPending(true);
    try {
      const ids = Array.from(selectedIds);
      if (bulkConfirm === "delete") {
        const result = await bulkRemoveSamples(ids);
        showFeedback(bulkResultMessage("gelöscht", result.succeededIds.length, result.failedIds.length));
      } else {
        const result = await bulkArchiveSamples(ids);
        showFeedback(bulkResultMessage("archiviert", result.succeededIds.length, result.failedIds.length));
      }
      setBulkConfirm(null);
    } catch {
      showFeedback("Massenaktion konnte nicht ausgeführt werden.");
    } finally {
      setBulkPending(false);
    }
  }

  async function handleBulkTesterConfirm(value: string) {
    if (bulkPending) return;
    setBulkPending(true);
    try {
      const ids = Array.from(selectedIds);
      const result = await bulkUpdateSamples(ids, { pruefer: value });
      showFeedback(
        bulkResultMessage(`auf „${value}" gesetzt`, result.succeededIds.length, result.failedIds.length)
      );
      setIsBulkTesterOpen(false);
    } catch {
      showFeedback("Prüfer konnte nicht geändert werden.");
    } finally {
      setBulkPending(false);
    }
  }

  async function handleBulkStatusConfirm(value: string) {
    if (bulkPending) return;
    setBulkPending(true);
    try {
      const ids = Array.from(selectedIds);
      const result = await bulkUpdateSamples(ids, { status: value as SampleStatus });
      showFeedback(
        bulkResultMessage(`auf „${value}" gesetzt`, result.succeededIds.length, result.failedIds.length)
      );
      setIsBulkStatusOpen(false);
    } catch {
      showFeedback("Status konnte nicht geändert werden.");
    } finally {
      setBulkPending(false);
    }
  }

  const hasBlockingState = loading || Boolean(error);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Probenmanager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte Proben, Prüfungen und Laborstatus an einem Ort.
          </p>
        </div>
        <Button
          onClick={() => setSampleDialog({ mode: "create" })}
          className="w-fit"
          disabled={hasBlockingState}
        >
          <Plus className="size-4" />
          Neue Probe
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
            <Button type="button" variant="outline" size="sm" onClick={refreshSamples}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={FlaskConical} label="Proben gesamt" value={kpis.total} />
            <StatCard icon={TestTubeDiagonal} label="In Prüfung" value={kpis.inProgress} tone="default" />
            <StatCard icon={ListTodo} label="Vorbereitung/Offen" value={kpis.prepOrOpen} tone="warning" />
            <StatCard icon={TriangleAlert} label="Überfällig" value={kpis.overdue} tone="danger" />
            <StatCard icon={CheckCircle2} label="Abgeschlossen" value={kpis.done} tone="success" />
            <StatCard icon={Archive} label="Archiviert" value={kpis.archived} />
          </div>

          <SampleFilters
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            samples={samples}
            advancedFilters={advancedFilters}
            onAdvancedFiltersChange={setAdvancedFilters}
          />

          <BulkActionsToolbar
            count={selectedSamples.length}
            onClear={clearSelection}
            onDelete={() => setBulkConfirm("delete")}
            onArchive={() => setBulkConfirm("archive")}
            onChangeTester={() => setIsBulkTesterOpen(true)}
            onChangeStatus={() => setIsBulkStatusOpen(true)}
            onExport={() => showFeedback("Diese Funktion wird später angebunden.")}
          />

          <SampleTable
            samples={filteredSamples}
            onResetFilters={resetFilters}
            selectedIds={selectedIds}
            onToggleSelect={toggleSampleSelection}
            onToggleSelectAll={selectAllVisibleSamples}
            onViewDetails={setDetailSample}
            onEdit={openEditDialog}
            onEnterValues={() => router.push("/pruefungen")}
            onStart={requestAction("start")}
            onComplete={requestAction("complete")}
            onReopen={requestAction("reopen")}
            onArchive={requestAction("archive")}
            onReactivate={requestAction("reactivate")}
            onDuplicate={handleDuplicate}
            onDelete={setDeleteSample}
          />
        </>
      )}

      <SampleDetailDrawer
        sample={detailSample}
        onOpenChange={(open) => !open && setDetailSample(null)}
        onEdit={openEditDialog}
        onEnterValues={() => router.push("/pruefungen")}
        onStart={requestAction("start")}
        onComplete={requestAction("complete")}
        onReopen={requestAction("reopen")}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
        onDuplicate={handleDuplicate}
        onDelete={setDeleteSample}
        onAddAttachment={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddDeliveryNote={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      <NewSampleDialog
        open={sampleDialog !== null}
        onOpenChange={(open) => !open && setSampleDialog(null)}
        sample={sampleDialog?.mode === "edit" ? sampleDialog.sample : null}
        samples={samples}
        onCreate={createSample}
        onUpdate={updateSample}
        onSaved={(saved, mode) => {
          applyUpdatedSample(saved);
          showFeedback(mode === "edit" ? "Probe aktualisiert." : "Probe angelegt.");
        }}
      />

      <DeleteSampleDialog
        sample={deleteSample}
        onOpenChange={(open) => !open && setDeleteSample(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deletePending}
      />

      <ConfirmActionDialog<Sample>
        subject={confirmAction?.sample ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        isLoading={actionPending}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmActionDialog<boolean>
        subject={bulkConfirm ? true : null}
        title={bulkConfirm ? bulkConfirmCopy[bulkConfirm].title : ""}
        description={bulkConfirm ? bulkConfirmCopy[bulkConfirm].description(selectedSamples.length) : ""}
        confirmLabel={bulkConfirm ? bulkConfirmCopy[bulkConfirm].confirmLabel : ""}
        confirmVariant={bulkConfirm === "delete" ? "destructive" : "default"}
        isLoading={bulkPending}
        onOpenChange={(open) => !open && setBulkConfirm(null)}
        onConfirm={handleBulkConfirm}
      />

      <BulkFieldDialog
        open={isBulkTesterOpen}
        onOpenChange={setIsBulkTesterOpen}
        title="Prüfer für Auswahl ändern"
        description={`Setzt den Prüfer für ${selectedSamples.length} ausgewählte ${selectedSamples.length === 1 ? "Probe" : "Proben"}.`}
        fieldLabel="Prüfer"
        options={testerOptions}
        confirmLabel="Übernehmen"
        onConfirm={handleBulkTesterConfirm}
        isLoading={bulkPending}
      />

      <BulkFieldDialog
        open={isBulkStatusOpen}
        onOpenChange={setIsBulkStatusOpen}
        title="Status für Auswahl ändern"
        description={`Setzt den Status für ${selectedSamples.length} ausgewählte ${selectedSamples.length === 1 ? "Probe" : "Proben"}.`}
        fieldLabel="Status"
        options={statusOptions}
        confirmLabel="Übernehmen"
        onConfirm={handleBulkStatusConfirm}
        isLoading={bulkPending}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
