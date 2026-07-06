import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarViewMode = "woche" | "monat" | "agenda";

const viewOptions: { value: CalendarViewMode; label: string }[] = [
  { value: "woche", label: "Woche" },
  { value: "monat", label: "Monat" },
  { value: "agenda", label: "Agenda" },
];

interface CalendarToolbarProps {
  rangeLabel: string;
  activeView: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  onToday: () => void;
  onNewTask: () => void;
}

export function CalendarToolbar({
  rangeLabel,
  activeView,
  onViewChange,
  onToday,
  onNewTask,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onToday}>
          Heute
        </Button>
        <span className="text-sm font-medium text-foreground">{rangeLabel}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-border p-0.5">
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewChange(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeView === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button type="button" onClick={onNewTask}>
          <Plus className="size-4" />
          Neue Aufgabe
        </Button>
      </div>
    </div>
  );
}
