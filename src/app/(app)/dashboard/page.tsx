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
import { useAuth } from "@/providers/AuthProvider";

const todayTasks: TaskListItem[] = [
  { id: "BET-2026-014", title: "28-Tage-Prüfung BET-2026-014", tag: "Betondruckfestigkeit · Labor 1", meta: "10:00 Uhr" },
  { id: "PR-2026-008", title: "7-Tage-Prüfung PR-2026-008", tag: "Betondruckfestigkeit · Labor 1", meta: "13:30 Uhr" },
  { id: "ASP-2026-011", title: "Asphaltbohrkern ASP-2026-011", tag: "Marshall-Prüfung · Labor 2", meta: "15:00 Uhr" },
];

const overdueTasks: TaskListItem[] = [
  { id: "GEO-2026-021", title: "Proctor-Versuch GEO-2026-021", tag: "Geotechnik · Baustelle Nord", meta: "2 Tage überfällig" },
  { id: "ASP-2026-007", title: "Sieblinie ASP-2026-007", tag: "Asphalt · Labor 2", meta: "1 Tag überfällig" },
];

const currentSamples: SampleListItem[] = [
  { id: "BET-2026-014", material: "Beton C25/30", date: "03.03.2026", status: "In Prüfung" },
  { id: "PR-2026-008", material: "Beton C30/37", date: "01.03.2026", status: "Vorbereitung" },
  { id: "ASP-2026-011", material: "Asphalt AC 11 DS", date: "28.02.2026", status: "Abgeschlossen" },
  { id: "GEO-2026-021", material: "Bodenprobe (Sand)", date: "27.02.2026", status: "In Prüfung" },
];

const calendarDays: CalendarPreviewDay[] = [
  {
    heading: "Montag, 2. März",
    events: [
      { title: "Proctor-Versuch GEO-2026-021", time: "13:00", tone: "success", priority: "normal" },
    ],
  },
  {
    heading: "Dienstag, 3. März",
    isToday: true,
    events: [
      { title: "28-Tage-Prüfung BET-2026-014", time: "09:00", tone: "primary", priority: "hoch" },
      { title: "7-Tage-Prüfung PR-2026-008", time: "10:30", tone: "primary", priority: "normal" },
      { title: "Asphaltbohrkern ASP-2026-011", time: "15:00", tone: "warning", priority: "niedrig" },
    ],
  },
  { heading: "Mittwoch, 4. März", events: [] },
  {
    heading: "Donnerstag, 5. März",
    events: [{ title: "Laborbericht prüfen", tone: "primary", priority: "niedrig" }],
  },
  {
    heading: "Freitag, 6. März",
    events: [
      { title: "Sieblinie ASP-2026-007", time: "11:00", tone: "warning", priority: "normal" },
    ],
  },
];

const weekOverview: WeekOverviewDay[] = [
  { label: "Mo", count: 4, heightClass: "h-8" },
  { label: "Di", count: 6, heightClass: "h-12", isToday: true },
  { label: "Mi", count: 3, heightClass: "h-6" },
  { label: "Do", count: 5, heightClass: "h-10" },
  { label: "Fr", count: 2, heightClass: "h-4" },
  { label: "Sa", count: 1, heightClass: "h-2" },
  { label: "So", count: 0, heightClass: "h-1" },
];

const aiCategories: AiAssistantCategory[] = [
  { label: "Beton", action: "Berechnung", icon: Building2, href: "/ai" },
  { label: "Berechnung", action: "Formelmodus", icon: Calculator, href: "/ai" },
  { label: "Normen", action: "Suche", icon: BookOpen, href: "/ai" },
];

const aiRecentConversations: AiRecentConversation[] = [
  { title: "Warum wurde C30/37 nicht erreicht?", href: "/ai" },
  { title: "DIN EN 12390 erklären", href: "/ai" },
  { title: "Proctor berechnen", href: "/ai" },
];

const quickActions = [
  { icon: Package, label: "Neue Probe", href: "/probekoerper" },
  { icon: FlaskConical, label: "Prüfung starten", href: "/pruefungen" },
  { icon: CalendarClock, label: "Kalender", href: "/kalender" },
  { icon: Sparkles, label: "PrüfCheck AI", href: "/ai" },
  { icon: ClipboardList, label: "Laborbuch", href: "/probekoerper" },
  { icon: CheckCircle2, label: "Statistiken", href: "/statistiken" },
];

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
            value={12}
            meta="diese Woche"
            tone="default"
          />
          <DashboardStatCard
            icon={Package}
            label="Offene Proben"
            value={28}
            meta="in Bearbeitung"
            tone="warning"
          />
          <DashboardStatCard
            icon={ClipboardList}
            label="Projekte"
            value={7}
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
            capacity={78}
            activeSamples={34}
            completedThisWeek={21}
            trend="+12 % ggü. Vorwoche"
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
