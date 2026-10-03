"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Archive, BookOpen, CalendarClock, CalendarDays, Plus, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { LaborbookDetailDrawer } from "@/components/shared/LaborbookDetailDrawer";
import { LaborbookFilters } from "@/components/shared/LaborbookFilters";
import { LaborbookTable } from "@/components/shared/LaborbookTable";
import { LaborbookTimeline } from "@/components/shared/LaborbookTimeline";
import { LaborbookViewSwitcher, type LaborbookView } from "@/components/shared/LaborbookViewSwitcher";
import { NewLaborbookEntryDialog } from "@/components/shared/NewLaborbookEntryDialog";
import { StatCard } from "@/components/shared/StatCard";
import { useLaborbook } from "@/hooks/useLaborbook";
import { formatDateDE, getWeekDates } from "@/lib/calendar/calendarDates";
import type { LaborbookFormValues } from "@/lib/laborbook/laborbookEntries";
import type { LaborbookEntry } from "@/types/laborbook";

type ConfirmActionType = "archive" | "reactivate";

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; successMessage: string; failureMessage: string }
> = {
  archive: {
    title: "Eintrag archivieren?",
    description: "Der Eintrag wird aus der aktiven Übersicht ausgeblendet, bleibt aber erhalten.",
    confirmLabel: "Archivieren",
    successMessage: "Eintrag archiviert.",
    failureMessage: "Eintrag konnte nicht archiviert werden.",
  },
  reactivate: {
    title: "Eintrag reaktivieren?",
    description: "Der Eintrag wird wieder als „Aktiv“ in die aktive Übersicht aufgenommen.",
    confirmLabel: "Reaktivieren",
    successMessage: "Eintrag reaktiviert.",
    failureMessage: "Eintrag konnte nicht reaktiviert werden.",
  },
};

export default function LaborbuchPage() {
  const {
    entries,
    filteredEntries,
    loading,
    error,
    referenceDate,
    refreshLaborbookEntries,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    createEntry,
    updateEntry,
    archiveEntry,
    restoreEntry,
    removeEntry,
  } = useLaborbook();
  const [view, setView] = useState<LaborbookView>("Tabelle");

  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  // Auswahl als ID: Drawer/Dialog zeigen immer den aktuellen Stand aus der Liste.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<LaborbookEntry | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    entry: LaborbookEntry;
    type: ConfirmActionType;
  } | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const detailEntry = entries.find((entry) => entry.id === detailId) ?? null;
  const editEntry = entries.find((entry) => entry.id === editId) ?? null;
  const isBlocking = loading || Boolean(error);

  // KPIs hängen am Bezugsdatum. Solange es fehlt, bleiben die Werte "—" statt
  // falscher Zahlen.
  const kpis = useMemo(() => {
    const base = {
      total: entries.length,
      offen: entries.filter((entry) => entry.status === "Aktiv").length,
      archiviert: entries.filter((entry) => entry.status === "Archiviert").length,
    };
    if (!referenceDate) return { ...base, heute: null, dieseWoche: null };
    const todayDE = formatDateDE(referenceDate);
    const weekDE = new Set(getWeekDates(referenceDate).map(formatDateDE));
    return {
      ...base,
      heute: entries.filter((entry) => entry.datum === todayDE).length,
      dieseWoche: entries.filter((entry) => weekDE.has(entry.datum)).length,
    };
  }, [entries, referenceDate]);

  function requestAction(type: ConfirmActionType) {
    return (entry: LaborbookEntry) => setConfirmAction({ entry, type });
  }

  async function handleConfirmAction(subject: LaborbookEntry) {
    if (!confirmAction || actionPending) return;
    const copy = confirmCopy[confirmAction.type];
    setActionPending(true);
    try {
      const updated =
        confirmAction.type === "archive" ? await archiveEntry(subject.id) : await restoreEntry(subject.id);
      if (!updated) {
        showFeedback(copy.failureMessage);
        return;
      }
      setConfirmAction(null);
      showFeedback(copy.successMessage);
    } catch {
      showFeedback(copy.failureMessage);
    } finally {
      setActionPending(false);
    }
  }

  async function handleConfirmDelete(subject: LaborbookEntry) {
    if (deletePending) return;
    setDeletePending(true);
    try {
      const removed = await removeEntry(subject.id);
      if (!removed) {
        showFeedback("Eintrag konnte nicht gelöscht werden.");
        return;
      }
      // Drawer schließt sich automatisch, weil der Eintrag aus der Liste fällt.
      setDetailId((current) => (current === subject.id ? null : current));
      setDeleteEntry(null);
      showFeedback("Eintrag gelöscht.");
    } catch {
      showFeedback("Eintrag konnte nicht gelöscht werden.");
    } finally {
      setDeletePending(false);
    }
  }

  // Liefern true nur bei bestätigtem Service-Ergebnis; sonst bleibt der Dialog offen.
  async function handleCreate(values: LaborbookFormValues): Promise<boolean> {
    try {
      await createEntry(values);
      showFeedback("Eintrag angelegt.");
      return true;
    } catch {
      return false;
    }
  }

  async function handleUpdate(id: string, values: LaborbookFormValues): Promise<boolean> {
    try {
      const updated = await updateEntry(id, values);
      if (!updated) return false;
      showFeedback("Änderungen gespeichert.");
      return true;
    } catch {
      return false;
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title">
            Laborbuch
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dokumentiere alle Laboraktivitäten, Prüfungen und Ereignisse chronologisch.
          </p>
        </div>
        <Button onClick={() => setIsNewEntryOpen(true)} className="w-fit" disabled={isBlocking}>
          <Plus className="size-4" />
          Neuer Eintrag
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="skeleton h-[104px]" />
            ))}
          </div>
          <Card className="skeleton skeleton-rows h-72" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={refreshLaborbookEntries}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={BookOpen} label="Einträge gesamt" value={kpis.total} />
            <StatCard icon={CalendarDays} label="Heute" value={kpis.heute ?? "—"} />
            <StatCard icon={CalendarClock} label="Diese Woche" value={kpis.dieseWoche ?? "—"} />
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
              onResetFilters={resetFilters}
              onViewDetails={(entry) => setDetailId(entry.id)}
              onEdit={(entry) => setEditId(entry.id)}
              onArchive={requestAction("archive")}
              onReactivate={requestAction("reactivate")}
              onDelete={setDeleteEntry}
            />
          ) : (
            <LaborbookTimeline
              entries={filteredEntries}
              onViewDetails={(entry) => setDetailId(entry.id)}
              onResetFilters={resetFilters}
            />
          )}
        </>
      )}

      <LaborbookDetailDrawer
        entry={detailEntry}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(entry) => setEditId(entry.id)}
        onArchive={requestAction("archive")}
        onReactivate={requestAction("reactivate")}
        onDelete={setDeleteEntry}
        onAddPhoto={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      <NewLaborbookEntryDialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen} onSubmit={handleCreate} />

      <NewLaborbookEntryDialog
        open={editEntry !== null}
        onOpenChange={(open) => !open && setEditId(null)}
        entry={editEntry}
        onSubmit={(values) => (editEntry ? handleUpdate(editEntry.id, values) : Promise.resolve(false))}
      />

      <ConfirmActionDialog<LaborbookEntry>
        subject={confirmAction?.entry ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        isLoading={actionPending}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmActionDialog<LaborbookEntry>
        subject={deleteEntry}
        title="Eintrag wirklich löschen?"
        description="Der Eintrag wird dauerhaft entfernt. Verknüpfte Probe, Projekt, Kunde und Gerät bleiben unverändert."
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
