import { Card, CardContent } from "@/components/ui/card";
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
  onDelete: (sample: Sample) => void;
}

interface SampleTableProps extends SampleTableActionHandlers {
  samples: Sample[];
}

const columns = [
  "Proben-ID",
  "Bezeichnung",
  "Fachbereich",
  "Probenart",
  "Kunde",
  "Projekt/Baustelle",
  "Entnahmedatum",
  "Prüfdatum",
  "Prüfalter",
  "Status",
  "Prüfer",
  "",
];

export function SampleTable({ samples, ...handlers }: SampleTableProps) {
  if (samples.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Keine Proben gefunden. Passe Suche oder Filter an.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr
                  key={sample.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
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
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {sample.kunde}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {sample.projekt}
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    <SampleStatusBadge status={sample.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {sample.pruefer}
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
                      onDelete={() => handlers.onDelete(sample)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="flex flex-col gap-3 md:hidden">
        {samples.map((sample) => (
          <Card key={sample.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlers.onViewDetails(sample)}
                  className="min-w-0 text-left"
                >
                  <span className="block truncate font-semibold text-foreground">
                    {sample.id}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {sample.bezeichnung}
                  </span>
                </button>
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
        ))}
      </div>
    </>
  );
}
