"use client";

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
import { aiChats } from "@/config/ai";
import { calendarEvents, HEUTE, weekDates, weekDayLabels } from "@/config/calendarEvents";
import { projects } from "@/config/projects";
import { samples } from "@/config/samples";
import { useAuth } from "@/providers/AuthProvider";

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

function overdueLabel(ddmmyyyy: string): string {
  const days = Math.round(
    (parseGermanDate(HEUTE).getTime() - parseGermanDate(ddmmyyyy).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "Heute fällig";
  return days === 1 ? "1 Tag überfällig" : `${days} Tage überfällig`;
}

// Aktive Proben = alle nicht-archivierten Proben, die noch nicht final
// abgeschlossen sind – dient als Kennzahl für die aktuelle Laborauslastung.
const activeSamples = samples.filter(
  (sample) => sample.status !== "Abgeschlossen" && sample.status !== "Archiviert"
);

const overdueEvents = calendarEvents.filter((event) => event.status === "überfällig");

const todayTestEvents = calendarEvents.filter(
  (event) => event.sampleId && event.date === HEUTE && event.status !== "abgeschlossen"
);

const todayTasks: TaskListItem[] = todayTestEvents.map((event) => ({
  id: event.sampleId ?? event.id,
  title: event.title,
  tag: `${event.field}${event.projekt ? ` · ${event.projekt}` : ""}`,
  meta: `${event.time} Uhr`,
}));

const overdueTasks: TaskListItem[] = overdueEvents.map((event) => ({
  id: event.sampleId ?? event.id,
  title: event.title,
  tag: `${event.field}${event.projekt ? ` · ${event.projekt}` : ""}`,
  meta: overdueLabel(event.date),
}));

// Die vier zuletzt entnommenen, noch nicht archivierten Proben – reale
// Datensätze aus config/samples.ts statt eigenständiger Mock-Liste.
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

// Wochenvorschau (Mo–Fr) direkt aus den echten Kalendereinträgen abgeleitet
// (config/calendarEvents.ts), die ihrerseits aus den Proben generiert werden.
const calendarDays: CalendarPreviewDay[] = weekDates.slice(0, 5).map((date) => ({
  heading: formatDayHeading(date),
  isToday: date === HEUTE,
  events: calendarEvents
    .filter((event) => event.date === date)
    .map((event) => ({
      title: event.title,
      time: event.time,
      tone: event.status === "überfällig" ? "warning" : event.status === "abgeschlossen" ? "success" : "primary",
      priority: event.priority ?? "normal",
    })),
}));

const weekCounts = weekDates.map((date) => calendarEvents.filter((event) => event.date === date).length);
const maxWeekCount = Math.max(1, ...weekCounts);
const weekHeightSteps = ["h-1", "h-2", "h-4", "h-6", "h-8", "h-10", "h-12"];

const weekOverview: WeekOverviewDay[] = weekDates.map((date, index) => {
  const count = weekCounts[index];
  const step = Math.round((count / maxWeekCount) * (weekHeightSteps.length - 1));
  return {
    label: weekDayLabels[index],
    count,
    heightClass: weekHeightSteps[step],
    isToday: date === HEUTE,
  };
});

const completedThisWeek = calendarEvents.filter(
  (event) => event.status === "abgeschlossen" && weekDates.includes(event.date)
).length;

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

// Prüfungen, die diese Woche laut Kalender (config/calendarEvents.ts) an
// einer echten Probe anstehen.
const scheduledThisWeek = calendarEvents.filter(
  (event) => event.sampleId && weekDates.includes(event.date)
).length;

const activeProjectsCount = projects.filter((project) => project.status === "Aktiv").length;

export default function DashboardPage() {
  const { appUser } = useAuth();

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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Willkommen zurück, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Hier ist dein Überblick für {today}.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatCard
            icon={AlertTriangle}
            label="Überfällige Aufgaben"
            value={overdueTasks.length}
            meta="Jetzt erledigen"
            tone="danger"
            actionHref="#ueberfaellig"
          />
          <DashboardStatCard
            icon={FlaskConical}
            label="Geplante Prüfungen"
            value={scheduledThisWeek}
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
          />
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.1}>
          <TaskListCard
            icon={FlaskConical}
            title="Heutige Prüfungen"
            description="Deine Termine für heute"
            tasks={todayTasks}
            footerLabel="Alle Prüfungen ansehen"
            footerHref="/pruefungen"
          />
        </FadeIn>

        <FadeIn delay={0.15}>
          <div id="ueberfaellig">
            <TaskListCard
              icon={AlertTriangle}
              title="Überfällige Prüfungen"
              description="Benötigen sofortige Aufmerksamkeit"
              tasks={overdueTasks}
              tone="danger"
              footerLabel="Rückstand bearbeiten"
              footerHref="/pruefungen"
            />
          </div>
        </FadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <FadeIn delay={0.2} className="lg:col-span-3">
          <SampleStatusCard samples={currentSamples} footerHref="/probekoerper" />
        </FadeIn>

        <FadeIn delay={0.25} className="lg:col-span-2">
          <CalendarPreviewCard days={calendarDays} footerHref="/kalender" />
        </FadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn delay={0.3} className="lg:col-span-2">
          <AiAssistantCard
            userName={firstName}
            categories={aiCategories}
            recentConversations={aiRecentConversations}
            ctaHref="/ai"
          />
        </FadeIn>

        <FadeIn delay={0.35}>
          <LabStatusCard
            capacity={labCapacity}
            activeSamples={activeSamples.length}
            completedThisWeek={completedThisWeek}
            trend={`${completedThisWeek} Prüfungen diese Woche`}
            week={weekOverview}
          />
        </FadeIn>
      </div>

      <FadeIn delay={0.4}>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Schnellaktionen</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {quickActions.map((action) => (
              <QuickActionCard key={action.label} {...action} />
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
