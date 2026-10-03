"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Info } from "lucide-react";

import { AgendaList } from "@/components/shared/AgendaList";
import { AutoSchedulePreview } from "@/components/shared/AutoSchedulePreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarEventDrawer } from "@/components/shared/CalendarEventDrawer";
import { CalendarLegend } from "@/components/shared/CalendarLegend";
import { CalendarMoveDialog } from "@/components/shared/CalendarMoveDialog";
import { CalendarToolbar, type CalendarViewMode } from "@/components/shared/CalendarToolbar";
import { CalendarView } from "@/components/shared/CalendarView";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewCalendarTaskDialog } from "@/components/shared/NewCalendarTaskDialog";
import { weekDayLabels } from "@/config/calendarEvents";
import { buildWeekDays, formatDateDE, formatRangeLabel, getWeekDates } from "@/lib/calendar/calendarDates";
import { useCalendar } from "@/hooks/useCalendar";
import type { NewCalendarEventInput } from "@/lib/interfaces/ICalendarService";
import type { CalendarEvent } from "@/types/calendarEvent";

export default function KalenderPage() {
  const router = useRouter();
  const {
    events: calendarEvents,
    todaysEvents,
    eventsForDate,
    referenceDate,
    loading,
    error,
    refreshCalendarEvents,
    createEvent,
    updateEvent,
    removeEvent,
    duplicateEvent,
  } = useCalendar();
  const [view, setView] = useState<CalendarViewMode>("woche");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [movingEvent, setMovingEvent] = useState<CalendarEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  // Die Woche folgt dem Bezugsdatum (heute bzw. Mock-Demo-Datum), nicht einer
  // festen Demo-Woche. Wochenwechsel vor/zurück gibt es nicht, da die Toolbar
  // das bisher nicht unterstützt.
  const days = useMemo(
    () => (referenceDate ? buildWeekDays(referenceDate, weekDayLabels) : []),
    [referenceDate]
  );
  const rangeLabel = referenceDate ? formatRangeLabel(getWeekDates(referenceDate)) : "";
  const defaultDate = referenceDate ? formatDateDE(referenceDate) : undefined;
  const isPreparing = loading || referenceDate === null;

  function openNewTask() {
    setEditingEvent(null);
    setIsNewTaskOpen(true);
  }

  function openEdit(event: CalendarEvent) {
    setSelectedEvent(null);
    setEditingEvent(event);
    setIsNewTaskOpen(true);
  }

  function handleNewTaskOpenChange(open: boolean) {
    setIsNewTaskOpen(open);
    if (!open) setEditingEvent(null);
  }

  // Liefert true nur bei bestätigtem Service-Ergebnis; sonst bleibt der Dialog
  // offen und zeigt selbst einen Hinweis.
  async function handleSaveEvent(input: NewCalendarEventInput): Promise<boolean> {
    try {
      if (editingEvent) {
        const updated = await updateEvent(editingEvent.id, input);
        if (!updated) return false;
        showFeedback("Termin gespeichert.");
        return true;
      }
      await createEvent(input);
      showFeedback("Termin angelegt.");
      return true;
    } catch {
      return false;
    }
  }

  async function handleMove(event: CalendarEvent, date: string, time: string): Promise<boolean> {
    try {
      const updated = await updateEvent(event.id, { date, time });
      if (!updated) return false;
      showFeedback("Termin verschoben.");
      return true;
    } catch {
      return false;
    }
  }

  async function handleDuplicate(event: CalendarEvent) {
    try {
      const copy = await duplicateEvent(event);
      showFeedback(`Termin „${copy.title}“ dupliziert.`);
    } catch {
      showFeedback("Termin konnte nicht dupliziert werden.");
    }
  }

  async function handleDelete(event: CalendarEvent): Promise<boolean> {
    try {
      const removed = await removeEvent(event.id);
      showFeedback(removed ? "Kalendereintrag gelöscht." : "Kalendereintrag konnte nicht gelöscht werden.");
      return removed;
    } catch {
      showFeedback("Kalendereintrag konnte nicht gelöscht werden.");
      return false;
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Smart-Kalender
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plane Prüfungen, Proben und Laboraufgaben an einem Ort.
        </p>
      </div>

      <CalendarToolbar
        rangeLabel={rangeLabel}
        activeView={view}
        onViewChange={setView}
        onToday={() => setView("woche")}
        onNewTask={openNewTask}
      />

      <CalendarLegend />

      {isPreparing ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card className="h-96 animate-pulse bg-muted/40" />
          <Card className="h-96 animate-pulse bg-muted/40" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={refreshCalendarEvents}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0">
            {view === "woche" && (
              <CalendarView days={days} events={calendarEvents} onEventClick={setSelectedEvent} />
            )}

            {view === "agenda" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agenda – gesamte Woche</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {days.map((day) => (
                    <div key={day.date} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            day.isToday ? "text-sm font-semibold text-primary" : "text-sm font-semibold text-foreground"
                          }
                        >
                          {day.label}, {day.dayNumber}. {day.monthName}
                        </span>
                        {day.isToday && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                            Heute
                          </span>
                        )}
                      </div>
                      <AgendaList
                        events={eventsForDate(day.date)}
                        emptyMessage="Keine Termine."
                        onEventClick={setSelectedEvent}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {view === "monat" && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                  <Info className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Monatsansicht ist in Vorbereitung</p>
                  <p className="text-sm text-muted-foreground">
                    Nutze für diesen Sprint die Wochen- oder Agenda-Ansicht.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agenda heute</CardTitle>
              </CardHeader>
              <CardContent>
                <AgendaList
                  events={todaysEvents}
                  emptyMessage="Heute sind keine Termine geplant."
                  onEventClick={setSelectedEvent}
                />
              </CardContent>
            </Card>

            <AutoSchedulePreview />
          </div>
        </div>
      )}

      <NewCalendarTaskDialog
        open={isNewTaskOpen}
        onOpenChange={handleNewTaskOpenChange}
        editingEvent={editingEvent}
        defaultDate={defaultDate}
        onSubmit={handleSaveEvent}
      />

      <CalendarMoveDialog
        event={movingEvent}
        onOpenChange={(open) => !open && setMovingEvent(null)}
        onConfirm={(date, time) => (movingEvent ? handleMove(movingEvent, date, time) : Promise.resolve(false))}
      />

      <CalendarEventDrawer
        event={selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
        onOpenSample={() => router.push("/probekoerper")}
        onEnterValues={(event) => {
          if (event.sampleId) router.push(`/pruefungen?sampleId=${encodeURIComponent(event.sampleId)}`);
        }}
        onEdit={openEdit}
        onMove={(event) => {
          setSelectedEvent(null);
          setMovingEvent(event);
        }}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
