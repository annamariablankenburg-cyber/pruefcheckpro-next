import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  RotateCcw,
  TestTubeDiagonal,
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
import type { SampleUiAccess } from "@/lib/permissions/domainAccess";
import type { Sample } from "@/types/sample";

interface SampleActionsMenuProps {
  sample: Sample;
  // Rechte des Nutzers (UX-Gating; die Firestore Rules bleiben die Sicherheitsgrenze).
  access: SampleUiAccess;
  onViewDetails: () => void;
  onEdit: () => void;
  onEnterValues: () => void;
  onStart: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onArchive: () => void;
  onReactivate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SampleActionsMenu({
  sample,
  access,
  onViewDetails,
  onEdit,
  onEnterValues,
  onStart,
  onComplete,
  onReopen,
  onArchive,
  onReactivate,
  onDuplicate,
  onDelete,
}: SampleActionsMenuProps) {
  const { status } = sample;
  const canStart = status === "Offen" || status === "Vorbereitung";
  const canComplete = status === "In Prüfung" || status === "Überfällig";
  const canReopen = status === "Abgeschlossen";
  const canArchive = status !== "Archiviert";
  const canReactivate = status === "Archiviert";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Aktionen für ${sample.id}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onViewDetails}>
          <Eye />
          Details öffnen
        </DropdownMenuItem>
        {access.editDialog && (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil />
            Bearbeiten
          </DropdownMenuItem>
        )}
        {access.enterValues && (
          <DropdownMenuItem onSelect={onEnterValues}>
            <TestTubeDiagonal />
            Prüfwerte eintragen
          </DropdownMenuItem>
        )}

        {(access.edit || access.duplicate) && <DropdownMenuSeparator />}

        {access.edit && canStart && (
          <DropdownMenuItem onSelect={onStart}>
            <PlayCircle />
            In Prüfung starten
          </DropdownMenuItem>
        )}
        {access.edit && canComplete && (
          <DropdownMenuItem onSelect={onComplete}>
            <CheckCircle2 />
            Abschließen
          </DropdownMenuItem>
        )}
        {access.edit && canReopen && (
          <DropdownMenuItem onSelect={onReopen}>
            <RotateCcw />
            Wieder öffnen
          </DropdownMenuItem>
        )}
        {access.edit && canArchive && (
          <DropdownMenuItem onSelect={onArchive}>
            <Archive />
            Archivieren
          </DropdownMenuItem>
        )}
        {access.edit && canReactivate && (
          <DropdownMenuItem onSelect={onReactivate}>
            <ArchiveRestore />
            Reaktivieren
          </DropdownMenuItem>
        )}
        {access.duplicate && (
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy />
            Duplizieren
          </DropdownMenuItem>
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
