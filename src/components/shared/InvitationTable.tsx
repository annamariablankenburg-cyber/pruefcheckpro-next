import { Card, CardContent } from "@/components/ui/card";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { EmployeeRoleBadge } from "@/components/shared/EmployeeRoleBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { InvitationActionsMenu } from "@/components/shared/InvitationActionsMenu";
import { InvitationStatusBadge } from "@/components/shared/InvitationStatusBadge";
import { formatIsoDateDE, initialsOf } from "@/lib/invitations/invitationRules";
import type { InvitationRow } from "@/types/invitation";

interface InvitationTableProps {
  invitations: InvitationRow[];
  onViewDetails: (invitation: InvitationRow) => void;
  onSendReminder: (invitation: InvitationRow) => void;
  onResend: (invitation: InvitationRow) => void;
  onRevoke: (invitation: InvitationRow) => void;
  // Einladungslink kopieren (nur mit Link-Unterstützung, siehe InvitationsView).
  onCopyLink?: (invitation: InvitationRow) => void;
  onResetFilters?: () => void;
}

const columns = ["Name / E-Mail", "Rolle", "Standort", "Status", "Erstellt am", "Läuft ab am", ""];

export function InvitationTable({
  invitations,
  onViewDetails,
  onSendReminder,
  onResend,
  onRevoke,
  onCopyLink,
  onResetFilters,
}: InvitationTableProps) {
  if (invitations.length === 0) {
    return (
      <EmptyState
        message="Keine Einladungen gefunden. Passe Suche oder Filter an."
        onReset={onResetFilters}
      />
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr
                  key={invitation.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onViewDetails(invitation)}
                      className="flex items-center gap-3 text-left"
                    >
                      <EmployeeAvatar initials={initialsOf(invitation.name)} />
                      <span>
                        <span className="block font-medium text-foreground hover:underline">
                          {invitation.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {invitation.email}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EmployeeRoleBadge role={invitation.role} roleId={invitation.roleId} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {invitation.location}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <InvitationStatusBadge status={invitation.displayStatus} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatIsoDateDE(invitation.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatIsoDateDE(invitation.expiresAt)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <InvitationActionsMenu
                      invitation={invitation}
                      onViewDetails={() => onViewDetails(invitation)}
                      onSendReminder={() => onSendReminder(invitation)}
                      onResend={() => onResend(invitation)}
                      onRevoke={() => onRevoke(invitation)}
                      onCopyLink={onCopyLink ? () => onCopyLink(invitation) : undefined}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="flex flex-col gap-3 md:hidden">
        {invitations.map((invitation) => (
          <Card key={invitation.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onViewDetails(invitation)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <EmployeeAvatar initials={initialsOf(invitation.name)} />
                  <span className="min-w-0">
                    <span
                      className="block truncate font-semibold text-foreground"
                      title={invitation.name}
                    >
                      {invitation.name}
                    </span>
                    <span
                      className="block truncate text-xs text-muted-foreground"
                      title={invitation.email}
                    >
                      {invitation.email}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <InvitationStatusBadge status={invitation.displayStatus} />
                  <InvitationActionsMenu
                    invitation={invitation}
                    onViewDetails={() => onViewDetails(invitation)}
                    onSendReminder={() => onSendReminder(invitation)}
                    onResend={() => onResend(invitation)}
                    onRevoke={() => onRevoke(invitation)}
                    onCopyLink={onCopyLink ? () => onCopyLink(invitation) : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Rolle</p>
                  <EmployeeRoleBadge role={invitation.role} roleId={invitation.roleId} className="mt-0.5" />
                </div>
                <div>
                  <p className="text-muted-foreground">Standort</p>
                  <p className="font-medium text-foreground">{invitation.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Erstellt am</p>
                  <p className="font-medium text-foreground">{formatIsoDateDE(invitation.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Läuft ab am</p>
                  <p className="font-medium text-foreground">{formatIsoDateDE(invitation.expiresAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
