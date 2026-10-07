import {
  Archive,
  Eye,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Receipt,
  Truck,
  Upload,
  UserCheck,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Customer } from "@/types/customer";

interface CustomerActionsMenuProps {
  customer: Customer;
  // kunden.bearbeiten (Bearbeiten, Status/Archiv, Rechnungen/Lieferscheine/Dokumente) bzw. projekte.erstellen (+ kunden.ansehen).
  canEdit: boolean;
  canCreateProject: boolean;
  onViewDetails: () => void;
  onEdit: () => void;
  onCreateProject: () => void;
  onAddInvoice: () => void;
  onAddDeliveryNote: () => void;
  onUploadDocument: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onArchive: () => void;
}

export function CustomerActionsMenu({
  customer,
  canEdit,
  canCreateProject,
  onViewDetails,
  onEdit,
  onCreateProject,
  onAddInvoice,
  onAddDeliveryNote,
  onUploadDocument,
  onDeactivate,
  onReactivate,
  onArchive,
}: CustomerActionsMenuProps) {
  const { status } = customer;
  const canDeactivate = status === "Aktiv";
  const canReactivate = status === "Inaktiv" || status === "Archiviert";
  const canArchive = status !== "Archiviert";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Aktionen für ${customer.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onViewDetails}>
          <Eye />
          Details öffnen
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil />
            Bearbeiten
          </DropdownMenuItem>
        )}

        {(canCreateProject || canEdit) && <DropdownMenuSeparator />}

        {canCreateProject && (
          <DropdownMenuItem onSelect={onCreateProject}>
            <FolderPlus />
            Projekt erstellen
          </DropdownMenuItem>
        )}
        {canEdit && (
          <>
            <DropdownMenuItem onSelect={onAddInvoice}>
              <Receipt />
              Rechnung hinzufügen
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onAddDeliveryNote}>
              <Truck />
              Lieferschein hinzufügen
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onUploadDocument}>
              <Upload />
              Dokument hochladen
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {canDeactivate && (
              <DropdownMenuItem onSelect={onDeactivate}>
                <UserX />
                Deaktivieren
              </DropdownMenuItem>
            )}
            {canReactivate && (
              <DropdownMenuItem onSelect={onReactivate}>
                <UserCheck />
                Reaktivieren
              </DropdownMenuItem>
            )}
            {canArchive && (
              <DropdownMenuItem onSelect={onArchive}>
                <Archive />
                Archivieren
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
