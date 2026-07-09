"use client";

import { useState } from "react";
import { Check, Clock, Mail, Plus, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { InvitationDetailDrawer } from "@/components/shared/InvitationDetailDrawer";
import { InvitationFilters } from "@/components/shared/InvitationFilters";
import { InvitationTable } from "@/components/shared/InvitationTable";
import { InviteEmployeeDialog } from "@/components/shared/InviteEmployeeDialog";
import { StatCard } from "@/components/shared/StatCard";
import { useInvitations } from "@/hooks/useInvitations";
import type { Invitation } from "@/types/invitation";

type ConfirmActionType = "remind" | "resend" | "revoke" | "delete";

interface ConfirmConfig {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
}

const confirmConfigs: Record<ConfirmActionType, ConfirmConfig> = {
  remind: {
    title: "Erinnerung senden?",
    description: "Der Empfänger erhält später eine erneute Erinnerungs-E-Mail zur Einladung.",
    confirmLabel: "Erinnerung senden",
  },
  resend: {
    title: "Einladung erneut senden?",
    description: "Es wird später eine neue Einladungs-E-Mail mit gültigem Link verschickt.",
    confirmLabel: "Erneut senden",
  },
  revoke: {
    title: "Einladung widerrufen?",
    description: "Der Einladungslink wird ungültig und kann nicht mehr verwendet werden.",
    confirmLabel: "Widerrufen",
    confirmVariant: "destructive",
  },
  delete: {
    title: "Einladung löschen?",
    description:
      "Die Einladung wird aus der Übersicht entfernt. Historische Aktivitäten können später im Audit-Log erhalten bleiben.",
    confirmLabel: "Löschen",
    confirmVariant: "destructive",
  },
};

export function InvitationsView() {
  const {
    invitations,
    filteredInvitations,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateInvitation: updateInvitationData,
    removeInvitation,
  } = useInvitations();
  const [detailInvitation, setDetailInvitation] = useState<Invitation | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    invitation: Invitation;
    type: ConfirmActionType;
  } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { message: copyFeedback, showFeedback } = useFeedbackToast();

  const totalCount = invitations.length;
  const openCount = invitations.filter((invitation) => invitation.status === "Offen").length;
  const acceptedCount = invitations.filter(
    (invitation) => invitation.status === "Angenommen"
  ).length;
  const expiredCount = invitations.filter(
    (invitation) => invitation.status === "Abgelaufen"
  ).length;
  const revokedCount = invitations.filter(
    (invitation) => invitation.status === "Widerrufen"
  ).length;

  function updateInvitation(id: string, changes: Partial<Invitation>) {
    updateInvitationData(id, changes);
    setDetailInvitation((current) =>
      current && current.id === id ? { ...current, ...changes } : current
    );
  }

  function handleCopyLink(invitation: Invitation) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(invitation.link).catch(() => {});
    }
    showFeedback(`Link für ${invitation.name} kopiert`);
  }

  function handleConfirm(invitation: Invitation) {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case "remind":
        updateInvitation(invitation.id, {
          lastReminder: "Heute",
          history: [...invitation.history, { message: "Erinnerung gesendet.", timestamp: "Heute" }],
        });
        break;
      case "resend":
        updateInvitation(invitation.id, {
          status: "Offen",
          history: [
            ...invitation.history,
            { message: "Einladung erneut gesendet.", timestamp: "Heute" },
          ],
        });
        break;
      case "revoke":
        updateInvitation(invitation.id, {
          status: "Widerrufen",
          history: [...invitation.history, { message: "Einladung widerrufen.", timestamp: "Heute" }],
        });
        break;
      case "delete":
        removeInvitation(invitation.id);
        setDetailInvitation(null);
        break;
    }

    setConfirmAction(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Einladungen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte offene, angenommene und widerrufene Einladungen.
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Einladung erstellen
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Mail} label="Einladungen gesamt" value={totalCount} />
        <StatCard icon={Clock} label="Offen" value={openCount} tone="warning" />
        <StatCard icon={Check} label="Angenommen" value={acceptedCount} tone="success" />
        <StatCard icon={ShieldCheck} label="Abgelaufen" value={expiredCount} />
        <StatCard icon={XCircle} label="Widerrufen" value={revokedCount} tone="danger" />
      </div>

      <InvitationFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      <InvitationTable
        invitations={filteredInvitations}
        onResetFilters={resetFilters}
        onViewDetails={setDetailInvitation}
        onCopyLink={handleCopyLink}
        onSendReminder={(invitation) => setConfirmAction({ invitation, type: "remind" })}
        onResend={(invitation) => setConfirmAction({ invitation, type: "resend" })}
        onRevoke={(invitation) => setConfirmAction({ invitation, type: "revoke" })}
        onDelete={(invitation) => setConfirmAction({ invitation, type: "delete" })}
      />

      <InvitationDetailDrawer
        invitation={detailInvitation}
        onOpenChange={(open) => !open && setDetailInvitation(null)}
        onCopyLink={handleCopyLink}
        onSendReminder={(invitation) => setConfirmAction({ invitation, type: "remind" })}
        onResend={(invitation) => setConfirmAction({ invitation, type: "resend" })}
        onRevoke={(invitation) => setConfirmAction({ invitation, type: "revoke" })}
        onDelete={(invitation) => setConfirmAction({ invitation, type: "delete" })}
      />

      <InviteEmployeeDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Einladung erstellen"
        description="Erstelle eine neue Einladung für PrüfCheckPro. Noch keine echte Speicherung – reine UI-Vorschau."
      />

      <ConfirmActionDialog
        subject={confirmAction?.invitation ?? null}
        title={confirmAction ? confirmConfigs[confirmAction.type].title : ""}
        description={confirmAction ? confirmConfigs[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmConfigs[confirmAction.type].confirmLabel : ""}
        confirmVariant={confirmAction ? confirmConfigs[confirmAction.type].confirmVariant : "default"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirm}
      />

      <FeedbackToast message={copyFeedback} />
    </div>
  );
}
