import {
  BookOpen,
  Building2,
  CalendarDays,
  FlaskConical,
  Layers,
  Mountain,
  Package,
  Sparkles,
  Users,
} from "lucide-react";

import { FeatureListCard } from "@/components/shared/FeatureListCard";
import { CtaSection } from "@/components/shared/CtaSection";

const featureGroups = [
  {
    icon: BookOpen,
    title: "Lernen",
    items: [
      "Lernkarten",
      "Karteikasten-System",
      "Quiz",
      "Formelsammlung",
      "Glossar",
      "Lernfortschritt",
    ],
  },
  {
    icon: FlaskConical,
    title: "Prüfungen",
    items: [
      "IHK-Prüfungssimulation",
      "Timer",
      "Punkte & Auswertung",
      "Lösungen anzeigen",
      "Fehleranalyse",
      "Prüfungsverlauf",
    ],
  },
  {
    icon: Building2,
    title: "Beton",
    items: [
      "Druckfestigkeit",
      "Frischbeton & Festbeton",
      "Ausbreitmaß",
      "Luftgehalt",
      "Rohdichte",
      "Wasserzementwert",
      "DIN EN 12390",
    ],
  },
  {
    icon: Layers,
    title: "Asphalt",
    items: [
      "Marshall-Verfahren",
      "Bitumen",
      "Bohrkerne",
      "Texturtiefe",
      "Verdichtung",
      "Sieblinie",
    ],
  },
  {
    icon: Mountain,
    title: "Geotechnik",
    items: [
      "Proctorversuch",
      "Atterberg-Grenzen",
      "Wassergehalt",
      "Siebanalyse",
      "Dichte",
      "Bodenklassen",
    ],
  },
  {
    icon: Package,
    title: "Probekörper",
    items: ["Würfel", "Zylinder", "Prismen", "Bohrkerne", "Bodenproben", "Etiketten", "Historie"],
  },
  {
    icon: Sparkles,
    title: "PrüfCheck AI",
    items: [
      "Fragen beantworten",
      "DIN-Normen erklären",
      "Berechnungen durchführen",
      "PDF-Berichte analysieren",
      "Bilder analysieren",
      "Lernkarten erstellen",
    ],
  },
  {
    icon: CalendarDays,
    title: "Kalender & Dokumente",
    items: [
      "Termine & Erinnerungen",
      "Browser-Benachrichtigungen",
      "PDF-Export",
      "Excel-Export",
      "Prüfberichte",
    ],
  },
  {
    icon: Users,
    title: "Unternehmen & Administration",
    items: [
      "Mitarbeiter & Rollen",
      "Standorte & Werke",
      "Benutzerverwaltung",
      "Statistiken",
      "Support",
    ],
  },
];

export default function FunktionenPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Funktionen
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Lernen, Prüfverfahren, Fachbereiche, Probekörperverwaltung und PrüfCheck AI – alle
            Funktionen von PrüfCheckPro im Überblick.
          </p>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureGroups.map((group) => (
              <FeatureListCard key={group.title} {...group} />
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="Bereit, PrüfCheckPro auszuprobieren?"
        description="Starte kostenlos und entdecke, wie einfach Baustoffprüfung sein kann."
        primaryLabel="Kostenlos starten"
        primaryHref="/login"
        secondaryLabel="Preise ansehen"
        secondaryHref="/preise"
      />
    </>
  );
}
