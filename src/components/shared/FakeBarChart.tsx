import { cn } from "@/lib/utils";

export interface BarChartDetails {
  beton: number;
  asphalt: number;
  geotechnik: number;
  abgeschlossen: number;
  offen: number;
  ueberfaellig: number;
  beispiele: string[];
}

export interface BarChartDatum {
  label: string;
  value: number;
  heightClass: string;
  highlight?: boolean;
  details?: BarChartDetails;
}

interface FakeBarChartProps {
  data: BarChartDatum[];
  selectedLabel?: string;
  onSelect?: (datum: BarChartDatum) => void;
}

export function FakeBarChart({ data, selectedLabel, onSelect }: FakeBarChartProps) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max items-end gap-2 px-1 sm:gap-3">
        {data.map((datum) => {
          const isSelected = selectedLabel === datum.label;
          return (
            <button
              key={datum.label}
              type="button"
              onClick={() => onSelect?.(datum)}
              aria-pressed={isSelected}
              className={cn(
                "flex w-14 shrink-0 flex-col items-center gap-2 rounded-lg py-1 transition-colors sm:w-16",
                "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isSelected && "bg-primary/5"
              )}
            >
              <span className="text-xs font-medium text-muted-foreground">{datum.value}</span>
              <div className="flex h-32 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-all",
                    datum.highlight ? "bg-primary" : "bg-primary/25",
                    isSelected && "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-card",
                    datum.heightClass
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  datum.highlight || isSelected ? "text-primary" : "text-muted-foreground"
                )}
              >
                {datum.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
