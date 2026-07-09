"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

import { AgendaList } from "@/components/shared/AgendaList";
import { AutoSchedulePreview } from "@/components/shared/AutoSchedulePreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarEventDrawer } from "@/components/shared/CalendarEventDrawer";
import { CalendarLegend } from "@/components/shared/CalendarLegend";
import { CalendarToolbar, type CalendarViewMode } from "@/components/shared/CalendarToolbar";
import { CalendarView } from "@/components/shared/CalendarView";
import { NewCalendarTaskDialog } from "@/components/shared/NewCalendarTaskDialog";
import { HEUTE, calendarEvents, weekDates, weekDayLabels } from "@/config/calendarEvents";
import type { CalendarEvent } from "@/types/calendarEvent";

const days = weekDates.map((date, index) => ({
  date,
  label: weekDayLabels[index],
  dayNumber: String(Number(date.split(".")[0])),
  isToday: date === HEUTE,
}));

const rangeLabel = `${days[0].dayNumber}. – ${days[6].dayNumber}. März 2026`;

export default function KalenderPage() {
  const router = useRouter();
  const [view, setView] = useState<CalendarViewMode>("woche");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const todaysEvents = useMemo(
    () => calendarEvents.filter((event) => event.date === HEUTE).sort((a, b) => a.time.localeCompare(b.time)),
    []
  );

  function handleToday() {
    setView("woche");
  }

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2500);
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
        onToday={handleToday}
        onNewTask={() => setIsNewTaskOpen(true)}
      />

      <CalendarLegend />

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
                        {day.label}, {day.dayNumber}. März
                      </span>
                      {day.isToday && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          Heute
                        </span>
                      )}
                    </div>
                    <AgendaList
                      events={calendarEvents.filter((event) => event.date === day.date)}
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

      <NewCalendarTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} />

      <CalendarEventDrawer
        event={selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
        onOpenSample={() => router.push("/probekoerper")}
        onEnterValues={() => router.push("/pruefungen")}
        onEdit={() => showFeedback("Diese Funktion wird später angebunden.")}
        onMove={() => showFeedback("Diese Funktion wird später angebunden.")}
        onDuplicate={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      {feedback && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg">
          {feedback}
        </div>
      )}
    </div>
  );
}
