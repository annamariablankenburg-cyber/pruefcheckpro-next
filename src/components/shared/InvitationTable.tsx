import { Card, CardContent } from "@/components/ui/card";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { EmployeeRoleBadge } from "@/components/shared/EmployeeRoleBadge";
import { InvitationActionsMenu } from "@/components/shared/InvitationActionsMenu";
import { InvitationStatusBadge } from "@/components/shared/InvitationStatusBadge";
import type { Invitation } from "@/types/invitation";

interface InvitationTableProps {
  invitations: Invitation[];
  onViewDetails: (invitation: Invitation) => void;
  onCopyLink: (invitation: Invitation) => void;
  onSendReminder: (invitation: Invitation) => void;
  onResend: (invitation: Invitation) => void;
  onRevoke: (invitation: Invitation) => void;
  onDelete: (invitation: Invitation) => void;
}

const columns = [
  "Name / E-Mail",
  "Rolle",
  "Standort",
  "Status",
  "Eingeladen von",
  "Erstellt am",
  "Läuft ab am",
  "",
];

export function InvitationTable({
  invitations,
  onViewDetails,
  onCopyLink,
  onSendReminder,
  onResend,
  onRevoke,
  onDelete,
}: InvitationTableProps) {
  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Keine Einladungen gefunden. Passe Suche oder Filter an.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
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
                      <EmployeeAvatar initials={invitation.initials} />
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
                    <EmployeeRoleBadge role={invitation.role} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {invitation.location}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <InvitationStatusBadge status={invitation.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {invitation.invitedBy}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {invitation.createdAt}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {invitation.expiresAt}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <InvitationActionsMenu
                      invitation={invitation}
                      onViewDetails={() => onViewDetails(invitation)}
                      onCopyLink={() => onCopyLink(invitation)}
                      onSendReminder={() => onSendReminder(invitation)}
                      onResend={() => onResend(invitation)}
                      onRevoke={() => onRevoke(invitation)}
                      onDelete={() => onDelete(invitation)}
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
                  <EmployeeAvatar initials={invitation.initials} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">
                      {invitation.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {invitation.email}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <InvitationStatusBadge status={invitation.status} />
                  <InvitationActionsMenu
                    invitation={invitation}
                    onViewDetails={() => onViewDetails(invitation)}
                    onCopyLink={() => onCopyLink(invitation)}
                    onSendReminder={() => onSendReminder(invitation)}
                    onResend={() => onResend(invitation)}
                    onRevoke={() => onRevoke(invitation)}
                    onDelete={() => onDelete(invitation)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Rolle</p>
                  <EmployeeRoleBadge role={invitation.role} className="mt-0.5" />
                </div>
                <div>
                  <p className="text-muted-foreground">Standort</p>
                  <p className="font-medium text-foreground">{invitation.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Eingeladen von</p>
                  <p className="font-medium text-foreground">{invitation.invitedBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Erstellt am</p>
                  <p className="font-medium text-foreground">{invitation.createdAt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Läuft ab am</p>
                  <p className="font-medium text-foreground">{invitation.expiresAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
