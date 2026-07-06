import { Archive, Eye, MoreHorizontal, Pencil, Trash2, TestTubeDiagonal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SampleActionsMenuProps {
  sampleId: string;
  onViewDetails: () => void;
  onEdit: () => void;
  onEnterValues: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function SampleActionsMenu({
  sampleId,
  onViewDetails,
  onEdit,
  onEnterValues,
  onArchive,
  onDelete,
}: SampleActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Aktionen für ${sampleId}`}
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
        <DropdownMenuItem onSelect={onArchive}>
          <Archive />
          Archivieren
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
