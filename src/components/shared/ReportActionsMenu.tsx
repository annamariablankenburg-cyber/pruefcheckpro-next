import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileEdit,
  MoreHorizontal,
  Trash2,
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
  onOpenDetails: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onMarkDone: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}

export function ReportActionsMenu({
  report,
  onOpenDetails,
  onEdit,
  onPreview,
  onMarkDone,
  onExportPdf,
  onExportExcel,
  onDuplicate,
  onArchive,
  onReactivate,
  onDelete,
}: ReportActionsMenuProps) {
  const { status } = report;
  const canMarkDone = status === "Entwurf";
  const canExport = status !== "Archiviert";
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
        <DropdownMenuItem onSelect={onOpenDetails}>
          <Eye />
          Details öffnen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <FileEdit />
          Bearbeiten
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPreview}>
          <Eye />
          Vorschau öffnen
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
            PDF exportieren
          </DropdownMenuItem>
        )}
        {canExport && (
          <DropdownMenuItem onSelect={onExportExcel}>
            <Download />
            Excel exportieren
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onDuplicate}>
          <Copy />
          Duplizieren
        </DropdownMenuItem>

        <DropdownMenuSeparator />

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

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
