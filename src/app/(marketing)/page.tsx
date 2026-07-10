import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Box,
  Building2,
  CalendarDays,
  CircleCheckBig,
  Cloud,
  FlaskConical,
  GraduationCap,
  Layers,
  Mountain,
  BookOpen,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CtaSection } from "@/components/shared/CtaSection";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { DisciplineCard } from "@/components/shared/DisciplineCard";
import { PricingCard } from "@/components/shared/PricingCard";
import { pricingPlans } from "@/config/pricing";

const features = [
  {
    icon: BookOpen,
    title: "Lernkarten & Quiz",
    description:
      "Prüfungsvorbereitung mit Karteikasten-System, Quiz und Formelsammlung für Azubis.",
  },
  {
    icon: FlaskConical,
    title: "Prüfungsmodus",
    description: "IHK-Prüfungssimulation mit Timer, Auswertung und Fehleranalyse.",
  },
  {
    icon: Building2,
    title: "Beton",
    description:
      "Druckfestigkeit, Ausbreitmaß, Luftgehalt und Wasserzementwert nach DIN EN 12390.",
  },
  {
    icon: Layers,
    title: "Asphalt",
    description: "Marshall-Verfahren, Bohrkerne, Sieblinie und Verdichtung im Blick behalten.",
  },
  {
    icon: Mountain,
    title: "Geotechnik",
    description: "Proctorversuch, Atterberg-Grenzen und Bodenklassen digital dokumentieren.",
  },
  {
    icon: CalendarDays,
    title: "Probekörper & Kalender",
    description: "Würfelmanager, Probekörperverwaltung und Termine mit Erinnerungen.",
  },
];

const heroFeatures = [
  { icon: GraduationCap, label: "Für Azubis & Profis" },
  { icon: ShieldCheck, label: "DSGVO-konform" },
  { icon: Cloud, label: "Cloud-basiert" },
  { icon: Smartphone, label: "Überall verfügbar" },
];

const disciplines = [
  {
    image: "/images/betonpruefung-hero.png",
    icon: Box,
    iconClassName: "bg-primary",
    title: "Betonprüfung",
    description:
      "Proben verwalten, Druckfestigkeit prüfen, Ergebnisse dokumentieren und Berichte automatisch erstellen.",
    items: ["Druckfestigkeit", "Würfel & Zylinder", "Frischbeton", "Expositionsklassen"],
    href: "/beton",
  },
  {
    image: "/images/asphaltpruefung-hero.png",
    icon: Route,
    iconClassName: "bg-foreground",
    title: "Asphaltprüfung",
    description:
      "Marshall, Hohlraumgehalt, Bindemittel & Siebung – alle Prüfungen digital an einem Ort organisieren.",
    items: ["Marshall-Prüfung", "Hohlraumgehalt", "Siebung", "Bindemittelgehalt"],
    href: "/asphalt",
  },
  {
    image: "/images/geotechnik-hero.png",
    icon: Layers,
    iconClassName: "bg-success",
    title: "Geotechnik",
    description:
      "Bodenarten bestimmen, Proctor-Versuch durchführen und geotechnische Kennwerte sicher dokumentieren.",
    items: ["Kornverteilung", "Proctor-Versuch", "Atterberg-Grenzen", "Bodenklassifikation"],
    href: "/geotechnik",
  },
];

const aiCapabilities = [
  "Prüfverfahren erklären",
  "DIN-Normen erklären",
  "Berechnungen durchführen",
  "Lernkarten erstellen",
  "PDF-Berichte analysieren",
  "Fehler in Ergebnissen finden",
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
          <Image
            src="/images/betonpruefung-hero.png"
            alt="Betonprüfung im digitalen Labor mit PrüfCheckPro"
            fill
            sizes="60vw"
            preload
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/50 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="flex max-w-2xl flex-col items-start gap-6 text-left lg:max-w-xl">
            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
              Die All-in-One Plattform
            </span>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Digitales Labor.
              <br />
              Echte <span className="text-primary">Ergebnisse.</span>
            </h1>

            <p className="max-w-xl text-lg text-slate-300 sm:text-xl">
              PrüfCheckPro unterstützt Baustoffprüfer, Labore und Unternehmen bei der
              Verwaltung, Prüfung und Analyse von Proben – effizient, sicher und digital.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">Kostenlos starten</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <a href="#ai">Live Demo ansehen</a>
              </Button>
            </div>

            <div className="mt-2 w-full overflow-hidden rounded-3xl lg:hidden">
              <div className="relative h-56 w-full sm:h-72">
                <Image
                  src="/images/betonpruefung-hero.png"
                  alt="Betonprüfung im digitalen Labor mit PrüfCheckPro"
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
              {heroFeatures.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-300">
                  <Icon className="size-4 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fachbereiche */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Ein System. Drei Fachbereiche."
            title={
              <>
                Für alle Bereiche der{" "}
                <span className="text-primary">Baustoffprüfung</span>
              </>
            }
            description="Ob Beton, Asphalt oder Geotechnik – PrüfCheckPro digitalisiert deine Arbeitsabläufe und schafft mehr Zeit für das, was wirklich zählt."
          />

          <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:items-stretch">
            {disciplines.map((discipline) => (
              <DisciplineCard key={discipline.title} {...discipline} />
            ))}
          </div>
        </div>
      </section>

      {/* Funktionskarten */}
      <section id="funktionen" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Funktionen"
            title="Alles, was Baustoffprüfung braucht"
            description="Von Lernkarten über Prüfverfahren bis zur Probekörperverwaltung – PrüfCheckPro bündelt die komplette Baustoffprüfung in einer Plattform."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/funktionen">
                Alle Funktionen ansehen
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PrüfCheck AI */}
      <section id="ai" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Badge variant="secondary" className="w-fit gap-1.5">
                <Sparkles className="size-3" />
                PrüfCheck AI
              </Badge>

              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Dein intelligenter Assistent für die Baustoffprüfung
              </h2>

              <p className="text-lg text-muted-foreground">
                PrüfCheck AI unterstützt bei Prüfverfahren, DIN-Normen, Berechnungen und
                Lernkarten – KI, die Fachwissen ergänzt statt ersetzt.
              </p>

              <ul className="grid gap-3 sm:grid-cols-2">
                {aiCapabilities.map((capability) => (
                  <li
                    key={capability}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <CircleCheckBig className="size-4 shrink-0 text-success" />
                    {capability}
                  </li>
                ))}
              </ul>

              <Button size="lg" className="w-fit" asChild>
                <a href="#preise">
                  PrüfCheck AI entdecken
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">PrüfCheck AI</CardTitle>
                    <CardDescription>Immer einsatzbereit</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
                  Welche Prüfverfahren gelten für Frischbeton nach DIN EN 12350?
                </div>
                <div className="ml-auto max-w-[85%] rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground">
                  Für Frischbeton prüfst du u. a. Ausbreitmaß, Luftgehalt und Rohdichte nach
                  DIN EN 12350 – ich zeige dir die passenden Grenzwerte.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Preisübersicht */}
      <section id="preise" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Preise"
            title="Für jede Phase der richtige Plan"
            description="Vom kostenlosen Einstieg für Azubis bis zur Enterprise-Lösung für Unternehmen mit mehreren Standorten."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="Bereit, Baustoffprüfung digital zu machen?"
        description="Starte kostenlos mit PrüfCheckPro und erlebe, wie einfach Lernen, Prüfen und Dokumentieren sein kann."
        primaryLabel="Kostenlos starten"
        primaryHref="/login"
        secondaryLabel="Demo anfragen"
        secondaryHref="/kontakt"
      />
    </>
  );
}
