import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Download,
  Eye,
  FileEdit,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Report } from "@/types/report";

interface ReportActionsMenuProps {
  report: Report;
  onOpenEditor: () => void;
  onPreview: () => void;
  onMarkDone: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onArchive: () => void;
  onReactivate: () => void;
}

export function ReportActionsMenu({
  report,
  onOpenEditor,
  onPreview,
  onMarkDone,
  onExportPdf,
  onExportExcel,
  onArchive,
  onReactivate,
}: ReportActionsMenuProps) {
  const { status } = report;
  const canMarkDone = status === "Entwurf";
  const canExport = status === "Entwurf" || status === "Fertig";
  const canArchive = status !== "Archiviert";
  const canReactivate = status === "Archiviert";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Aktionen für ${report.id}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpenEditor}>
          <FileEdit />
          Editor öffnen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPreview}>
          <Eye />
          Vorschau
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canMarkDone && (
          <DropdownMenuItem onSelect={onMarkDone}>
            <CheckCircle2 />
            Als fertig markieren
          </DropdownMenuItem>
        )}
        {canExport && (
          <DropdownMenuItem onSelect={onExportPdf}>
            <Download />
            Als PDF exportieren
          </DropdownMenuItem>
        )}
        {canExport && (
          <DropdownMenuItem onSelect={onExportExcel}>
            <Download />
            Als Excel exportieren
          </DropdownMenuItem>
        )}
        {canArchive && (
          <DropdownMenuItem onSelect={onArchive}>
            <Archive />
            Archivieren
          </DropdownMenuItem>
        )}
        {canReactivate && (
          <DropdownMenuItem onSelect={onReactivate}>
            <ArchiveRestore />
            Reaktivieren
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
