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
import type { EmployeeActionPolicy } from "@/lib/permissions/gatingRules";
import type { Employee } from "@/types/employee";

interface EmployeeActionsMenuProps {
  employee: Employee;
  // Welche Aktionen der eingeloggte User für diesen Mitarbeiter angeboten bekommt.
  actions: EmployeeActionPolicy;
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
  actions,
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
        {actions.canChangeRole && (
          <DropdownMenuItem onSelect={onChangeRole}>
            <UserCog />
            Rolle ändern
          </DropdownMenuItem>
        )}
        {actions.canChangeLocation && (
          <DropdownMenuItem onSelect={onChangeLocation}>
            <MapPin />
            Standort ändern
          </DropdownMenuItem>
        )}

        {isPending ? (
          actions.canRevokeInvitation && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onRevokeInvitation}>
                <MailX />
                Einladung widerrufen (später)
              </DropdownMenuItem>
            </>
          )
        ) : (
          <>
            {actions.canResetPassword && (
              <DropdownMenuItem onSelect={onResetPassword}>
                <KeyRound />
                Passwort-Reset (später)
              </DropdownMenuItem>
            )}
            {actions.canChangeStatus && (
              <>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
