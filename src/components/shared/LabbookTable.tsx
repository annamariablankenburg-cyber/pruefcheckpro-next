import { Archive, Download, Eye, FileText, MoreHorizontal, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LabEntryStatusBadge } from "@/components/shared/LabEntryStatusBadge";
import type { LabEntry } from "@/types/labEntry";

interface LabbookTableProps {
  entries: LabEntry[];
  onViewDetails: (entry: LabEntry) => void;
  onEdit: (entry: LabEntry) => void;
  onOpenPdf: (entry: LabEntry) => void;
  onExport: (entry: LabEntry) => void;
  onArchive: (entry: LabEntry) => void;
}

const columns = [
  "Datum",
  "Probe",
  "Projekt",
  "Kunde",
  "Fachbereich",
  "Prüfung",
  "Prüfer",
  "Status",
  "Dokumente",
  "",
];

function DocumentsCell({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <FileText className="size-3.5 shrink-0" />
      {count > 0 ? `${count} Dokument${count === 1 ? "" : "e"}` : "Keine"}
    </span>
  );
}

function EntryActionsMenu({
  entry,
  onViewDetails,
  onEdit,
  onOpenPdf,
  onExport,
  onArchive,
}: LabbookTableProps & { entry: LabEntry }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Aktionen für ${entry.sampleId}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onViewDetails(entry)}>
          <Eye />
          Details öffnen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(entry)}>
          <Pencil />
          Bearbeiten
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpenPdf(entry)}>
          <FileText />
          PDF öffnen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport(entry)}>
          <Download />
          Exportieren
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onArchive(entry)}>
          <Archive />
          Archivieren
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LabbookTable(props: LabbookTableProps) {
  const { entries } = props;

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Keine Laborbucheinträge gefunden. Passe Suche oder Filter an.
        </CardContent>
      </Card>
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
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.datum}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                    {entry.sampleId}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.projekt}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.kunde}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.fachbereich}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">{entry.pruefung}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.pruefer}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <LabEntryStatusBadge status={entry.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <DocumentsCell count={entry.documentsCount} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <EntryActionsMenu entry={entry} {...props} />
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
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{entry.sampleId}</p>
                  <p className="truncate text-sm text-muted-foreground">{entry.pruefung}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <LabEntryStatusBadge status={entry.status} />
                  <EntryActionsMenu entry={entry} {...props} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Datum</p>
                  <p className="font-medium text-foreground">{entry.datum}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fachbereich</p>
                  <p className="font-medium text-foreground">{entry.fachbereich}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kunde</p>
                  <p className="font-medium text-foreground">{entry.kunde}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projekt</p>
                  <p className="font-medium text-foreground">{entry.projekt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prüfer</p>
                  <p className="font-medium text-foreground">{entry.pruefer}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dokumente</p>
                  <DocumentsCell count={entry.documentsCount} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
