"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  FlaskConical,
  ListTodo,
  Plus,
  TestTubeDiagonal,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  { title: string; description: string; confirmLabel: string; nextStatus: SampleStatus }
> = {
  start: {
    title: "Prüfung starten?",
    description: "Die Probe wird auf den Status „In Prüfung“ gesetzt.",
    confirmLabel: "In Prüfung starten",
    nextStatus: "In Prüfung",
  },
  complete: {
    title: "Probe abschließen?",
    description: "Die Probe wird als „Abgeschlossen“ markiert.",
    confirmLabel: "Abschließen",
    nextStatus: "Abgeschlossen",
  },
  reopen: {
    title: "Probe wieder öffnen?",
    description: "Die Probe wird erneut auf „In Prüfung“ gesetzt.",
    confirmLabel: "Wieder öffnen",
    nextStatus: "In Prüfung",
  },
  archive: {
    title: "Probe archivieren?",
    description: "Die Probe wird archiviert und aus der aktiven Übersicht ausgeblendet.",
    confirmLabel: "Archivieren",
    nextStatus: "Archiviert",
  },
  reactivate: {
    title: "Probe reaktivieren?",
    description: "Die Probe wird wieder als „Abgeschlossen“ in die aktive Übersicht aufgenommen.",
    confirmLabel: "Reaktivieren",
    nextStatus: "Abgeschlossen",
  },
};

const bulkConfirmCopy: Record<
  BulkConfirmType,
  { title: string; description: (count: number) => string; confirmLabel: string }
> = {
  delete: {
    title: "Ausgewählte Proben löschen?",
    description: (count) =>
      `${count} ${count === 1 ? "Probe wird" : "Proben werden"} unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`,
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

export default function ProbekoerperPage() {
  const router = useRouter();
  const {
    samples,
    filteredSamples,
    search,
    setSearch,
    filter,
    setFilter,
    advancedFilters,
    setAdvancedFilters,
    resetFilters,
    updateSample: updateSampleData,
    removeSample,
    createSample,
    bulkUpdateStatus,
    bulkUpdatePruefer,
    bulkRemove,
  } = useSamples();

  const [isNewSampleOpen, setIsNewSampleOpen] = useState(false);
  const [detailSample, setDetailSample] = useState<Sample | null>(null);
  const [editSample, setEditSample] = useState<Sample | null>(null);
  const [deleteSample, setDeleteSample] = useState<Sample | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<BulkConfirmType | null>(null);
  const [isBulkTesterOpen, setIsBulkTesterOpen] = useState(false);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const { message: feedback, showFeedback } = useFeedbackToast();

  function updateSample(id: string, changes: Partial<Sample>) {
    updateSampleData(id, changes);
    setDetailSample((current) => (current && current.id === id ? { ...current, ...changes } : current));
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

  function handleConfirmAction(subject: Sample) {
    if (!confirmAction) return;
    const { nextStatus } = confirmCopy[confirmAction.type];
    updateSample(subject.id, { status: nextStatus });
    setConfirmAction(null);
  }

  function handleSaveSample(id: string, changes: Partial<Sample>) {
    updateSample(id, changes);
    setEditSample(null);
  }

  function handleConfirmDelete() {
    if (!deleteSample) return;
    removeSample(deleteSample.id);
    setDetailSample((current) => (current && current.id === deleteSample.id ? null : current));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(deleteSample.id);
      return next;
    });
    setDeleteSample(null);
  }

  function handleDuplicate(sample: Sample) {
    const newId = `${sample.id}-KOPIE`;
    const duplicate: Sample = {
      ...sample,
      id: newId,
      status: "Offen",
      pruefungen: [],
      historie: [{ message: `Dupliziert von ${sample.id}.`, timestamp: sample.entnahmedatum }],
    };
    createSample(duplicate);
    showFeedback(`Probe „${sample.id}" wurde als „${newId}" dupliziert.`);
  }

  function toggleSelect(sample: Sample) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(sample.id)) next.delete(sample.id);
      else next.add(sample.id);
      return next;
    });
  }

  function toggleSelectAll(visibleSamples: Sample[]) {
    setSelectedIds((current) => {
      const allSelected = visibleSamples.every((sample) => current.has(sample.id));
      if (allSelected) return new Set();
      return new Set(visibleSamples.map((sample) => sample.id));
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleBulkConfirm() {
    if (!bulkConfirm) return;
    const ids = Array.from(selectedIds);
    if (bulkConfirm === "delete") {
      bulkRemove(ids);
      showFeedback(`${ids.length} ${ids.length === 1 ? "Probe wurde" : "Proben wurden"} gelöscht.`);
    } else {
      bulkUpdateStatus(ids, "Archiviert");
      showFeedback(`${ids.length} ${ids.length === 1 ? "Probe wurde" : "Proben wurden"} archiviert.`);
    }
    setBulkConfirm(null);
    clearSelection();
  }

  function handleBulkTesterConfirm(value: string) {
    const ids = Array.from(selectedIds);
    bulkUpdatePruefer(ids, value);
    setIsBulkTesterOpen(false);
    showFeedback(`Prüfer für ${ids.length} ${ids.length === 1 ? "Probe" : "Proben"} auf „${value}" gesetzt.`);
    clearSelection();
  }

  function handleBulkStatusConfirm(value: string) {
    const ids = Array.from(selectedIds);
    bulkUpdateStatus(ids, value as SampleStatus);
    setIsBulkStatusOpen(false);
    showFeedback(`Status für ${ids.length} ${ids.length === 1 ? "Probe" : "Proben"} auf „${value}" gesetzt.`);
    clearSelection();
  }

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
        <Button onClick={() => setIsNewSampleOpen(true)} className="w-fit">
          <Plus className="size-4" />
          Neue Probe
        </Button>
      </div>

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
        count={selectedIds.size}
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
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onViewDetails={setDetailSample}
        onEdit={setEditSample}
        onEnterValues={() => router.push("/pruefungen")}
        onStart={requestAction("start")}
        onComplete={requestAction("complete")}
        onReopen={requestAction("reopen")}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
        onDuplicate={handleDuplicate}
        onDelete={setDeleteSample}
      />

      <SampleDetailDrawer
        sample={detailSample}
        onOpenChange={(open) => !open && setDetailSample(null)}
        onEdit={setEditSample}
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

      <NewSampleDialog open={isNewSampleOpen} onOpenChange={setIsNewSampleOpen} />

      <NewSampleDialog
        open={editSample !== null}
        onOpenChange={(open) => !open && setEditSample(null)}
        sample={editSample}
        onSave={handleSaveSample}
      />

      <DeleteSampleDialog
        sample={deleteSample}
        onOpenChange={(open) => !open && setDeleteSample(null)}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmActionDialog<Sample>
        subject={confirmAction?.sample ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmActionDialog<boolean>
        subject={bulkConfirm ? true : null}
        title={bulkConfirm ? bulkConfirmCopy[bulkConfirm].title : ""}
        description={bulkConfirm ? bulkConfirmCopy[bulkConfirm].description(selectedIds.size) : ""}
        confirmLabel={bulkConfirm ? bulkConfirmCopy[bulkConfirm].confirmLabel : ""}
        confirmVariant={bulkConfirm === "delete" ? "destructive" : "default"}
        onOpenChange={(open) => !open && setBulkConfirm(null)}
        onConfirm={handleBulkConfirm}
      />

      <BulkFieldDialog
        open={isBulkTesterOpen}
        onOpenChange={setIsBulkTesterOpen}
        title="Prüfer für Auswahl ändern"
        description={`Setzt den Prüfer für ${selectedIds.size} ausgewählte ${selectedIds.size === 1 ? "Probe" : "Proben"}.`}
        fieldLabel="Prüfer"
        options={testerOptions}
        confirmLabel="Übernehmen"
        onConfirm={handleBulkTesterConfirm}
      />

      <BulkFieldDialog
        open={isBulkStatusOpen}
        onOpenChange={setIsBulkStatusOpen}
        title="Status für Auswahl ändern"
        description={`Setzt den Status für ${selectedIds.size} ausgewählte ${selectedIds.size === 1 ? "Probe" : "Proben"}.`}
        fieldLabel="Status"
        options={statusOptions}
        confirmLabel="Übernehmen"
        onConfirm={handleBulkStatusConfirm}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
