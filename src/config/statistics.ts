import type { BarChartDatum } from "@/components/shared/FakeBarChart";
import type { DonutSegment } from "@/components/shared/FakeDonutChart";
import type { RankingItem } from "@/components/shared/ProgressRanking";

export const zeitraumOptions = ["Heute", "7 Tage", "30 Tage", "365 Tage", "Alle"] as const;
export type ZeitraumOption = (typeof zeitraumOptions)[number];

export type RangeKey = "today" | "sevenDays" | "thirtyDays" | "year" | "all";

export const zeitraumToRangeKey: Record<ZeitraumOption, RangeKey> = {
  Heute: "today",
  "7 Tage": "sevenDays",
  "30 Tage": "thirtyDays",
  "365 Tage": "year",
  Alle: "all",
};

export interface KpiCardData {
  label: string;
  value: string;
  trend?: { value: string; direction: "up" | "down" };
  tone: "default" | "success" | "danger" | "warning";
}

export interface RangeData {
  kpiCards: KpiCardData[];
  chartTitle: string;
  weeklyExams: BarChartDatum[];
  materialDistribution: DonutSegment[];
  materialDonutGradient: string;
  materialTotal: string;
  examsByField: RankingItem[];
  topProjects: RankingItem[];
  insights: string[];
}

// Illustrative Beispielprüfungen für die Balken-Detailansicht — reine Mock-Texte,
// keine echten Datensätze.
const beispielPool = [
  "28-Tage-Prüfung BET-2026-014",
  "7-Tage-Prüfung PR-2026-008",
  "Marshall-Prüfung ASP-2026-011",
  "Proctor-Versuch GEO-2026-021",
  "Sieblinie ASP-2026-007",
  "28-Tage-Prüfung BET-2025-098",
];

function pickBeispiele(index: number): string[] {
  return [
    beispielPool[index % beispielPool.length],
    beispielPool[(index + 1) % beispielPool.length],
  ];
}

// Reichert die rohen Balkenwerte um plausible, zueinander passende Detaildaten
// an (Fachbereichsanteile passend zum Zeitraum, überfällige Prüfungen gezielt
// auf einzelne Balken verteilt). Reine Mock-Daten, keine echte Berechnung.
function withDetails(
  data: Omit<BarChartDatum, "details">[],
  betonShare: number,
  asphaltShare: number,
  ueberfaelligByLabel: Record<string, number> = {}
): BarChartDatum[] {
  return data.map((datum, index) => {
    const beton = Math.round(datum.value * betonShare);
    const asphalt = Math.round(datum.value * asphaltShare);
    const geotechnik = Math.max(datum.value - beton - asphalt, 0);
    const abgeschlossen = Math.round(datum.value * 0.75);
    const ueberfaellig = ueberfaelligByLabel[datum.label] ?? 0;
    const offen = Math.max(datum.value - abgeschlossen, ueberfaellig);

    return {
      ...datum,
      details: {
        beton,
        asphalt,
        geotechnik,
        abgeschlossen,
        offen,
        ueberfaellig,
        beispiele: pickBeispiele(index),
      },
    };
  });
}

// Wie withDetails, aber überfällige Prüfungen werden per Index statt per Label
// zugewiesen — nötig, weil Monatsnamen in einer mehrjährigen Zeitleiste
// mehrfach vorkommen (z. B. "Sep" in zwei verschiedenen Jahren).
function withDetailsByIndex(
  data: Omit<BarChartDatum, "details">[],
  betonShare: number,
  asphaltShare: number,
  ueberfaelligByIndex: Record<number, number> = {}
): BarChartDatum[] {
  return data.map((datum, index) => {
    const beton = Math.round(datum.value * betonShare);
    const asphalt = Math.round(datum.value * asphaltShare);
    const geotechnik = Math.max(datum.value - beton - asphalt, 0);
    const abgeschlossen = Math.round(datum.value * 0.75);
    const ueberfaellig = ueberfaelligByIndex[index] ?? 0;
    const offen = Math.max(datum.value - abgeschlossen, ueberfaellig);

    return {
      ...datum,
      details: {
        beton,
        asphalt,
        geotechnik,
        abgeschlossen,
        offen,
        ueberfaellig,
        beispiele: pickBeispiele(index),
      },
    };
  });
}

const monthNames = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

// Rollierende Monats-Zeitleiste für das "365 Tage"-Diagramm: 24 aufeinander-
// folgende Monate (2 Jahre), damit sich der sichtbare 12-Monatsbereich per
// Pfeiltasten verschieben lässt. Index 6 ist der echte aktuelle Monat (aus
// new Date() abgeleitet) und steht damit standardmäßig am Anfang des
// sichtbaren Fensters.
export const MONTHLY_TIMELINE_DEFAULT_START = 6;

const currentMonthIndex = new Date().getMonth();

function monthLabelAt(rawIndex: number): string {
  const offsetFromToday = rawIndex - MONTHLY_TIMELINE_DEFAULT_START;
  const monthIndex = (((currentMonthIndex + offsetFromToday) % 12) + 12) % 12;
  return monthNames[monthIndex];
}

const monthlyTimelineValues: Omit<BarChartDatum, "details" | "label">[] = [
  { value: 110, heightClass: "h-24" },
  { value: 120, heightClass: "h-28" },
  { value: 97, heightClass: "h-20" },
  { value: 78, heightClass: "h-16" },
  { value: 90, heightClass: "h-20" },
  { value: 96, heightClass: "h-20" },
  { value: 128, heightClass: "h-28" },
  { value: 115, heightClass: "h-28" },
  { value: 120, heightClass: "h-28" },
  { value: 132, heightClass: "h-28" },
  { value: 118, heightClass: "h-28" },
  { value: 98, heightClass: "h-20" },
  { value: 126, heightClass: "h-28" },
  { value: 138, heightClass: "h-32", highlight: true },
  { value: 112, heightClass: "h-24" },
  { value: 90, heightClass: "h-20" },
  { value: 104, heightClass: "h-24" },
  { value: 110, heightClass: "h-24" },
  { value: 137, heightClass: "h-32" },
  { value: 123, heightClass: "h-28" },
  { value: 128, heightClass: "h-28" },
  { value: 141, heightClass: "h-32" },
  { value: 126, heightClass: "h-28" },
  { value: 105, heightClass: "h-24" },
];

export const monthlyTimeline: BarChartDatum[] = withDetailsByIndex(
  monthlyTimelineValues.map((datum, index) => ({
    ...datum,
    label: monthLabelAt(index),
  })),
  0.55,
  0.3,
  { 9: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1 }
);

export const statisticsByRange: Record<RangeKey, RangeData> = {
  today: {
    kpiCards: [
      { label: "Prüfungen gesamt", value: "6", trend: { value: "+2 ggü. gestern", direction: "up" }, tone: "default" },
      { label: "Offene Proben", value: "5", tone: "default" },
      { label: "Überfällige Prüfungen", value: "1", tone: "danger" },
      { label: "Abgeschlossene Prüfungen", value: "4", tone: "success" },
      { label: "Ø Bearbeitungszeit", value: "1,2 Tage", tone: "default" },
      { label: "Laborauslastung", value: "62%", tone: "warning" },
    ],
    chartTitle: "Prüfungen nach Tageszeit",
    weeklyExams: withDetails(
      [
        { label: "Vormittag", value: 1, heightClass: "h-8" },
        { label: "Mittag", value: 1, heightClass: "h-8" },
        { label: "Nachmittag", value: 3, heightClass: "h-32", highlight: true },
        { label: "Abend", value: 1, heightClass: "h-8" },
      ],
      0.5,
      0.33,
      { Nachmittag: 1 }
    ),
    materialDistribution: [
      { label: "Beton", value: 50, dotClass: "bg-primary" },
      { label: "Asphalt", value: 33, dotClass: "bg-warning" },
      { label: "Geotechnik", value: 17, dotClass: "bg-success" },
    ],
    materialDonutGradient:
      "bg-[conic-gradient(var(--color-primary)_0%_50%,var(--color-warning)_50%_83%,var(--color-success)_83%_100%)]",
    materialTotal: "6",
    examsByField: [
      { label: "Beton", value: "3 Prüfungen", percentage: 50 },
      { label: "Asphalt", value: "2 Prüfungen", percentage: 33 },
      { label: "Geotechnik", value: "1 Prüfung", percentage: 17 },
    ],
    topProjects: [
      { label: "Neubau Wohnanlage", value: "3 Prüfungen", percentage: 60 },
      { label: "Brückensanierung B17", value: "2 Prüfungen", percentage: 40 },
      { label: "L 342 Fahrbahnerneuerung", value: "1 Prüfung", percentage: 20 },
    ],
    insights: [
      "Heute wurden bisher 6 Prüfungen dokumentiert.",
      "1 Prüfung ist heute überfällig.",
      "Beton dominiert mit 50 % die heutigen Prüfungen.",
    ],
  },

  sevenDays: {
    kpiCards: [
      { label: "Prüfungen gesamt", value: "24", trend: { value: "+8%", direction: "up" }, tone: "default" },
      { label: "Offene Proben", value: "12", tone: "default" },
      { label: "Überfällige Prüfungen", value: "2", tone: "danger" },
      { label: "Abgeschlossene Prüfungen", value: "18", tone: "success" },
      { label: "Ø Bearbeitungszeit", value: "3,8 Tage", tone: "default" },
      { label: "Laborauslastung", value: "74%", tone: "warning" },
    ],
    chartTitle: "Prüfungen pro Wochentag",
    weeklyExams: withDetails(
      [
        { label: "Mo", value: 3, heightClass: "h-16" },
        { label: "Di", value: 5, heightClass: "h-28" },
        { label: "Mi", value: 4, heightClass: "h-20" },
        { label: "Do", value: 6, heightClass: "h-32", highlight: true },
        { label: "Fr", value: 4, heightClass: "h-20" },
        { label: "Sa", value: 1, heightClass: "h-4" },
        { label: "So", value: 1, heightClass: "h-4" },
      ],
      0.54,
      0.29,
      { Mi: 1, Do: 1 }
    ),
    materialDistribution: [
      { label: "Beton", value: 54, dotClass: "bg-primary" },
      { label: "Asphalt", value: 29, dotClass: "bg-warning" },
      { label: "Geotechnik", value: 17, dotClass: "bg-success" },
    ],
    materialDonutGradient:
      "bg-[conic-gradient(var(--color-primary)_0%_54%,var(--color-warning)_54%_83%,var(--color-success)_83%_100%)]",
    materialTotal: "24",
    examsByField: [
      { label: "Beton", value: "13 Prüfungen", percentage: 54 },
      { label: "Asphalt", value: "7 Prüfungen", percentage: 29 },
      { label: "Geotechnik", value: "4 Prüfungen", percentage: 17 },
    ],
    topProjects: [
      { label: "Neubau Wohnanlage", value: "9 Prüfungen", percentage: 75 },
      { label: "Brückensanierung B17", value: "6 Prüfungen", percentage: 60 },
      { label: "L 342 Fahrbahnerneuerung", value: "5 Prüfungen", percentage: 50 },
      { label: "Baugebiet Nord", value: "3 Prüfungen", percentage: 30 },
      { label: "Gewerbepark Ost", value: "1 Prüfung", percentage: 15 },
    ],
    insights: [
      "Donnerstag war diese Woche der Tag mit der höchsten Auslastung.",
      "2 Prüfungen sind diese Woche überfällig.",
      "Beton dominiert mit 54 % die Prüfungen dieser Woche.",
    ],
  },

  thirtyDays: {
    kpiCards: [
      { label: "Prüfungen gesamt", value: "128", trend: { value: "+8%", direction: "up" }, tone: "default" },
      { label: "Offene Proben", value: "28", tone: "default" },
      { label: "Überfällige Prüfungen", value: "2", tone: "danger" },
      { label: "Abgeschlossene Prüfungen", value: "96", tone: "success" },
      { label: "Ø Bearbeitungszeit", value: "4,2 Tage", tone: "default" },
      { label: "Laborauslastung", value: "78%", tone: "warning" },
    ],
    chartTitle: "Prüfungen pro Woche",
    weeklyExams: withDetails(
      [
        { label: "Woche 1", value: 28, heightClass: "h-24" },
        { label: "Woche 2", value: 34, heightClass: "h-28" },
        { label: "Woche 3", value: 38, heightClass: "h-32", highlight: true },
        { label: "Woche 4", value: 28, heightClass: "h-24" },
      ],
      0.52,
      0.32,
      { "Woche 3": 1, "Woche 4": 1 }
    ),
    materialDistribution: [
      { label: "Beton", value: 52, dotClass: "bg-primary" },
      { label: "Asphalt", value: 32, dotClass: "bg-warning" },
      { label: "Geotechnik", value: 16, dotClass: "bg-success" },
    ],
    // Beton 67 / Asphalt 41 / Geotechnik 20 = 128 (deckt sich mit "Prüfungen gesamt").
    materialDonutGradient:
      "bg-[conic-gradient(var(--color-primary)_0%_52%,var(--color-warning)_52%_84%,var(--color-success)_84%_100%)]",
    materialTotal: "128",
    examsByField: [
      { label: "Beton", value: "67 Prüfungen", percentage: 52 },
      { label: "Asphalt", value: "41 Prüfungen", percentage: 32 },
      { label: "Geotechnik", value: "20 Prüfungen", percentage: 16 },
    ],
    topProjects: [
      { label: "Neubau Wohnanlage", value: "34 Prüfungen", percentage: 88 },
      { label: "Brückensanierung B17", value: "27 Prüfungen", percentage: 72 },
      { label: "L 342 Fahrbahnerneuerung", value: "22 Prüfungen", percentage: 65 },
      { label: "Baugebiet Nord", value: "18 Prüfungen", percentage: 54 },
      { label: "Gewerbepark Ost", value: "12 Prüfungen", percentage: 40 },
    ],
    insights: [
      "Woche 3 war der Zeitraum mit der höchsten Auslastung der letzten 30 Tage.",
      "2 Prüfungen sind aktuell überfällig.",
      "Beton dominiert mit 52 % die Prüfungen der letzten 30 Tage.",
    ],
  },

  year: {
    kpiCards: [
      { label: "Prüfungen gesamt", value: "1.391", trend: { value: "+15%", direction: "up" }, tone: "default" },
      { label: "Offene Proben", value: "42", tone: "default" },
      { label: "Überfällige Prüfungen", value: "6", tone: "danger" },
      { label: "Abgeschlossene Prüfungen", value: "1.287", tone: "success" },
      { label: "Ø Bearbeitungszeit", value: "4,5 Tage", tone: "default" },
      { label: "Laborauslastung", value: "81%", tone: "warning" },
    ],
    chartTitle: "Prüfungen pro Monat",
    weeklyExams: withDetails(
      [
        { label: "Jan", value: 104, heightClass: "h-24" },
        { label: "Feb", value: 110, heightClass: "h-24" },
        { label: "Mär", value: 128, heightClass: "h-28" },
        { label: "Apr", value: 115, heightClass: "h-28" },
        { label: "Mai", value: 120, heightClass: "h-28" },
        { label: "Jun", value: 132, heightClass: "h-28" },
        { label: "Jul", value: 118, heightClass: "h-28" },
        { label: "Aug", value: 98, heightClass: "h-20" },
        { label: "Sep", value: 126, heightClass: "h-28" },
        { label: "Okt", value: 138, heightClass: "h-32", highlight: true },
        { label: "Nov", value: 112, heightClass: "h-24" },
        { label: "Dez", value: 90, heightClass: "h-20" },
      ],
      0.55,
      0.3,
      { Jun: 1, Aug: 1, Sep: 1, Okt: 1, Nov: 1, Dez: 1 }
    ),
    materialDistribution: [
      { label: "Beton", value: 55, dotClass: "bg-primary" },
      { label: "Asphalt", value: 30, dotClass: "bg-warning" },
      { label: "Geotechnik", value: 15, dotClass: "bg-success" },
    ],
    materialDonutGradient:
      "bg-[conic-gradient(var(--color-primary)_0%_55%,var(--color-warning)_55%_85%,var(--color-success)_85%_100%)]",
    materialTotal: "1.391",
    examsByField: [
      { label: "Beton", value: "765 Prüfungen", percentage: 55 },
      { label: "Asphalt", value: "417 Prüfungen", percentage: 30 },
      { label: "Geotechnik", value: "209 Prüfungen", percentage: 15 },
    ],
    topProjects: [
      { label: "Neubau Wohnanlage", value: "312 Prüfungen", percentage: 92 },
      { label: "Brückensanierung B17", value: "265 Prüfungen", percentage: 78 },
      { label: "L 342 Fahrbahnerneuerung", value: "198 Prüfungen", percentage: 62 },
      { label: "Baugebiet Nord", value: "156 Prüfungen", percentage: 48 },
      { label: "Gewerbepark Ost", value: "89 Prüfungen", percentage: 28 },
    ],
    insights: [
      "Oktober war der Monat mit der höchsten Auslastung im letzten Jahr.",
      "6 Prüfungen sind aktuell überfällig.",
      "Beton dominiert mit 55 % die Prüfungen der letzten 365 Tage.",
    ],
  },

  all: {
    kpiCards: [
      { label: "Prüfungen gesamt", value: "3.860", trend: { value: "+22%", direction: "up" }, tone: "default" },
      { label: "Offene Proben", value: "58", tone: "default" },
      { label: "Überfällige Prüfungen", value: "11", tone: "danger" },
      { label: "Abgeschlossene Prüfungen", value: "3.540", tone: "success" },
      { label: "Ø Bearbeitungszeit", value: "4,4 Tage", tone: "default" },
      { label: "Laborauslastung", value: "76%", tone: "warning" },
    ],
    chartTitle: "Prüfungen pro Jahr",
    weeklyExams: withDetails(
      [
        { label: "2023", value: 820, heightClass: "h-20" },
        { label: "2024", value: 1150, heightClass: "h-24" },
        { label: "2025", value: 1450, heightClass: "h-32", highlight: true },
        { label: "2026*", value: 440, heightClass: "h-8" },
      ],
      0.58,
      0.28,
      { "2023": 2, "2024": 3, "2025": 4, "2026*": 2 }
    ),
    materialDistribution: [
      { label: "Beton", value: 58, dotClass: "bg-primary" },
      { label: "Asphalt", value: 28, dotClass: "bg-warning" },
      { label: "Geotechnik", value: 14, dotClass: "bg-success" },
    ],
    materialDonutGradient:
      "bg-[conic-gradient(var(--color-primary)_0%_58%,var(--color-warning)_58%_86%,var(--color-success)_86%_100%)]",
    materialTotal: "3.860",
    examsByField: [
      { label: "Beton", value: "2.239 Prüfungen", percentage: 58 },
      { label: "Asphalt", value: "1.081 Prüfungen", percentage: 28 },
      { label: "Geotechnik", value: "540 Prüfungen", percentage: 14 },
    ],
    topProjects: [
      { label: "Neubau Wohnanlage", value: "612 Prüfungen", percentage: 95 },
      { label: "Brückensanierung B17", value: "540 Prüfungen", percentage: 84 },
      { label: "L 342 Fahrbahnerneuerung", value: "398 Prüfungen", percentage: 68 },
      { label: "Baugebiet Nord", value: "310 Prüfungen", percentage: 52 },
      { label: "Gewerbepark Ost", value: "184 Prüfungen", percentage: 32 },
    ],
    insights: [
      "2025 war bisher das stärkste Jahr im Laborbetrieb.",
      "11 Prüfungen sind über alle Zeiträume aktuell überfällig.",
      "Beton dominiert mit 58 % alle bisher dokumentierten Prüfungen.",
    ],
  },
};

export interface PerformanceRow {
  pruefer: string;
  anzahl: number;
  bearbeitungszeit: string;
  offen: number;
}

// Laborleistung bezieht sich auf die aktuell aktiven Prüfer und ändert sich
// bewusst nicht mit dem Zeitraum-Switch.
export const performanceRows: PerformanceRow[] = [
  { pruefer: "A. Meier", anzahl: 34, bearbeitungszeit: "3,8 Tage", offen: 2 },
  { pruefer: "S. Wolf", anzahl: 31, bearbeitungszeit: "4,5 Tage", offen: 3 },
  { pruefer: "T. Keller", anzahl: 29, bearbeitungszeit: "4,1 Tage", offen: 1 },
  { pruefer: "M. Fischer", anzahl: 34, bearbeitungszeit: "4,0 Tage", offen: 0 },
];

export interface TrendCardData {
  label: string;
  value: string;
  trend: { value: string; direction: "up" | "down" };
}

// Feste Vergleichszeiträume (Heute/Diese Woche/Dieser Monat) — unabhängig
// vom übergeordneten Zeitraum-Switch der Seite.
export const trendCards: TrendCardData[] = [
  { label: "Heute", value: "6", trend: { value: "+2 ggü. gestern", direction: "up" } },
  { label: "Diese Woche", value: "24", trend: { value: "+8% ggü. Vorwoche", direction: "up" } },
  { label: "Dieser Monat", value: "99", trend: { value: "+12% ggü. Vormonat", direction: "up" } },
];

// Laborstatus-Seitenleiste zeigt bewusst immer die aktuelle Woche,
// unabhängig vom gewählten Zeitraum.
export const labStatus = {
  capacity: 78,
  activeSamples: 28,
  completedThisWeek: 24,
  trend: "+8 % ggü. Vorwoche",
  // heightClass darf den h-16-Balkenrahmen in LabStatusSummaryCard nie
  // überschreiten, sonst ragen Balken optisch aus dem Diagramm heraus.
  week: [
    { label: "Mo", count: 3, heightClass: "h-8" },
    { label: "Di", count: 5, heightClass: "h-12" },
    { label: "Mi", count: 4, heightClass: "h-10" },
    { label: "Do", count: 6, heightClass: "h-16", isToday: true },
    { label: "Fr", count: 4, heightClass: "h-10" },
    { label: "Sa", count: 1, heightClass: "h-3" },
    { label: "So", count: 1, heightClass: "h-3" },
  ],
};
