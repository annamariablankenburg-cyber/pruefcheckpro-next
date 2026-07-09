"use client";

import { useMemo, useState } from "react";
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
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { DeleteSampleDialog } from "@/components/shared/DeleteSampleDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewSampleDialog } from "@/components/shared/NewSampleDialog";
import { SampleDetailDrawer } from "@/components/shared/SampleDetailDrawer";
import { SampleFilters, type SampleFilter } from "@/components/shared/SampleFilters";
import { SampleTable } from "@/components/shared/SampleTable";
import { StatCard } from "@/components/shared/StatCard";
import { samples as initialSamples } from "@/config/samples";
import type { Sample, SampleStatus } from "@/types/sample";

type ConfirmActionType = "start" | "complete" | "reopen" | "archive" | "reactivate";

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

export default function ProbekoerperPage() {
  const [samples, setSamples] = useState<Sample[]>(initialSamples);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SampleFilter>("Alle");

  const [isNewSampleOpen, setIsNewSampleOpen] = useState(false);
  const [detailSample, setDetailSample] = useState<Sample | null>(null);
  const [editSample, setEditSample] = useState<Sample | null>(null);
  const [deleteSample, setDeleteSample] = useState<Sample | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  function updateSample(id: string, changes: Partial<Sample>) {
    setSamples((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
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

  const filteredSamples = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool =
      filter === "Archiviert"
        ? samples.filter((sample) => sample.status === "Archiviert")
        : samples.filter((sample) => sample.status !== "Archiviert");

    return pool.filter((sample) => {
      const matchesSearch =
        query.length === 0 ||
        [sample.id, sample.bezeichnung, sample.kunde, sample.projekt, sample.probenart]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "Alle" ||
        filter === "Archiviert" ||
        (filter === "Beton" && sample.fachbereich === "Beton") ||
        (filter === "Asphalt" && sample.fachbereich === "Asphalt") ||
        (filter === "Geotechnik" && sample.fachbereich === "Geotechnik") ||
        filter === sample.status;

      return matchesSearch && matchesFilter;
    });
  }, [samples, search, filter]);

  function requestAction(type: ConfirmActionType) {
    return (sample: Sample) => setConfirmAction({ sample, type });
  }

  function handleResetFilters() {
    setSearch("");
    setFilter("Alle");
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
    setSamples((current) => current.filter((sample) => sample.id !== deleteSample.id));
    setDetailSample((current) => (current && current.id === deleteSample.id ? null : current));
    setDeleteSample(null);
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
      />

      <SampleTable
        samples={filteredSamples}
        onResetFilters={handleResetFilters}
        onViewDetails={setDetailSample}
        onEdit={setEditSample}
        onEnterValues={() => showFeedback("Diese Funktion wird später angebunden.")}
        onStart={requestAction("start")}
        onComplete={requestAction("complete")}
        onReopen={requestAction("reopen")}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
        onDelete={setDeleteSample}
      />

      <SampleDetailDrawer
        sample={detailSample}
        onOpenChange={(open) => !open && setDetailSample(null)}
        onEdit={setEditSample}
        onEnterValues={() => showFeedback("Diese Funktion wird später angebunden.")}
        onStart={requestAction("start")}
        onComplete={requestAction("complete")}
        onReopen={requestAction("reopen")}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
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

      <FeedbackToast message={feedback} />
    </div>
  );
}
