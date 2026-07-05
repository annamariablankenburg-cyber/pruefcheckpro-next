import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CircleCheckBig,
  FlaskConical,
  Layers,
  Mountain,
  BookOpen,
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
      <section className="relative overflow-hidden">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3" />
            Neu: PrüfCheck AI
          </Badge>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Baustoffprüfung digital.
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Lernen, Prüfverfahren, Probekörperverwaltung und KI-Unterstützung – alles in
            einer modernen Plattform für Azubis, Baustofflabore und Bauunternehmen.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/login">
                Kostenlos starten
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#funktionen">Funktionen entdecken</a>
            </Button>
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
