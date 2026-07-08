import { samples } from "@/config/samples";
import type { CalendarEvent, CalendarEventStatus, CalendarPriority } from "@/types/calendarEvent";
import type { Sample, SampleStatus } from "@/types/sample";

// Mocked "heute" passend zu den Proben-/Prüfwerte-Mockdaten dieser Sprints.
export const HEUTE = "03.03.2026";

export const weekDates = [
  "02.03.2026",
  "03.03.2026",
  "04.03.2026",
  "05.03.2026",
  "06.03.2026",
  "07.03.2026",
  "08.03.2026",
];

export const weekDayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Nicht-probenbezogene Termine (Kalibrierung, Besprechungen, Wareneingang) –
// eigenständige Kalendereinträge ohne Bezug zu einer Probe.
const standaloneEvents: CalendarEvent[] = [
  {
    id: "cal-01",
    title: "Kalibrierung Druckprüfmaschine",
    date: "02.03.2026",
    time: "08:30",
    duration: "30 min",
    field: "Sonstiges",
    status: "geplant",
    description: "Jährliche Kalibrierung der Druckprüfmaschine im Betonlabor.",
  },
  {
    id: "cal-06",
    title: "Laborbericht prüfen",
    date: "03.03.2026",
    time: "16:00",
    duration: "30 min",
    field: "Sonstiges",
    status: "geplant",
    description: "Prüfberichte der Woche gegenlesen und freigeben.",
  },
  {
    id: "cal-08",
    title: "Wareneingang Zementproben",
    date: "05.03.2026",
    time: "09:30",
    duration: "20 min",
    field: "Sonstiges",
    status: "geplant",
    description: "Neue Zementproben annehmen und einlagern.",
  },
  {
    id: "cal-09",
    title: "Laborbesprechung Wochenrückblick",
    date: "06.03.2026",
    time: "10:00",
    duration: "30 min",
    field: "Sonstiges",
    status: "geplant",
    description: "Wöchentliche Abstimmung im Laborteam zu offenen Prüfungen.",
  },
];

// Uhrzeit/Dauer sind im Sample-Datensatz nicht modelliert (nur das
// Prüfdatum) – hier bewusst je Probe fest hinterlegt, damit Termine am
// selben Tag nicht kollidieren. Titel, Fachbereich, Status, Projekt, Kunde
// und Prüfer stammen dagegen direkt aus der Probe (config/samples.ts).
const scheduleBySampleId: Record<string, { time: string; duration: string }> = {
  "BET-2026-014": { time: "09:00", duration: "60 min" },
  "PR-2026-008": { time: "10:30", duration: "45 min" },
  "ASP-2026-011": { time: "15:00", duration: "60 min" },
  "GEO-2026-021": { time: "13:00", duration: "90 min" },
  "ASP-2026-007": { time: "11:00", duration: "45 min" },
  "BET-2026-022": { time: "09:30", duration: "60 min" },
  "GEO-2026-033": { time: "14:00", duration: "60 min" },
  "ASP-2026-044": { time: "10:00", duration: "45 min" },
  "PR-2026-055": { time: "08:30", duration: "45 min" },
};

function statusFromSample(status: SampleStatus): CalendarEventStatus {
  if (status === "Abgeschlossen") return "abgeschlossen";
  if (status === "Überfällig") return "überfällig";
  if (status === "In Prüfung") return "in Arbeit";
  return "geplant";
}

function priorityFromSample(sample: Sample): CalendarPriority {
  if (sample.status === "Überfällig") return "hoch";
  if (sample.pruefdatum === HEUTE) return "hoch";
  return "normal";
}

function eventFromSample(sample: Sample): CalendarEvent | null {
  const schedule = scheduleBySampleId[sample.id];
  if (!schedule) return null;

  return {
    id: `cal-${sample.id}`,
    title: `${sample.pruefverfahren} ${sample.id}`,
    date: sample.pruefdatum,
    time: schedule.time,
    duration: schedule.duration,
    field: sample.fachbereich,
    status: statusFromSample(sample.status),
    priority: priorityFromSample(sample),
    sampleId: sample.id,
    bezeichnung: sample.bezeichnung,
    projekt: sample.projekt,
    kunde: sample.kunde,
    pruefer: sample.pruefer,
    description: `${sample.pruefverfahren} für ${sample.bezeichnung} (${sample.id}).`,
  };
}

// Kalendereinträge für Proben werden aus config/samples.ts abgeleitet (über
// das Prüfdatum), archivierte Proben erzeugen bewusst keinen Termin mehr.
const sampleEvents: CalendarEvent[] = samples
  .filter((sample) => sample.status !== "Archiviert")
  .map(eventFromSample)
  .filter((event): event is CalendarEvent => event !== null);

function toSortableDate(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split(".");
  return `${year}-${month}-${day}`;
}

export const calendarEvents: CalendarEvent[] = [...standaloneEvents, ...sampleEvents].sort((a, b) => {
  const dateCompare = toSortableDate(a.date).localeCompare(toSortableDate(b.date));
  return dateCompare === 0 ? a.time.localeCompare(b.time) : dateCompare;
});
