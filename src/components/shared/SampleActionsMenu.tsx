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
import type { Sample } from "@/types/sample";

interface SampleActionsMenuProps {
  sample: Sample;
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
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil />
          Bearbeiten
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEnterValues}>
          <TestTubeDiagonal />
          Prüfwerte eintragen
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canStart && (
          <DropdownMenuItem onSelect={onStart}>
            <PlayCircle />
            In Prüfung starten
          </DropdownMenuItem>
        )}
        {canComplete && (
          <DropdownMenuItem onSelect={onComplete}>
            <CheckCircle2 />
            Abschließen
          </DropdownMenuItem>
        )}
        {canReopen && (
          <DropdownMenuItem onSelect={onReopen}>
            <RotateCcw />
            Wieder öffnen
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
        <DropdownMenuItem onSelect={onDuplicate}>
          <Copy />
          Duplizieren
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
