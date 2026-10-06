import { Ban, BellRing, History, Info, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { EmployeeRoleBadge } from "@/components/shared/EmployeeRoleBadge";
import { InvitationStatusBadge } from "@/components/shared/InvitationStatusBadge";
import { useRoleList } from "@/components/shared/RolesContext";
import {
  buildInvitationTimeline,
  formatIsoDateDE,
  initialsOf,
} from "@/lib/invitations/invitationRules";
import { getRoleDisplayName } from "@/lib/roles/roleRules";
import type { InvitationRow } from "@/types/invitation";

interface InvitationDetailDrawerProps {
  invitation: InvitationRow | null;
  onOpenChange: (open: boolean) => void;
  onSendReminder: (invitation: InvitationRow) => void;
  onResend: (invitation: InvitationRow) => void;
  onRevoke: (invitation: InvitationRow) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export function InvitationDetailDrawer({
  invitation,
  onOpenChange,
  onSendReminder,
  onResend,
  onRevoke,
}: InvitationDetailDrawerProps) {
  const roles = useRoleList();
  const isPending = invitation?.displayStatus === "Ausstehend";
  const canResend = invitation !== null && invitation.displayStatus !== "Angenommen";
  const timeline = invitation ? buildInvitationTimeline(invitation) : [];

  return (
    <Drawer open={invitation !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {invitation && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-3">
                <EmployeeAvatar initials={initialsOf(invitation.name)} size="lg" />
                <div>
                  <DrawerTitle>{invitation.name}</DrawerTitle>
                  <p className="text-sm text-muted-foreground">{invitation.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EmployeeRoleBadge role={invitation.role} roleId={invitation.roleId} />
                <InvitationStatusBadge status={invitation.displayStatus} />
              </div>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Empfänger" value={invitation.name} />
                  <DetailRow label="E-Mail" value={invitation.email} />
                  <DetailRow label="Rolle" value={getRoleDisplayName(invitation, roles)} />
                  <DetailRow label="Standort" value={invitation.location} />
                  <DetailRow label="Status" value={invitation.displayStatus} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <SectionTitle>Einladungsdetails</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Erstellt am" value={formatIsoDateDE(invitation.createdAt)} />
                  <DetailRow label="Läuft ab am" value={formatIsoDateDE(invitation.expiresAt)} />
                  {invitation.acceptedAt && (
                    <DetailRow label="Angenommen am" value={formatIsoDateDE(invitation.acceptedAt)} />
                  )}
                  {invitation.revokedAt && (
                    <DetailRow label="Widerrufen am" value={formatIsoDateDE(invitation.revokedAt)} />
                  )}
                  <DetailRow
                    label="Direkt aktivieren nach Annahme"
                    value={invitation.activateImmediately ? "Ja" : "Nein"}
                  />
                </div>
              </div>

              {invitation.message && (
                <div className="flex flex-col gap-2">
                  <SectionTitle>Nachricht</SectionTitle>
                  <p className="rounded-xl border border-border p-3.5 text-sm text-foreground">
                    {invitation.message}
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
                <Info className="mt-0.5 size-4 shrink-0" />
                Die Einladung ist ein gespeicherter Datensatz. E-Mail-Versand, Einladungslink und Annahme
                werden später serverseitig angebunden.
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf</SectionTitle>
                </div>
                {timeline.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {timeline.map((entry, index) => (
                      <div
                        key={`${entry.timestamp}-${index}`}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                      >
                        <span className="text-foreground">{entry.message}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {entry.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Noch kein Verlauf vorhanden.
                  </div>
                )}
              </div>
            </DrawerBody>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                {isPending && (
                  <Button type="button" variant="outline" onClick={() => onSendReminder(invitation)}>
                    <BellRing className="size-4" />
                    Erinnerung (später)
                  </Button>
                )}
                {canResend && (
                  <Button type="button" variant="outline" onClick={() => onResend(invitation)}>
                    <Send className="size-4" />
                    Erneut senden (später)
                  </Button>
                )}
                {isPending && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="col-span-2"
                    onClick={() => onRevoke(invitation)}
                  >
                    <Ban className="size-4" />
                    Einladung widerrufen
                  </Button>
                )}
              </div>
              {!isPending && (
                <p className="text-xs text-muted-foreground">
                  Widerrufen ist nur für ausstehende, nicht abgelaufene Einladungen möglich.
                </p>
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
