import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Eye,
  FlaskConical,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Truck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/types/project";

interface ProjectActionsMenuProps {
  project: Project;
  onViewDetails: () => void;
  onEdit: () => void;
  onViewSamples: () => void;
  onNewSample: () => void;
  onAddDeliveryNote: () => void;
  onOpenCustomer: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onArchive: () => void;
  onReactivate: () => void;
}

export function ProjectActionsMenu({
  project,
  onViewDetails,
  onEdit,
  onViewSamples,
  onNewSample,
  onAddDeliveryNote,
  onOpenCustomer,
  onPause,
  onResume,
  onComplete,
  onReopen,
  onArchive,
  onReactivate,
}: ProjectActionsMenuProps) {
  const { status } = project;
  const canPause = status === "Aktiv";
  const canResume = status === "Pausiert";
  const canComplete = status === "Aktiv" || status === "Pausiert";
  const canReopen = status === "Abgeschlossen";
  const canArchive = status !== "Archiviert";
  const canReactivate = status === "Archiviert";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Aktionen für ${project.name}`}>
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

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={onViewSamples}>
          <FlaskConical />
          Proben anzeigen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onNewSample}>
          <Plus />
          Neue Probe
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onAddDeliveryNote}>
          <Truck />
          Lieferschein hinzufügen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenCustomer}>
          <Users />
          Kunden öffnen
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canPause && (
          <DropdownMenuItem onSelect={onPause}>
            <Pause />
            Pausieren
          </DropdownMenuItem>
        )}
        {canResume && (
          <DropdownMenuItem onSelect={onResume}>
            <Play />
            Projekt fortsetzen
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
