import { LayoutList, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type LaborbookView = "Tabelle" | "Timeline";

interface LaborbookViewSwitcherProps {
  view: LaborbookView;
  onViewChange: (view: LaborbookView) => void;
}

const views: { value: LaborbookView; icon: typeof Table2 }[] = [
  { value: "Tabelle", icon: Table2 },
  { value: "Timeline", icon: LayoutList },
];

export function LaborbookViewSwitcher({ view, onViewChange }: LaborbookViewSwitcherProps) {
  return (
    <div className="inline-flex w-fit items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {views.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onViewChange(value)}
          aria-pressed={view === value}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-4" />
          {value}
        </button>
      ))}
    </div>
  );
}
