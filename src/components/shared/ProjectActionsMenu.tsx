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
import type { ProjectUiAccess } from "@/lib/permissions/domainAccess";
import type { Project } from "@/types/project";

interface ProjectActionsMenuProps {
  project: Project;
  // Rechte des Nutzers (UX-Gating; die Firestore Rules bleiben die Sicherheitsgrenze).
  access: ProjectUiAccess;
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
  access,
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
        {access.editDialog && (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil />
            Bearbeiten
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {access.viewSamples && (
          <DropdownMenuItem onSelect={onViewSamples}>
            <FlaskConical />
            Proben anzeigen
          </DropdownMenuItem>
        )}
        {access.newSample && (
          <DropdownMenuItem onSelect={onNewSample}>
            <Plus />
            Neue Probe
          </DropdownMenuItem>
        )}
        {access.edit && (
          <DropdownMenuItem onSelect={onAddDeliveryNote}>
            <Truck />
            Lieferschein hinzufügen
          </DropdownMenuItem>
        )}
        {access.openCustomer && (
          <DropdownMenuItem onSelect={onOpenCustomer}>
            <Users />
            Kunden öffnen
          </DropdownMenuItem>
        )}

        {access.edit && (
          <>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
