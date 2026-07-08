"use client";

import { useMemo, useState } from "react";
import { Archive, BookOpen, CalendarClock, CalendarDays, Plus, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { LaborbookDetailDrawer } from "@/components/shared/LaborbookDetailDrawer";
import { LaborbookFilters, type LaborbookFilter } from "@/components/shared/LaborbookFilters";
import { LaborbookTable } from "@/components/shared/LaborbookTable";
import { LaborbookTimeline } from "@/components/shared/LaborbookTimeline";
import { LaborbookViewSwitcher, type LaborbookView } from "@/components/shared/LaborbookViewSwitcher";
import { NewLaborbookEntryDialog } from "@/components/shared/NewLaborbookEntryDialog";
import { StatCard } from "@/components/shared/StatCard";
import { DIESE_WOCHE, HEUTE, laborbookEntries as initialEntries } from "@/config/laborbook";
import type { LaborbookEntry, LaborbookStatus } from "@/types/laborbook";

type ConfirmActionType = "archive" | "reactivate";

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; nextStatus: LaborbookStatus }
> = {
  archive: {
    title: "Eintrag archivieren?",
    description: "Der Eintrag wird aus der aktiven Übersicht ausgeblendet, bleibt aber erhalten.",
    confirmLabel: "Archivieren",
    nextStatus: "Archiviert",
  },
  reactivate: {
    title: "Eintrag reaktivieren?",
    description: "Der Eintrag wird wieder als „Aktiv“ in die aktive Übersicht aufgenommen.",
    confirmLabel: "Reaktivieren",
    nextStatus: "Aktiv",
  },
};

export default function LaborbuchPage() {
  const [entries, setEntries] = useState<LaborbookEntry[]>(initialEntries);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LaborbookFilter>("Alle");
  const [view, setView] = useState<LaborbookView>("Tabelle");

  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<LaborbookEntry | null>(null);
  const [editEntry, setEditEntry] = useState<LaborbookEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<LaborbookEntry | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    entry: LaborbookEntry;
    type: ConfirmActionType;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2500);
  }

  function updateEntry(id: string, changes: Partial<LaborbookEntry>) {
    setEntries((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
    setDetailEntry((current) => (current && current.id === id ? { ...current, ...changes } : current));
  }

  const kpis = useMemo(
    () => ({
      total: entries.length,
      heute: entries.filter((entry) => entry.datum === HEUTE).length,
      dieseWoche: entries.filter((entry) => DIESE_WOCHE.includes(entry.datum)).length,
      offen: entries.filter((entry) => entry.status === "Aktiv").length,
      archiviert: entries.filter((entry) => entry.status === "Archiviert").length,
    }),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool =
      filter === "Archiviert"
        ? entries.filter((entry) => entry.status === "Archiviert")
        : entries.filter((entry) => entry.status !== "Archiviert");

    return pool.filter((entry) => {
      const matchesSearch =
        query.length === 0 ||
        [entry.titel, entry.beschreibung, entry.projekt, entry.probeId, entry.mitarbeiter, entry.kunde]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "Alle" ||
        filter === "Archiviert" ||
        (filter === "Prüfungen" && entry.typ === "Prüfung") ||
        (filter === "Geräte" && entry.typ === "Gerät") ||
        (filter === "Kalibrierungen" && entry.typ === "Kalibrierung") ||
        (filter === "Wartungen" && entry.typ === "Wartung") ||
        (filter === "Notizen" && entry.typ === "Notiz") ||
        (filter === "Ereignisse" && entry.typ === "Ereignis") ||
        (filter === "Beton" && entry.fachbereich === "Beton") ||
        (filter === "Asphalt" && entry.fachbereich === "Asphalt") ||
        (filter === "Geotechnik" && entry.fachbereich === "Geotechnik");

      return matchesSearch && matchesFilter;
    });
  }, [entries, search, filter]);

  function requestAction(type: ConfirmActionType) {
    return (entry: LaborbookEntry) => setConfirmAction({ entry, type });
  }

  function handleConfirmAction(subject: LaborbookEntry) {
    if (!confirmAction) return;
    updateEntry(subject.id, { status: confirmCopy[confirmAction.type].nextStatus });
    setConfirmAction(null);
  }

  function handleConfirmDelete(subject: LaborbookEntry) {
    setEntries((current) => current.filter((entry) => entry.id !== subject.id));
    setDetailEntry((current) => (current && current.id === subject.id ? null : current));
    setDeleteEntry(null);
  }

  function handleSaveEntry(id: string, changes: Partial<LaborbookEntry>) {
    updateEntry(id, changes);
    setEditEntry(null);
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Laborbuch
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dokumentiere alle Laboraktivitäten, Prüfungen und Ereignisse chronologisch.
          </p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="w-fit">
          <Plus className="size-4" />
          Neuer Eintrag
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={BookOpen} label="Einträge gesamt" value={kpis.total} />
        <StatCard icon={CalendarDays} label="Heute" value={kpis.heute} />
        <StatCard icon={CalendarClock} label="Diese Woche" value={kpis.dieseWoche} />
        <StatCard icon={Timer} label="Offene Einträge" value={kpis.offen} tone="warning" />
        <StatCard icon={Archive} label="Archiviert" value={kpis.archiviert} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <LaborbookFilters
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />
        <LaborbookViewSwitcher view={view} onViewChange={setView} />
      </div>

      {view === "Tabelle" ? (
        <LaborbookTable
          entries={filteredEntries}
          onViewDetails={setDetailEntry}
          onEdit={setEditEntry}
          onArchive={requestAction("archive")}
          onReactivate={requestAction("reactivate")}
          onDelete={setDeleteEntry}
        />
      ) : (
        <LaborbookTimeline entries={filteredEntries} onViewDetails={setDetailEntry} />
      )}

      <LaborbookDetailDrawer
        entry={detailEntry}
        onOpenChange={(open) => !open && setDetailEntry(null)}
        onEdit={setEditEntry}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
        onDelete={setDeleteEntry}
        onAddPhoto={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      <NewLaborbookEntryDialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen} />

      <NewLaborbookEntryDialog
        open={editEntry !== null}
        onOpenChange={(open) => !open && setEditEntry(null)}
        entry={editEntry}
        onSave={handleSaveEntry}
      />

      <ConfirmActionDialog<LaborbookEntry>
        subject={confirmAction?.entry ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmActionDialog<LaborbookEntry>
        subject={deleteEntry}
        title="Eintrag wirklich löschen?"
        description="Diese Aktion kann später im Audit-Log dokumentiert werden. Der Eintrag wird dauerhaft entfernt."
        confirmLabel="Löschen"
        confirmVariant="destructive"
        onOpenChange={(open) => !open && setDeleteEntry(null)}
        onConfirm={handleConfirmDelete}
      />

      {feedback && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg">
          {feedback}
        </div>
      )}
    </div>
  );
}
