import type { CalendarEvent } from "@/types/calendarEvent";

interface InfoItem {
  label: string;
  value: string;
}

function buildInfoItems(event: CalendarEvent): InfoItem[] {
  const items: InfoItem[] = [
    { label: "Datum", value: event.date },
    { label: "Uhrzeit", value: event.time },
  ];

  if (event.duration) items.push({ label: "Dauer", value: event.duration });
  items.push({ label: "Fachbereich", value: event.field });
  if (event.sampleId) items.push({ label: "Probe", value: event.sampleId });
  if (event.projekt) items.push({ label: "Projekt", value: event.projekt });
  if (event.kunde) items.push({ label: "Kunde", value: event.kunde });
  if (event.pruefer) items.push({ label: "Prüfer", value: event.pruefer });
  if (event.priority) {
    items.push({
      label: "Priorität",
      value: event.priority.charAt(0).toUpperCase() + event.priority.slice(1),
    });
  }

  return items;
}

interface CalendarEventInfoProps {
  event: CalendarEvent;
}

export function CalendarEventInfo({ event }: CalendarEventInfoProps) {
  const items = buildInfoItems(event);

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-sm font-medium text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
