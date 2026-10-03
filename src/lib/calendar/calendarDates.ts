// Lokale Datumslogik für den Smart-Kalender. Rein funktional, ohne React und
// ohne Firebase. Termine speichern ihr Datum weiterhin als "DD.MM.YYYY"
// (bestehendes Anzeigeformat, siehe types/calendarEvent.ts) – diese Datei
// übersetzt zwischen diesem Format, dem nativen Date und dem Wert von
// <input type="date"> ("YYYY-MM-DD").
import type { CalendarEvent } from "@/types/calendarEvent";

export interface CalendarWeekDay {
  date: string;
  label: string;
  dayNumber: string;
  monthName: string;
  isToday: boolean;
}

export function formatDateDE(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

export function parseDateDE(value: string): Date {
  const [day, month, year] = value.split(".").map(Number);
  return new Date(year, month - 1, day);
}

// <input type="date"> arbeitet mit "YYYY-MM-DD".
export function dateDEToIsoInput(value: string): string {
  const [day, month, year] = value.split(".");
  return `${year}-${month}-${day}`;
}

export function isoInputToDateDE(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

// Sortierbares Format "YYYY-MM-DD" für ein DD.MM.YYYY-Datum (lexikografisch
// vergleichbar).
export function sortableDate(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split(".");
  return `${year}-${month}-${day}`;
}

export function compareCalendarEvents(a: CalendarEvent, b: CalendarEvent): number {
  const dateCompare = sortableDate(a.date).localeCompare(sortableDate(b.date));
  return dateCompare === 0 ? a.time.localeCompare(b.time) : dateCompare;
}

export function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort(compareCalendarEvents);
}

// Woche beginnt am Montag (deutsche Konvention). Gibt 7 lokale Tage zurück.
export function getWeekDates(anchor: Date): Date[] {
  const offsetFromMonday = (anchor.getDay() + 6) % 7;
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - offsetFromMonday);
  return Array.from(
    { length: 7 },
    (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)
  );
}

// Die Kalenderansicht zeigt immer die Woche des Bezugsdatums; das Bezugsdatum
// ist im Firestore-Modus "heute". isToday wird daher gegen dasselbe Datum
// geprüft.
export function buildWeekDays(anchor: Date, labels: string[]): CalendarWeekDay[] {
  const todayDE = formatDateDE(anchor);
  return getWeekDates(anchor).map((day, index) => ({
    date: formatDateDE(day),
    label: labels[index],
    dayNumber: String(day.getDate()),
    monthName: day.toLocaleDateString("de-DE", { month: "long" }),
    isToday: formatDateDE(day) === todayDE,
  }));
}

// Wochenbereich als Text, z. B. "2. – 8. März 2026" oder – über Monats-/
// Jahresgrenzen hinweg – "28. Februar – 6. März 2026".
export function formatRangeLabel(days: Date[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  const monthOf = (date: Date) => date.toLocaleDateString("de-DE", { month: "long" });
  const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
  const sameYear = first.getFullYear() === last.getFullYear();

  if (sameMonth) {
    return `${first.getDate()}. – ${last.getDate()}. ${monthOf(last)} ${last.getFullYear()}`;
  }
  if (sameYear) {
    return `${first.getDate()}. ${monthOf(first)} – ${last.getDate()}. ${monthOf(last)} ${last.getFullYear()}`;
  }
  return `${first.getDate()}. ${monthOf(first)} ${first.getFullYear()} – ${last.getDate()}. ${monthOf(last)} ${last.getFullYear()}`;
}
