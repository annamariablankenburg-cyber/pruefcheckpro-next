import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileEdit,
  Mail,
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
import type { ReportUiAccess } from "@/lib/permissions/domainAccess";
import type { Report } from "@/types/report";

interface ReportActionsMenuProps {
  report: Report;
  // Rechte des Nutzers (UX-Gating; die Firestore Rules bleiben die Sicherheitsgrenze).
  access: ReportUiAccess;
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
  onSendEmail: () => void;
}

export function ReportActionsMenu({
  report,
  access,
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
  onSendEmail,
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
        {access.edit && (
          <DropdownMenuItem onSelect={onEdit}>
            <FileEdit />
            Bearbeiten
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onPreview}>
          <Eye />
          Vorschau öffnen
        </DropdownMenuItem>
        {access.edit && (
          <DropdownMenuItem onSelect={onSendEmail}>
            <Mail />
            Per E-Mail senden
          </DropdownMenuItem>
        )}

        {(access.edit || access.export || access.duplicate) && <DropdownMenuSeparator />}

        {access.edit && canMarkDone && (
          <DropdownMenuItem onSelect={onMarkDone}>
            <CheckCircle2 />
            Als fertig markieren
          </DropdownMenuItem>
        )}
        {access.export && canExport && (
          <DropdownMenuItem onSelect={onExportPdf}>
            <Download />
            PDF exportieren
          </DropdownMenuItem>
        )}
        {access.export && canExport && (
          <DropdownMenuItem onSelect={onExportExcel}>
            <Download />
            Excel exportieren
          </DropdownMenuItem>
        )}
        {access.duplicate && (
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy />
            Duplizieren
          </DropdownMenuItem>
        )}

        {access.edit && (
          <>
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
          </>
        )}

        {access.delete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 />
              Löschen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
