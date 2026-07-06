import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CalendarField } from "@/types/calendarEvent";

export const fieldDotStyles: Record<CalendarField, string> = {
  Beton: "bg-primary",
  Asphalt: "bg-warning",
  Geotechnik: "bg-success",
  Sonstiges: "bg-muted-foreground",
};

const fieldBadgeStyles: Record<CalendarField, string> = {
  Beton: "bg-primary/10 text-primary",
  Asphalt: "bg-warning/10 text-warning",
  Geotechnik: "bg-success/10 text-success",
  Sonstiges: "bg-muted text-muted-foreground",
};

export function CalendarFieldBadge({
  field,
  className,
}: {
  field: CalendarField;
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", fieldBadgeStyles[field], className)}>
      {field}
    </Badge>
  );
}

export const fieldCardStyles: Record<CalendarField, string> = {
  Beton: "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10",
  Asphalt: "border-warning/20 bg-warning/5 hover:border-warning/40 hover:bg-warning/10",
  Geotechnik: "border-success/20 bg-success/5 hover:border-success/40 hover:bg-success/10",
  Sonstiges: "border-border bg-muted/40 hover:border-foreground/20 hover:bg-muted/60",
};

const fields: CalendarField[] = ["Beton", "Asphalt", "Geotechnik", "Sonstiges"];

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {fields.map((field) => (
        <div key={field} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-2 shrink-0 rounded-full", fieldDotStyles[field])} />
          {field}
        </div>
      ))}
    </div>
  );
}
