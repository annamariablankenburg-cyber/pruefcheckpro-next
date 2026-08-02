"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ListTodo,
  Plus,
  TestTubeDiagonal,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewTestEntryDialog } from "@/components/shared/NewTestEntryDialog";
import { StatCard } from "@/components/shared/StatCard";
import { TestEntryFilters } from "@/components/shared/TestEntryFilters";
import { TestEntryTable } from "@/components/shared/TestEntryTable";
import { TestValueDrawer } from "@/components/shared/TestValueDrawer";
import { reportRepository } from "@/lib/repositories/reportRepository";
import { buildTestEntryFromSample, HEUTE } from "@/config/testValues";
import { useSamples } from "@/hooks/useSamples";
import { useTestEntries } from "@/hooks/useTestEntries";
import type { TestEntry } from "@/types/testValue";

type ConfirmActionType = "start" | "complete" | "reopen";

interface ConfirmActionState {
  entry: TestEntry;
  type: ConfirmActionType;
}

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; successMessage: string }
> = {
  start: {
    title: "Prüfung in Bearbeitung nehmen?",
    description: "Die Prüfung wird auf den Status „In Bearbeitung“ gesetzt.",
    confirmLabel: "In Bearbeitung starten",
    successMessage: "Prüfung in Bearbeitung.",
  },
  complete: {
    title: "Prüfung abschließen?",
    description: "Die Prüfung wird als „Abgeschlossen“ markiert.",
    confirmLabel: "Als abgeschlossen markieren",
    successMessage: "Prüfung abgeschlossen.",
  },
  reopen: {
    title: "Prüfung wieder öffnen?",
    description: "Die Prüfung wird erneut auf „In Bearbeitung“ gesetzt.",
    confirmLabel: "Wieder öffnen",
    successMessage: "Prüfung wieder geöffnet.",
  },
};

export default function PruefungenPage() {
  return (
    <Suspense fallback={null}>
      <PruefungenPageContent />
    </Suspense>
  );
}

// useSearchParams() erfordert eine Suspense-Boundary (siehe Next.js-Doku),
// da die Route über "?sampleId=" geöffnet werden kann (Abschnitt 7 des
// Auftrags) – deshalb der schlanke Wrapper oben statt eines einzigen
// Komponenten-Exports.
function PruefungenPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    testEntries,
    filteredTestEntries,
    activeTestEntry,
    setActiveTestEntry,
    loading,
    error,
    refreshTestEntries,
    createTestEntry,
    saveDraft,
    saveResult,
    startTest,
    completeTest,
    reopenTest,
    removeTestEntry,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
  } = useTestEntries();
  // Read-only Probenzugriff: nur um beim Öffnen über "?sampleId=" eine neue
  // Prüfung aus einer gültigen, nicht archivierten Probe abzuleiten (siehe
  // Abschnitt 7 des Auftrags). Keine Schreibzugriffe auf Probendaten.
  const { samples, loading: samplesLoading } = useSamples();

  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<TestEntry | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [isPreparingEntry, setIsPreparingEntry] = useState(false);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const requestedSampleId = searchParams.get("sampleId");
  const handledSampleIdRef = useRef<string | null>(null);

  // Route wurde über eine Probe geöffnet (siehe probekoerper/page.tsx,
  // onEnterValues): passende Prüfung vorauswählen bzw. bei Bedarf anlegen.
  // Keine ungültige/archivierte sampleId zulassen.
  useEffect(() => {
    if (!requestedSampleId) return;
    if (handledSampleIdRef.current === requestedSampleId) return;
    if (loading || samplesLoading) return;

    handledSampleIdRef.current = requestedSampleId;

    const existing = testEntries.find((entry) => entry.sampleId === requestedSampleId);
    if (existing) {
      setActiveTestEntry(existing);
      return;
    }

    const sample = samples.find((candidate) => candidate.id === requestedSampleId);
    if (!sample || sample.status === "Archiviert") {
      showFeedback("Diese Probe ist ungültig oder archiviert.");
      return;
    }

    setIsPreparingEntry(true);
    createTestEntry(buildTestEntryFromSample(sample))
      .then((created) => {
        setActiveTestEntry(created);
      })
      .catch(() => {
        showFeedback("Prüfung konnte nicht angelegt werden.");
      })
      .finally(() => {
        setIsPreparingEntry(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedSampleId, loading, samplesLoading, testEntries, samples]);

  const kpis = useMemo(
    () => ({
      heute: testEntries.filter((entry) => entry.pruefdatum === HEUTE).length,
      offen: testEntries.filter((entry) => entry.status === "Offen").length,
      inBearbeitung: testEntries.filter((entry) => entry.status === "In Bearbeitung").length,
      abgeschlossen: testEntries.filter((entry) => entry.status === "Abgeschlossen").length,
      ueberfaellig: testEntries.filter((entry) => entry.status === "Überfällig").length,
    }),
    [testEntries]
  );

  function requestAction(type: ConfirmActionType) {
    return (entry: TestEntry) => setConfirmAction({ entry, type });
  }

  function handleCreateReport(entry: TestEntry) {
    const hasLinkedReport = reportRepository.getAll().some((report) => report.probeId === entry.sampleId);
    if (hasLinkedReport) {
      showFeedback("Verknüpfter Bericht wird geöffnet.");
      router.push("/pdf-export");
      return;
    }
    showFeedback("Diese Funktion wird später angebunden.");
  }

  async function handleConfirmAction(subject: TestEntry) {
    if (!confirmAction || actionPending) return;
    setActionPending(true);
    try {
      let updated: TestEntry | undefined;
      switch (confirmAction.type) {
        case "start":
          updated = await startTest(subject.sampleId);
          break;
        case "complete":
          updated = await completeTest(subject.sampleId);
          break;
        case "reopen":
          updated = await reopenTest(subject.sampleId);
          break;
      }
      if (!updated) {
        showFeedback("Aktion konnte nicht ausgeführt werden.");
        return;
      }
      setConfirmAction(null);
      showFeedback(confirmCopy[confirmAction.type].successMessage);
    } catch {
      showFeedback("Aktion konnte nicht ausgeführt werden.");
    } finally {
      setActionPending(false);
    }
  }

  async function handleConfirmDelete(entry: TestEntry) {
    if (deletePending) return;
    setDeletePending(true);
    try {
      const success = await removeTestEntry(entry.sampleId);
      if (success) {
        showFeedback("Prüfung gelöscht.");
        setDeleteEntry(null);
      } else {
        showFeedback("Prüfung konnte nicht gelöscht werden.");
      }
    } catch {
      showFeedback("Prüfung konnte nicht gelöscht werden.");
    } finally {
      setDeletePending(false);
    }
  }

  const hasBlockingState = loading || Boolean(error) || isPreparingEntry;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Prüfwerte
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Erfasse Messwerte, bereite Berechnungen vor und dokumentiere Ergebnisse.
          </p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="w-fit" disabled={hasBlockingState}>
          <Plus className="size-4" />
          Neue Prüfung
        </Button>
      </div>

      {loading || isPreparingEntry ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
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
            <Button type="button" variant="outline" size="sm" onClick={refreshTestEntries}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={CalendarClock} label="Prüfungen heute" value={kpis.heute} />
            <StatCard icon={ListTodo} label="Offen" value={kpis.offen} tone="warning" />
            <StatCard icon={TestTubeDiagonal} label="In Bearbeitung" value={kpis.inBearbeitung} />
            <StatCard icon={CheckCircle2} label="Abgeschlossen" value={kpis.abgeschlossen} tone="success" />
            <StatCard icon={TriangleAlert} label="Überfällig" value={kpis.ueberfaellig} tone="danger" />
          </div>

          <TestEntryFilters search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} />

          <TestEntryTable
            entries={filteredTestEntries}
            onResetFilters={resetFilters}
            onOpen={setActiveTestEntry}
            onStart={requestAction("start")}
            onComplete={requestAction("complete")}
            onReopen={requestAction("reopen")}
            onCreateReport={handleCreateReport}
            onExportExcel={() => showFeedback("Diese Funktion wird später angebunden.")}
            onDelete={setDeleteEntry}
          />
        </>
      )}

      <TestValueDrawer
        entry={activeTestEntry}
        onOpenChange={(open) => !open && setActiveTestEntry(null)}
        onStart={requestAction("start")}
        onComplete={requestAction("complete")}
        onReopen={requestAction("reopen")}
        onCreateReport={handleCreateReport}
        onExportExcel={() => showFeedback("Diese Funktion wird später angebunden.")}
        onFeedback={showFeedback}
        onSaveDraft={saveDraft}
        onSaveResult={saveResult}
      />

      <NewTestEntryDialog
        open={isNewEntryOpen}
        onOpenChange={setIsNewEntryOpen}
        testEntries={testEntries}
        onCreate={createTestEntry}
        onCreated={(created) => {
          setActiveTestEntry(created);
          showFeedback("Prüfung angelegt.");
        }}
      />

      <ConfirmActionDialog<TestEntry>
        subject={confirmAction?.entry ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        isLoading={actionPending}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmActionDialog<TestEntry>
        subject={deleteEntry}
        title="Prüfung löschen?"
        description="Die Prüfung wird gelöscht. Verknüpfte Berichte werden nicht automatisch entfernt."
        confirmLabel="Löschen"
        confirmVariant="destructive"
        isLoading={deletePending}
        onOpenChange={(open) => !open && setDeleteEntry(null)}
        onConfirm={handleConfirmDelete}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
