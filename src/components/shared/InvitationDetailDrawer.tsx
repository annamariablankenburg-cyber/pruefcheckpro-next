import { Ban, BellRing, Copy, History, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { EmployeeRoleBadge } from "@/components/shared/EmployeeRoleBadge";
import { InvitationStatusBadge } from "@/components/shared/InvitationStatusBadge";
import type { Invitation } from "@/types/invitation";

interface InvitationDetailDrawerProps {
  invitation: Invitation | null;
  onOpenChange: (open: boolean) => void;
  onCopyLink: (invitation: Invitation) => void;
  onSendReminder: (invitation: Invitation) => void;
  onResend: (invitation: Invitation) => void;
  onRevoke: (invitation: Invitation) => void;
  onDelete: (invitation: Invitation) => void;
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
  onCopyLink,
  onSendReminder,
  onResend,
  onRevoke,
  onDelete,
}: InvitationDetailDrawerProps) {
  const canRemind = invitation?.status === "Offen";
  const canResend = invitation?.status !== "Angenommen";
  const canRevoke = invitation?.status === "Offen";

  return (
    <Drawer open={invitation !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {invitation && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-3">
                <EmployeeAvatar initials={invitation.initials} size="lg" />
                <div>
                  <DrawerTitle>{invitation.name}</DrawerTitle>
                  <p className="text-sm text-muted-foreground">{invitation.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EmployeeRoleBadge role={invitation.role} />
                <InvitationStatusBadge status={invitation.status} />
              </div>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Empfänger" value={invitation.name} />
                  <DetailRow label="E-Mail" value={invitation.email} />
                  <DetailRow label="Rolle" value={invitation.role} />
                  <DetailRow label="Standort" value={invitation.location} />
                  <DetailRow label="Status" value={invitation.status} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <SectionTitle>Einladungsdetails</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Eingeladen von" value={invitation.invitedBy} />
                  <DetailRow label="Erstellt am" value={invitation.createdAt} />
                  <DetailRow label="Ablaufdatum" value={invitation.expiresAt} />
                  <DetailRow label="Letzte Erinnerung" value={invitation.lastReminder ?? "—"} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>Einladungslink</SectionTitle>
                <div className="flex items-center gap-2">
                  <Input readOnly value={invitation.link} className="h-9 flex-1 text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onCopyLink(invitation)}
                    aria-label="Link kopieren"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf / Historie</SectionTitle>
                </div>
                {invitation.history.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {invitation.history.map((entry) => (
                      <div
                        key={entry.message}
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
                    Noch keine Historie vorhanden.
                  </div>
                )}
              </div>
            </DrawerBody>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                {canRemind && (
                  <Button type="button" variant="outline" onClick={() => onSendReminder(invitation)}>
                    <BellRing className="size-4" />
                    Erinnerung senden
                  </Button>
                )}
                {canResend && (
                  <Button type="button" variant="outline" onClick={() => onResend(invitation)}>
                    <Send className="size-4" />
                    Erneut senden
                  </Button>
                )}
                {canRevoke && (
                  <Button type="button" variant="outline" onClick={() => onRevoke(invitation)}>
                    <Ban className="size-4" />
                    Widerrufen
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  className="col-span-2"
                  onClick={() => onDelete(invitation)}
                >
                  <Trash2 className="size-4" />
                  Einladung löschen
                </Button>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
