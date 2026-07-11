import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SampleAdvancedFilters } from "@/hooks/useSamples";
import { cn } from "@/lib/utils";
import type { Sample } from "@/types/sample";

export const sampleFilterOptions = [
  "Alle",
  "Beton",
  "Asphalt",
  "Geotechnik",
  "Offen",
  "Vorbereitung",
  "In Prüfung",
  "Überfällig",
  "Abgeschlossen",
  "Archiviert",
] as const;

export type SampleFilter = (typeof sampleFilterOptions)[number];

interface SampleFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: SampleFilter;
  onFilterChange: (filter: SampleFilter) => void;
  samples: Sample[];
  advancedFilters: SampleAdvancedFilters;
  onAdvancedFiltersChange: (filters: SampleAdvancedFilters) => void;
}

function uniqueSorted(values: string[]): string[] {
  return ["Alle", ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "de"))];
}

export function SampleFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  samples,
  advancedFilters,
  onAdvancedFiltersChange,
}: SampleFiltersProps) {
  const projektOptions = uniqueSorted(samples.map((sample) => sample.projekt));
  const kundeOptions = uniqueSorted(samples.map((sample) => sample.kunde));
  const pruefertOptions = uniqueSorted(samples.map((sample) => sample.pruefer));
  const alterOptions = uniqueSorted(samples.map((sample) => sample.pruefalter));

  function updateAdvanced(changes: Partial<SampleAdvancedFilters>) {
    onAdvancedFiltersChange({ ...advancedFilters, ...changes });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Probe, Kunde, Projekt oder Material suchen…"
          className="h-10 pl-9"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {sampleFilterOptions.map((option) => (
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Select value={advancedFilters.projekt} onValueChange={(value) => updateAdvanced({ projekt: value })}>
          <SelectTrigger className="h-9" aria-label="Nach Projekt filtern">
            <SelectValue placeholder="Projekt" />
          </SelectTrigger>
          <SelectContent>
            {projektOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "Alle" ? "Alle Projekte" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={advancedFilters.kunde} onValueChange={(value) => updateAdvanced({ kunde: value })}>
          <SelectTrigger className="h-9" aria-label="Nach Kunde filtern">
            <SelectValue placeholder="Kunde" />
          </SelectTrigger>
          <SelectContent>
            {kundeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "Alle" ? "Alle Kunden" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={advancedFilters.pruefer} onValueChange={(value) => updateAdvanced({ pruefer: value })}>
          <SelectTrigger className="h-9" aria-label="Nach Prüfer filtern">
            <SelectValue placeholder="Prüfer" />
          </SelectTrigger>
          <SelectContent>
            {pruefertOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "Alle" ? "Alle Prüfer" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={advancedFilters.alter} onValueChange={(value) => updateAdvanced({ alter: value })}>
          <SelectTrigger className="h-9" aria-label="Nach Prüfalter filtern">
            <SelectValue placeholder="Alter" />
          </SelectTrigger>
          <SelectContent>
            {alterOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "Alle" ? "Alle Prüfalter" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-1">
          <label htmlFor="sample-filter-datum" className="sr-only">
            Nach Entnahmedatum filtern
          </label>
          <Input
            id="sample-filter-datum"
            type="date"
            value={advancedFilters.datum}
            onChange={(event) => updateAdvanced({ datum: event.target.value })}
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}
