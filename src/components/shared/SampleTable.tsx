import { Card, CardContent } from "@/components/ui/card";
import { SampleActionsMenu } from "@/components/shared/SampleActionsMenu";
import { SampleStatusBadge } from "@/components/shared/SampleStatusBadge";
import type { Sample } from "@/types/sample";

interface SampleTableProps {
  samples: Sample[];
  onViewDetails: (sample: Sample) => void;
  onEdit: (sample: Sample) => void;
  onEnterValues: (sample: Sample) => void;
  onArchive: (sample: Sample) => void;
  onDelete: (sample: Sample) => void;
}

const columns = [
  "Proben-ID",
  "Bezeichnung",
  "Fachbereich",
  "Kunde",
  "Projekt/Baustelle",
  "Entnahmedatum",
  "Prüfdatum",
  "Prüfalter",
  "Status",
  "Prüfer",
  "",
];

export function SampleTable({
  samples,
  onViewDetails,
  onEdit,
  onEnterValues,
  onArchive,
  onDelete,
}: SampleTableProps) {
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
          <table className="w-full min-w-[1000px] text-sm">
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
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                    {sample.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">
                    {sample.bezeichnung}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {sample.fachbereich}
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
                      sampleId={sample.id}
                      onViewDetails={() => onViewDetails(sample)}
                      onEdit={() => onEdit(sample)}
                      onEnterValues={() => onEnterValues(sample)}
                      onArchive={() => onArchive(sample)}
                      onDelete={() => onDelete(sample)}
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
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{sample.id}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {sample.bezeichnung}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <SampleStatusBadge status={sample.status} />
                  <SampleActionsMenu
                    sampleId={sample.id}
                    onViewDetails={() => onViewDetails(sample)}
                    onEdit={() => onEdit(sample)}
                    onEnterValues={() => onEnterValues(sample)}
                    onArchive={() => onArchive(sample)}
                    onDelete={() => onDelete(sample)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Fachbereich</p>
                  <p className="font-medium text-foreground">{sample.fachbereich}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prüfalter</p>
                  <p className="font-medium text-foreground">{sample.pruefalter}</p>
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
