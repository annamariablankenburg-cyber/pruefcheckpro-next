export interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  href: string;
  highlighted?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Azubi",
    price: "0 €",
    description: "Für den Einstieg in die Prüfungsvorbereitung.",
    features: ["Lernkarten", "Quiz", "Rechner", "Normenübersicht", "PDF-Lernmaterial"],
    ctaLabel: "Kostenlos starten",
    href: "/login",
  },
  {
    name: "Professional",
    price: "49 €",
    period: "/ Monat",
    description: "Für Baustofflabore und Prüfteams.",
    features: [
      "Alles aus Azubi",
      "Prüfverfahren",
      "Probekörperverwaltung",
      "PDF-Prüfberichte",
      "Cloud Sync",
      "Kalender & Erinnerungen",
      "Fachbereiche Beton, Asphalt, Geotechnik",
    ],
    ctaLabel: "Professional wählen",
    href: "/login",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "99 €",
    period: "/ Monat",
    description: "Für Unternehmen mit mehreren Standorten.",
    features: [
      "Alles aus Professional",
      "Unbegrenzte Nutzer",
      "API-Zugang",
      "White Label Branding",
      "Eigene Werke und Standorte",
      "Prioritätssupport",
      "Individuelle Anpassungen",
    ],
    ctaLabel: "Vertrieb kontaktieren",
    href: "/kontakt",
  },
];
