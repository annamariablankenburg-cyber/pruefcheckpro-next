import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const deviceFilterOptions = [
  "Alle",
  "Einsatzbereit",
  "Kalibrierung fällig",
  "Wartung fällig",
  "Außer Betrieb",
  "Archiviert",
  "Druckpresse",
  "Waage",
  "Klimaschrank",
  "Siebanlage",
  "Trockenschrank",
  "Sonstige",
] as const;

export type DeviceFilter = (typeof deviceFilterOptions)[number];

interface DeviceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: DeviceFilter;
  onFilterChange: (filter: DeviceFilter) => void;
}

export function DeviceFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: DeviceFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Gerät, Inventarnummer oder Standort suchen…"
          className="h-10 pl-9"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {deviceFilterOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onFilterChange(option)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              filter === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
