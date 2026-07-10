import { Card, CardContent } from "@/components/ui/card";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { LaborbookActionsMenu } from "@/components/shared/LaborbookActionsMenu";
import { LaborbookStatusBadge } from "@/components/shared/LaborbookStatusBadge";
import { LaborbookTypeBadge } from "@/components/shared/LaborbookTypeBadge";
import type { LaborbookEntry } from "@/types/laborbook";

interface LaborbookTableActionHandlers {
  onViewDetails: (entry: LaborbookEntry) => void;
  onEdit: (entry: LaborbookEntry) => void;
  onArchive: (entry: LaborbookEntry) => void;
  onReactivate: (entry: LaborbookEntry) => void;
  onDelete: (entry: LaborbookEntry) => void;
}

interface LaborbookTableProps extends LaborbookTableActionHandlers {
  entries: LaborbookEntry[];
  onResetFilters?: () => void;
}

const columns = [
  "Datum/Uhrzeit",
  "Typ",
  "Projekt",
  "Probe",
  "Mitarbeiter",
  "Beschreibung",
  "Status",
  "",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LaborbookTable({ entries, onResetFilters, ...handlers }: LaborbookTableProps) {
  if (entries.length === 0) {
    return (
      <EmptyState message="Keine Einträge gefunden. Passe Suche oder Filter an." onReset={onResetFilters} />
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
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
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handlers.onViewDetails(entry)}
                      className="text-left font-medium text-foreground hover:underline"
                    >
                      {entry.datum}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {entry.uhrzeit} Uhr
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <LaborbookTypeBadge typ={entry.typ} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {entry.projekt ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {entry.probeId ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <EmployeeAvatar initials={initialsOf(entry.mitarbeiter)} size="sm" />
                      {entry.mitarbeiter}
                    </div>
                  </td>
                  <td
                    className="max-w-[280px] truncate px-4 py-3 text-muted-foreground"
                    title={entry.beschreibung}
                  >
                    {entry.beschreibung}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <LaborbookStatusBadge status={entry.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <LaborbookActionsMenu
                      entry={entry}
                      onViewDetails={() => handlers.onViewDetails(entry)}
                      onEdit={() => handlers.onEdit(entry)}
                      onArchive={() => handlers.onArchive(entry)}
                      onReactivate={() => handlers.onReactivate(entry)}
                      onDelete={() => handlers.onDelete(entry)}
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
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlers.onViewDetails(entry)}
                  className="min-w-0 text-left"
                >
                  <span className="block truncate font-semibold text-foreground">{entry.titel}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {entry.datum} · {entry.uhrzeit} Uhr
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <LaborbookStatusBadge status={entry.status} />
                  <LaborbookActionsMenu
                    entry={entry}
                    onViewDetails={() => handlers.onViewDetails(entry)}
                    onEdit={() => handlers.onEdit(entry)}
                    onArchive={() => handlers.onArchive(entry)}
                    onReactivate={() => handlers.onReactivate(entry)}
                    onDelete={() => handlers.onDelete(entry)}
                  />
                </div>
              </div>

              <LaborbookTypeBadge typ={entry.typ} className="w-fit" />

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Projekt</p>
                  <p className="font-medium text-foreground">{entry.projekt ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Probe</p>
                  <p className="font-medium text-foreground">{entry.probeId ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Mitarbeiter</p>
                  <p className="font-medium text-foreground">{entry.mitarbeiter}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
