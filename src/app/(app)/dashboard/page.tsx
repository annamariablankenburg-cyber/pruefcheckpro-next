import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Clock,
  FlaskConical,
  Layers,
  Mountain,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { FadeIn } from "@/components/shared/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const upcomingExams = [
  { title: "Beton – Druckfestigkeit", due: "Fällig in 2 Tagen" },
  { title: "Asphalt – Marshall-Verfahren", due: "Fällig in 5 Tagen" },
  { title: "Geotechnik – Proctorversuch", due: "Fällig in 9 Tagen" },
];

const reminders = [
  { title: "Probekörper Charge #24 prüfen", time: "Morgen, 09:00 Uhr" },
  { title: "Wiederholung Sieblinie", time: "Freitag, 14:00 Uhr" },
  { title: "IHK-Prüfungssimulation starten", time: "Sonntag" },
];

const quickLinks = [
  { label: "Lernkarten", href: "/lernen", icon: BookOpen },
  { label: "Quiz", href: "/quiz", icon: Target },
  { label: "Beton", href: "/beton", icon: Building2 },
  { label: "Asphalt", href: "/asphalt", icon: Layers },
  { label: "Geotechnik", href: "/geotechnik", icon: Mountain },
  { label: "Kalender", href: "/kalender", icon: CalendarDays },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Willkommen zurück
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{today}</p>
        </div>
      </FadeIn>

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn delay={0.05} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Lernfortschritt</CardTitle>
                <TrendingUp className="size-4 text-success" />
              </div>
              <CardDescription>124 von 200 Lernkarten gelernt</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Progress value={62} />
              <p className="text-sm font-medium text-foreground">62 % abgeschlossen</p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Offene Prüfungen</CardTitle>
                <Badge variant="secondary">{upcomingExams.length}</Badge>
              </div>
              <CardDescription>Deine nächsten Prüfungstermine</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {upcomingExams.map((exam) => (
                <div key={exam.title} className="flex items-start gap-2 text-sm">
                  <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">{exam.due}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Erinnerungen</CardTitle>
                <Bell className="size-4 text-warning" />
              </div>
              <CardDescription>Anstehende Termine und Aufgaben</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {reminders.map((reminder) => (
                <div key={reminder.title} className="flex items-start gap-2 text-sm">
                  <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{reminder.title}</p>
                    <p className="text-xs text-muted-foreground">{reminder.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn delay={0.2} className="lg:col-span-2">
          <Card className="h-full bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">PrüfCheck AI</CardTitle>
                  <CardDescription>
                    Dein Assistent für Prüfverfahren und Normen
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                Frag PrüfCheck AI zu DIN-Normen, Berechnungen oder Prüfverfahren …
              </div>
              <Button className="w-fit" asChild>
                <Link href="/ai">
                  PrüfCheck AI öffnen
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.25} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Schnellzugriffe</CardTitle>
              <CardDescription>Direkt zu deinen Bereichen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border px-2 py-3 text-center text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    <link.icon className="size-5" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
