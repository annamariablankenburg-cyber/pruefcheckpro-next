"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Package,
  Sparkles,
} from "lucide-react";

import { FadeIn } from "@/components/shared/FadeIn";
import { DashboardStatCard } from "@/components/shared/DashboardStatCard";
import { TaskListCard, type TaskListItem } from "@/components/shared/TaskListCard";
import { SampleStatusCard, type SampleListItem } from "@/components/shared/SampleStatusCard";
import { CalendarPreviewCard, type CalendarPreviewDay } from "@/components/shared/CalendarPreviewCard";
import { AiAssistantCard, type AiAssistantCategory, type AiRecentConversation } from "@/components/shared/AiAssistantCard";
import { QuickActionCard } from "@/components/shared/QuickActionCard";
import { LabStatusCard, type WeekOverviewDay } from "@/components/shared/LabStatusCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aiChats } from "@/config/ai";
import { weekDayLabels } from "@/config/calendarEvents";
import { projects } from "@/config/projects";
import { samples } from "@/config/samples";
import { buildWeekDays, formatDateDE } from "@/lib/calendar/calendarDates";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCalendar } from "@/hooks/useCalendar";
import type { CalendarEvent } from "@/types/calendarEvent";

function parseGermanDate(ddmmyyyy: string): Date {
  const [day, month, year] = ddmmyyyy.split(".").map(Number);
  return new Date(year, month - 1, day);
}

function formatDayHeading(ddmmyyyy: string): string {
  return parseGermanDate(ddmmyyyy).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function overdueLabel(ddmmyyyy: string, todayDE: string): string {
  const days = Math.round(
    (parseGermanDate(todayDE).getTime() - parseGermanDate(ddmmyyyy).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "Heute fällig";
  return days === 1 ? "1 Tag überfällig" : `${days} Tage überfällig`;
}

// Aktive Proben = alle nicht-archivierten Proben, die noch nicht final
// abgeschlossen sind – dient als Kennzahl für die aktuelle Laborauslastung.
const activeSamples = samples.filter(
  (sample) => sample.status !== "Abgeschlossen" && sample.status !== "Archiviert"
);

const weekHeightSteps = ["h-1", "h-2", "h-4", "h-6", "h-8", "h-10", "h-12"];

interface CalendarDashboardData {
  todayTasks: TaskListItem[];
  overdueTasks: TaskListItem[];
  calendarDays: CalendarPreviewDay[];
  weekOverview: WeekOverviewDay[];
  completedThisWeek: number;
  scheduledThisWeek: number;
}

// Alle kalenderbezogenen Dashboard-Werte werden ausschließlich aus den Terminen
// von useCalendar() abgeleitet (im Firestore-Modus also nur echte Termine). Die
// Woche folgt dem Bezugsdatum (heute) und nicht einer festen Demo-Woche.
function buildCalendarDashboardData(events: CalendarEvent[], referenceDate: Date): CalendarDashboardData {
  const todayDE = formatDateDE(referenceDate);
  const week = buildWeekDays(referenceDate, weekDayLabels);
  const weekDateSet = new Set(week.map((day) => day.date));
  const countOn = (date: string) => events.filter((event) => event.date === date).length;

  const todayTasks: TaskListItem[] = events
    .filter((event) => event.sampleId && event.date === todayDE && event.status !== "abgeschlossen")
    .map((event) => ({
      id: event.sampleId ?? event.id,
      title: event.title,
      tag: `${event.field}${event.projekt ? ` · ${event.projekt}` : ""}`,
      meta: `${event.time} Uhr`,
    }));

  const overdueTasks: TaskListItem[] = events
    .filter((event) => event.status === "überfällig")
    .map((event) => ({
      id: event.sampleId ?? event.id,
      title: event.title,
      tag: `${event.field}${event.projekt ? ` · ${event.projekt}` : ""}`,
      meta: overdueLabel(event.date, todayDE),
    }));

  // Wochenvorschau (Mo–Fr) aus den Terminen der aktuellen Woche.
  const calendarDays: CalendarPreviewDay[] = week.slice(0, 5).map((day) => ({
    heading: formatDayHeading(day.date),
    isToday: day.isToday,
    events: events
      .filter((event) => event.date === day.date)
      .map((event) => ({
        title: event.title,
        time: event.time,
        tone: event.status === "überfällig" ? "warning" : event.status === "abgeschlossen" ? "success" : "primary",
        priority: event.priority ?? "normal",
      })),
  }));

  const weekCounts = week.map((day) => countOn(day.date));
  const maxWeekCount = Math.max(1, ...weekCounts);
  const weekOverview: WeekOverviewDay[] = week.map((day, index) => {
    const count = weekCounts[index];
    const step = Math.round((count / maxWeekCount) * (weekHeightSteps.length - 1));
    return {
      label: day.label,
      count,
      heightClass: weekHeightSteps[step],
      isToday: day.isToday,
    };
  });

  const completedThisWeek = events.filter(
    (event) => event.status === "abgeschlossen" && weekDateSet.has(event.date)
  ).length;

  // Prüfungen, die diese Woche laut Kalender an einer echten Probe anstehen.
  const scheduledThisWeek = events.filter((event) => event.sampleId && weekDateSet.has(event.date)).length;

  return { todayTasks, overdueTasks, calendarDays, weekOverview, completedThisWeek, scheduledThisWeek };
}

// Platzhalter für kalenderabhängige Karten, solange Termine laden oder nicht
// verfügbar sind. Zeigt bewusst keine leeren Listen oder Nullen.
function CalendarPlaceholder({
  state,
  heightClass,
  onRetry,
}: {
  state: "loading" | "error";
  heightClass: string;
  onRetry: () => void;
}) {
  if (state === "loading") {
    return <Card className={cn("skeleton skeleton-rows", heightClass)} />;
  }
  return (
    <Card className={heightClass}>
      <CardContent className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="size-6 text-destructive" />
        <p className="text-sm text-muted-foreground">Kalenderdaten konnten nicht geladen werden.</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Erneut versuchen
        </Button>
      </CardContent>
    </Card>
  );
}

// Aktive Proben: die vier zuletzt entnommenen, noch nicht archivierten Proben –
// reale Datensätze aus config/samples.ts statt eigenständiger Mock-Liste.
const currentSamples: SampleListItem[] = [...samples]
  .filter((sample) => sample.status !== "Archiviert")
  .sort((a, b) => parseGermanDate(b.entnahmedatum).getTime() - parseGermanDate(a.entnahmedatum).getTime())
  .slice(0, 4)
  .map((sample) => ({
    id: sample.id,
    material: sample.bezeichnung,
    date: sample.entnahmedatum,
    status: sample.status as SampleListItem["status"],
  }));

// Auslastung als Anteil der aktiven (nicht abgeschlossenen/archivierten)
// Proben an allen erfassten Proben – ein echter, aus den Mockdaten
// abgeleiteter Kennwert statt einer frei erfundenen Prozentzahl.
const labCapacity = Math.round((activeSamples.length / samples.length) * 100);

const aiCategories: AiAssistantCategory[] = [
  { label: "Beton", action: "Berechnung", icon: Building2, href: "/ai" },
  { label: "Berechnung", action: "Formelmodus", icon: Calculator, href: "/ai" },
  { label: "Normen", action: "Suche", icon: BookOpen, href: "/ai" },
];

// Zeigt echte, zuletzt geführte Chats aus config/ai.ts statt einer
// eigenständigen Beispiel-Liste.
const aiRecentConversations: AiRecentConversation[] = aiChats
  .slice(0, 3)
  .map((chat) => ({ title: chat.title, href: "/ai" }));

const quickActions = [
  { icon: Package, label: "Neue Probe", href: "/probekoerper" },
  { icon: FlaskConical, label: "Prüfung starten", href: "/pruefungen" },
  { icon: CalendarClock, label: "Kalender", href: "/kalender" },
  { icon: Sparkles, label: "PrüfCheck AI", href: "/ai" },
  { icon: ClipboardList, label: "Laborbuch", href: "/laborbuch" },
  { icon: CheckCircle2, label: "Statistiken", href: "/statistiken" },
];

const activeProjectsCount = projects.filter((project) => project.status === "Aktiv").length;

export default function DashboardPage() {
  const { appUser } = useAuth();
  const { events, referenceDate, loading, error, refreshCalendarEvents } = useCalendar();

  // Kalenderwerte erst, wenn Termine und Bezugsdatum vorliegen. Solange (oder bei
  // Fehler) bleibt calendar null und die Karten zeigen Platzhalter.
  const calendar = useMemo(
    () => (!error && !loading && referenceDate ? buildCalendarDashboardData(events, referenceDate) : null),
    [events, referenceDate, loading, error]
  );
  const placeholderState: "loading" | "error" = error ? "error" : "loading";

  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const firstName = appUser?.firstName ?? "Laborleiter";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <FadeIn>
        <div className="flex flex-col gap-1">
          <h1 className="page-title">
            Willkommen zurück, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Hier ist dein Überblick für {today}.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
          <DashboardStatCard
            icon={AlertTriangle}
            label="Überfällige Aufgaben"
            value={calendar ? calendar.overdueTasks.length : "—"}
            meta="Jetzt erledigen"
            tone="danger"
            actionHref="#ueberfaellig"
            featured
            className="col-span-2 lg:col-span-1"
          />
          <DashboardStatCard
            icon={FlaskConical}
            label="Geplante Prüfungen"
            value={calendar ? calendar.scheduledThisWeek : "—"}
            meta="diese Woche"
            tone="default"
          />
          <DashboardStatCard
            icon={Package}
            label="Offene Proben"
            value={activeSamples.length}
            meta="in Bearbeitung"
            tone="warning"
          />
          <DashboardStatCard
            icon={ClipboardList}
            label="Projekte"
            value={activeProjectsCount}
            meta="aktiv"
            tone="success"
            className="col-span-2 lg:col-span-1"
          />
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.1}>
          {calendar ? (
            <TaskListCard
              icon={FlaskConical}
              title="Heutige Prüfungen"
              description="Deine Termine für heute"
              tasks={calendar.todayTasks}
              footerLabel="Alle Prüfungen ansehen"
              footerHref="/pruefungen"
            />
          ) : (
            <CalendarPlaceholder state={placeholderState} heightClass="h-64" onRetry={refreshCalendarEvents} />
          )}
        </FadeIn>

        <FadeIn delay={0.15}>
          <div id="ueberfaellig">
            {calendar ? (
              <TaskListCard
                icon={AlertTriangle}
                title="Überfällige Prüfungen"
                description="Benötigen sofortige Aufmerksamkeit"
                tasks={calendar.overdueTasks}
                tone="danger"
                footerLabel="Rückstand bearbeiten"
                footerHref="/pruefungen"
              />
            ) : (
              <CalendarPlaceholder state={placeholderState} heightClass="h-64" onRetry={refreshCalendarEvents} />
            )}
          </div>
        </FadeIn>
      </div>

      {/* Kalender und Wochenübersicht stehen nebeneinander: Termine links, die
          Wochenlast (Balken) direkt daneben. */}
      <div className="grid gap-6 lg:grid-cols-5">
        <FadeIn delay={0.2} className="lg:col-span-3">
          {calendar ? (
            <CalendarPreviewCard days={calendar.calendarDays} footerHref="/kalender" />
          ) : (
            <CalendarPlaceholder state={placeholderState} heightClass="h-96" onRetry={refreshCalendarEvents} />
          )}
        </FadeIn>

        <FadeIn delay={0.25} className="lg:col-span-2">
          {calendar ? (
            <LabStatusCard
              capacity={labCapacity}
              activeSamples={activeSamples.length}
              completedThisWeek={calendar.completedThisWeek}
              trend={`${calendar.completedThisWeek} Prüfungen diese Woche`}
              week={calendar.weekOverview}
            />
          ) : (
            <CalendarPlaceholder state={placeholderState} heightClass="h-96" onRetry={refreshCalendarEvents} />
          )}
        </FadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <FadeIn delay={0.3} className="lg:col-span-3">
          <SampleStatusCard samples={currentSamples} footerHref="/probekoerper" />
        </FadeIn>

        <FadeIn delay={0.35} className="lg:col-span-2">
          <AiAssistantCard
            userName={firstName}
            categories={aiCategories}
            recentConversations={aiRecentConversations}
            ctaHref="/ai"
          />
        </FadeIn>
      </div>

      <FadeIn delay={0.4}>
        <div className="flex flex-col gap-4">
          <h2 className="section-title">Schnellaktionen</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((action) => (
              <QuickActionCard key={action.label} {...action} />
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
