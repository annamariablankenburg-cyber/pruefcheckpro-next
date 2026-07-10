import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FieldAreaFiltersProps<F extends string> {
  search: string;
  onSearchChange: (value: string) => void;
  filter: F;
  onFilterChange: (filter: F) => void;
  options: readonly F[];
}

// Generische Suche+Filter-Leiste für die Fachbereichsseiten. Anders als
// LearningFilters/CustomerFilters (feste Filter-Union) bekommt diese
// Komponente die zulässigen Filter je Fachbereich als Prop übergeben, da
// nur ein Teil der Filter-Tags pro Fachbereich sinnvoll ist.
export function FieldAreaFilters<F extends string>({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  options,
}: FieldAreaFiltersProps<F>) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Prüfverfahren, Formel, Norm oder Begriff suchen…"
          className="h-10 pl-9"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {options.map((option) => (
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
