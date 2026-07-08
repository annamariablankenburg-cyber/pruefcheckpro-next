"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ListTodo, Plus, TestTubeDiagonal, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { StatCard } from "@/components/shared/StatCard";
import { TestEntryFilters, type TestEntryFilter } from "@/components/shared/TestEntryFilters";
import { TestEntryTable } from "@/components/shared/TestEntryTable";
import { TestValueDrawer } from "@/components/shared/TestValueDrawer";
import { HEUTE, testEntries as initialTestEntries } from "@/config/testValues";
import type { TestEntry, TestEntryStatus } from "@/types/testValue";

type ConfirmActionType = "start" | "complete" | "reopen";

interface ConfirmActionState {
  entry: TestEntry;
  type: ConfirmActionType;
}

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; nextStatus: TestEntryStatus }
> = {
  start: {
    title: "Prüfung in Bearbeitung nehmen?",
    description: "Die Prüfung wird auf den Status „In Bearbeitung“ gesetzt.",
    confirmLabel: "In Bearbeitung starten",
    nextStatus: "In Bearbeitung",
  },
  complete: {
    title: "Prüfung abschließen?",
    description: "Die Prüfung wird als „Abgeschlossen“ markiert.",
    confirmLabel: "Als abgeschlossen markieren",
    nextStatus: "Abgeschlossen",
  },
  reopen: {
    title: "Prüfung wieder öffnen?",
    description: "Die Prüfung wird erneut auf „In Bearbeitung“ gesetzt.",
    confirmLabel: "Wieder öffnen",
    nextStatus: "In Bearbeitung",
  },
};

export default function PruefungenPage() {
  const [entries, setEntries] = useState<TestEntry[]>(initialTestEntries);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TestEntryFilter>("Alle");
  const [activeEntry, setActiveEntry] = useState<TestEntry | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2500);
  }

  function updateEntry(sampleId: string, changes: Partial<TestEntry>) {
    setEntries((current) =>
      current.map((item) => (item.sampleId === sampleId ? { ...item, ...changes } : item))
    );
    setActiveEntry((current) =>
      current && current.sampleId === sampleId ? { ...current, ...changes } : current
    );
  }

  const kpis = useMemo(
    () => ({
      heute: entries.filter((entry) => entry.pruefdatum === HEUTE).length,
      offen: entries.filter((entry) => entry.status === "Offen").length,
      inBearbeitung: entries.filter((entry) => entry.status === "In Bearbeitung").length,
      abgeschlossen: entries.filter((entry) => entry.status === "Abgeschlossen").length,
      ueberfaellig: entries.filter((entry) => entry.status === "Überfällig").length,
    }),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesSearch =
        query.length === 0 ||
        [entry.sampleId, entry.titel, entry.projekt, entry.pruefer]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "Alle" ||
        (filter === "Beton" && entry.fachbereich === "Beton") ||
        (filter === "Asphalt" && entry.fachbereich === "Asphalt") ||
        (filter === "Geotechnik" && entry.fachbereich === "Geotechnik") ||
        filter === entry.status;

      return matchesSearch && matchesFilter;
    });
  }, [entries, search, filter]);

  function requestAction(type: ConfirmActionType) {
    return (entry: TestEntry) => setConfirmAction({ entry, type });
  }

  function handleConfirmAction(subject: TestEntry) {
    if (!confirmAction) return;
    updateEntry(subject.sampleId, { status: confirmCopy[confirmAction.type].nextStatus });
    setConfirmAction(null);
  }

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
        <Button
          onClick={() => showFeedback("Diese Funktion wird später angebunden.")}
          className="w-fit"
        >
          <Plus className="size-4" />
          Neue Prüfung
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={CalendarClock} label="Prüfungen heute" value={kpis.heute} />
        <StatCard icon={ListTodo} label="Offen" value={kpis.offen} tone="warning" />
        <StatCard icon={TestTubeDiagonal} label="In Bearbeitung" value={kpis.inBearbeitung} />
        <StatCard icon={CheckCircle2} label="Abgeschlossen" value={kpis.abgeschlossen} tone="success" />
        <StatCard icon={TriangleAlert} label="Überfällig" value={kpis.ueberfaellig} tone="danger" />
      </div>

      <TestEntryFilters search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} />

      <TestEntryTable
        entries={filteredEntries}
        onOpen={setActiveEntry}
        onStart={requestAction("start")}
        onComplete={requestAction("complete")}
        onReopen={requestAction("reopen")}
        onCreateReport={() => showFeedback("Diese Funktion wird später angebunden.")}
        onExportExcel={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      <TestValueDrawer
        entry={activeEntry}
        onOpenChange={(open) => !open && setActiveEntry(null)}
        onStart={requestAction("start")}
        onComplete={requestAction("complete")}
        onReopen={requestAction("reopen")}
        onCreateReport={() => showFeedback("Diese Funktion wird später angebunden.")}
        onExportExcel={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      <ConfirmActionDialog<TestEntry>
        subject={confirmAction?.entry ?? null}
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
