import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/EmptyState";
import { SampleActionsMenu } from "@/components/shared/SampleActionsMenu";
import { SampleStatusBadge } from "@/components/shared/SampleStatusBadge";
import type { Sample } from "@/types/sample";

interface SampleTableActionHandlers {
  onViewDetails: (sample: Sample) => void;
  onEdit: (sample: Sample) => void;
  onEnterValues: (sample: Sample) => void;
  onStart: (sample: Sample) => void;
  onComplete: (sample: Sample) => void;
  onReopen: (sample: Sample) => void;
  onArchive: (sample: Sample) => void;
  onReactivate: (sample: Sample) => void;
  onDuplicate: (sample: Sample) => void;
  onDelete: (sample: Sample) => void;
}

interface SampleTableProps extends SampleTableActionHandlers {
  samples: Sample[];
  onResetFilters?: () => void;
  selectedIds: Set<string>;
  onToggleSelect: (sample: Sample) => void;
  onToggleSelectAll: (samples: Sample[]) => void;
}

// Spaltenreihenfolge modernisiert: Status direkt neben der Kennzeichnung für
// schnellere Scanbarkeit, Datumsangaben gebündelt am Ende vor den Aktionen.
const columns = [
  "Proben-ID",
  "Bezeichnung",
  "Fachbereich",
  "Probenart",
  "Status",
  "Kunde",
  "Projekt/Baustelle",
  "Prüfer",
  "Entnahmedatum",
  "Prüfdatum",
  "Prüfalter",
  "",
];

export function SampleTable({
  samples,
  onResetFilters,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  ...handlers
}: SampleTableProps) {
  if (samples.length === 0) {
    return (
      <EmptyState message="Keine Proben gefunden. Passe Suche oder Filter an." onReset={onResetFilters} />
    );
  }

  const allSelected = samples.length > 0 && samples.every((sample) => selectedIds.has(sample.id));

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => onToggleSelectAll(samples)}
                    aria-label={allSelected ? "Alle Proben abwählen" : "Alle Proben auswählen"}
                  />
                </th>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => {
                const isSelected = selectedIds.has(sample.id);
                return (
                  <tr
                    key={sample.id}
                    className={
                      isSelected
                        ? "border-b border-border bg-primary/5 last:border-0"
                        : "border-b border-border last:border-0 hover:bg-muted/30"
                    }
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(sample)}
                        aria-label={`${sample.id} auswählen`}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handlers.onViewDetails(sample)}
                        className="font-medium text-foreground hover:underline"
                      >
                        {sample.id}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">
                      {sample.bezeichnung}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {sample.fachbereich}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {sample.probenart}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SampleStatusBadge status={sample.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {sample.kunde}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {sample.projekt}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {sample.pruefer}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {sample.entnahmedatum}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {sample.pruefdatum}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {sample.pruefalter}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <SampleActionsMenu
                        sample={sample}
                        onViewDetails={() => handlers.onViewDetails(sample)}
                        onEdit={() => handlers.onEdit(sample)}
                        onEnterValues={() => handlers.onEnterValues(sample)}
                        onStart={() => handlers.onStart(sample)}
                        onComplete={() => handlers.onComplete(sample)}
                        onReopen={() => handlers.onReopen(sample)}
                        onArchive={() => handlers.onArchive(sample)}
                        onReactivate={() => handlers.onReactivate(sample)}
                        onDuplicate={() => handlers.onDuplicate(sample)}
                        onDelete={() => handlers.onDelete(sample)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="flex flex-col gap-3 md:hidden">
        {samples.map((sample) => {
          const isSelected = selectedIds.has(sample.id);
          return (
            <Card key={sample.id} className={isSelected ? "border-primary/50 bg-primary/5" : undefined}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect(sample)}
                      aria-label={`${sample.id} auswählen`}
                      className="mt-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => handlers.onViewDetails(sample)}
                      className="min-w-0 text-left"
                    >
                      <span className="block truncate font-semibold text-foreground" title={sample.id}>
                        {sample.id}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground" title={sample.bezeichnung}>
                        {sample.bezeichnung}
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <SampleStatusBadge status={sample.status} />
                    <SampleActionsMenu
                      sample={sample}
                      onViewDetails={() => handlers.onViewDetails(sample)}
                      onEdit={() => handlers.onEdit(sample)}
                      onEnterValues={() => handlers.onEnterValues(sample)}
                      onStart={() => handlers.onStart(sample)}
                      onComplete={() => handlers.onComplete(sample)}
                      onReopen={() => handlers.onReopen(sample)}
                      onArchive={() => handlers.onArchive(sample)}
                      onReactivate={() => handlers.onReactivate(sample)}
                      onDuplicate={() => handlers.onDuplicate(sample)}
                      onDelete={() => handlers.onDelete(sample)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Fachbereich</p>
                    <p className="font-medium text-foreground">{sample.fachbereich}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Probenart</p>
                    <p className="font-medium text-foreground">{sample.probenart}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kunde</p>
                    <p className="font-medium text-foreground">{sample.kunde}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Projekt</p>
                    <p className="font-medium text-foreground">{sample.projekt}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entnahme</p>
                    <p className="font-medium text-foreground">{sample.entnahmedatum}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prüfdatum</p>
                    <p className="font-medium text-foreground">{sample.pruefdatum}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Prüfer</p>
                    <p className="font-medium text-foreground">{sample.pruefer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
