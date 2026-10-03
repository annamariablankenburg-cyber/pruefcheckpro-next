"use client";

import { useState } from "react";
import { AlertTriangle, Check, Clock, Info, Mail, Plus, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { InvitationDetailDrawer } from "@/components/shared/InvitationDetailDrawer";
import { InvitationFilters } from "@/components/shared/InvitationFilters";
import { InvitationRevokeDialog } from "@/components/shared/InvitationRevokeDialog";
import { InvitationTable } from "@/components/shared/InvitationTable";
import { StatCard } from "@/components/shared/StatCard";
import type { InvitationsData } from "@/hooks/useInvitations";
import type { InvitationRow } from "@/types/invitation";

interface InvitationsViewProps {
  // Gemeinsame Einladungsdaten der Company-Seite (derselbe State wie im
  // Einladungsdialog – keine zweite Quelle).
  invitationsData: InvitationsData;
  // Öffnet den Einladungsdialog der Company-Seite.
  onInvite: () => void;
}

// Einladungen sind Metadatensätze: Widerrufen ist echt, E-Mail-Aktionen
// (Erinnerung, erneut senden) sind noch nicht angebunden und lösen nur einen
// Hinweis aus. Es gibt weder Löschen noch einen Einladungslink noch eine
// Möglichkeit, eine Einladung als "angenommen" zu markieren.
export function InvitationsView({ invitationsData, onInvite }: InvitationsViewProps) {
  const {
    invitations,
    filteredInvitations,
    loading,
    error,
    referenceDate,
    refreshInvitations,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    revokeInvitation,
  } = invitationsData;
  // Auswahl als ID: Drawer/Dialog zeigen immer den aktuellen Datensatz.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const detailInvitation = invitations.find((invitation) => invitation.id === detailId) ?? null;
  const revokeTarget = invitations.find((invitation) => invitation.id === revokeId) ?? null;
  // Ohne Bezugsdatum lässt sich der Ablaufstatus nicht ableiten – lieber warten
  // als falsche Zahlen zeigen.
  const isPreparing = loading || referenceDate === null;

  const countBy = (status: InvitationRow["displayStatus"]) =>
    invitations.filter((invitation) => invitation.displayStatus === status).length;

  function handleSendReminder() {
    showFeedback("Erinnerungen werden später serverseitig angebunden. Es wurde nichts gesendet.");
  }

  function handleResend() {
    showFeedback("Erneutes Senden wird später serverseitig angebunden. Es wurde nichts gesendet.");
  }

  async function handleRevokeConfirm(invitation: InvitationRow) {
    const updated = await revokeInvitation(invitation.id);
    if (!updated) throw new Error("Einladung nicht gefunden.");
    showFeedback("Einladung widerrufen.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Einladungen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte ausstehende, angenommene, widerrufene und abgelaufene Einladungen.
          </p>
        </div>
        <Button type="button" onClick={onInvite}>
          <Plus className="size-4" />
          Einladung erstellen
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
        <Info className="mt-0.5 size-4 shrink-0" />
        Einladungen werden als Datensätze gespeichert. E-Mail-Versand, Einladungslink und Annahme folgen
        später serverseitig – bis dahin erhält niemand eine Nachricht und es wird kein Konto angelegt.
      </div>

      {isPreparing ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="skeleton h-[104px]" />
            ))}
          </div>
          <Card className="skeleton skeleton-rows h-72" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={refreshInvitations}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Mail} label="Einladungen gesamt" value={invitations.length} />
            <StatCard icon={Clock} label="Ausstehend" value={countBy("Ausstehend")} tone="warning" />
            <StatCard icon={Check} label="Angenommen" value={countBy("Angenommen")} tone="success" />
            <StatCard icon={ShieldCheck} label="Abgelaufen" value={countBy("Abgelaufen")} />
            <StatCard icon={XCircle} label="Widerrufen" value={countBy("Widerrufen")} tone="danger" />
          </div>

          <InvitationFilters
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
          />

          {invitations.length === 0 ? (
            <Card variant="flat" className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-(--elev-2) ring-1 ring-foreground/10">
                  <Mail className="size-5" />
                </div>
                <p className="section-title">Noch keine Einladungen</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Erstelle eine Einladung, um sie mit Rolle und Standort vorzumerken.
                </p>
                <Button type="button" size="sm" onClick={onInvite}>
                  <Plus className="size-4" />
                  Einladung erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <InvitationTable
              invitations={filteredInvitations}
              onResetFilters={resetFilters}
              onViewDetails={(invitation) => setDetailId(invitation.id)}
              onSendReminder={handleSendReminder}
              onResend={handleResend}
              onRevoke={(invitation) => setRevokeId(invitation.id)}
            />
          )}
        </>
      )}

      <InvitationDetailDrawer
        invitation={detailInvitation}
        onOpenChange={(open) => !open && setDetailId(null)}
        onSendReminder={handleSendReminder}
        onResend={handleResend}
        onRevoke={(invitation) => setRevokeId(invitation.id)}
      />

      <InvitationRevokeDialog
        invitation={revokeTarget}
        onOpenChange={(open) => !open && setRevokeId(null)}
        onConfirm={handleRevokeConfirm}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
