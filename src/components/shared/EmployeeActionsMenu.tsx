import {
  Eye,
  KeyRound,
  MailX,
  MapPin,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  UserCog,
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
import type { Employee } from "@/types/employee";

interface EmployeeActionsMenuProps {
  employee: Employee;
  onViewDetails: () => void;
  onChangeRole: () => void;
  onChangeLocation: () => void;
  onResetPassword: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onRevokeAccess: () => void;
  onRevokeInvitation: () => void;
}

export function EmployeeActionsMenu({
  employee,
  onViewDetails,
  onChangeRole,
  onChangeLocation,
  onResetPassword,
  onSuspend,
  onReactivate,
  onRevokeAccess,
  onRevokeInvitation,
}: EmployeeActionsMenuProps) {
  const isPending = employee.status === "Ausstehend";
  const isLocked = employee.status === "Gesperrt";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Aktionen für ${employee.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onViewDetails}>
          <Eye />
          Details öffnen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onChangeRole}>
          <UserCog />
          Rolle ändern
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onChangeLocation}>
          <MapPin />
          Standort ändern
        </DropdownMenuItem>

        {isPending ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRevokeInvitation}>
              <MailX />
              Einladung widerrufen
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onSelect={onResetPassword}>
              <KeyRound />
              Passwort-Reset senden
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isLocked ? (
              <DropdownMenuItem onSelect={onReactivate}>
                <PlayCircle />
                Mitarbeiter reaktivieren
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={onSuspend}>
                <PauseCircle />
                Zugriff temporär sperren
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onSelect={onRevokeAccess}>
              <UserX />
              Zugriff entziehen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
