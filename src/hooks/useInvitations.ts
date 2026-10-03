"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { INVITATION_DEMO_TODAY } from "@/config/invitations";
import { useReferenceDate } from "@/hooks/shared/useReferenceDate";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { InvitationFilter } from "@/components/shared/InvitationFilters";
import {
  computeExpiresAt,
  normalizeEmail,
  sortInvitations,
  toInvitationRows,
  type InvitationFormValues,
} from "@/lib/invitations/invitationRules";
import type { NewInvitationInput } from "@/lib/interfaces/IInvitationService";
import { invitationService } from "@/lib/services/invitationService";
import type { Invitation } from "@/types/invitation";

// Lädt Einladungen über invitationService (Mock oder Firestore) und hält sie
// als lokalen State. Lokaler State ändert sich erst nach einem bestätigten
// Service-Ergebnis (keine optimistischen Updates). Fehler (auch
// InvitationRuleError) werden NICHT verschluckt, sondern an die UI
// weitergereicht.
//
// Eine Einladung ist ein reiner Metadatensatz: kein E-Mail-Versand, kein Auth-
// Account, kein Löschen, kein "als angenommen markieren".
export function useInvitations() {
  const [records, setRecords] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bezugszeit für den abgeleiteten Ablaufstatus: Mock = Demo-Datum der
  // Mockdaten, Firestore = echtes Datum (erst nach dem Mount gesetzt).
  const referenceDate = useReferenceDate(INVITATION_DEMO_TODAY);

  const refreshInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invitationService.getInvitations();
      setRecords(sortInvitations(data));
    } catch {
      setError("Einladungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lädt die Einladungen beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshInvitations();
  }, [refreshInvitations]);

  // Einladungen samt abgeleitetem Anzeigestatus ("Abgelaufen" entsteht hier aus
  // expiresAt, nicht aus gespeicherten Daten). Solange das Bezugsdatum fehlt,
  // gibt es keine Zeilen – so erscheinen keine falschen Statuswerte.
  const invitations = useMemo(
    () => (referenceDate ? toInvitationRows(records, referenceDate) : []),
    [records, referenceDate]
  );

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredInvitations,
    resetFilters,
  } = useSearchAndFilter(invitations, {
    defaultFilter: "Alle" as InvitationFilter,
    matchesFilter: (invitation, filterValue) =>
      filterValue === invitation.displayStatus || filterValue === invitation.role,
    matchesSearch: (invitation, query) =>
      invitation.name.toLowerCase().includes(query) ||
      invitation.email.toLowerCase().includes(query) ||
      invitation.role.toLowerCase().includes(query) ||
      invitation.location.toLowerCase().includes(query),
  });

  async function createInvitation(values: InvitationFormValues): Promise<Invitation> {
    const input: NewInvitationInput = {
      name: values.name.trim(),
      email: normalizeEmail(values.email),
      role: values.role,
      locationId: values.locationId,
      location: values.location,
      message: values.message?.trim() || undefined,
      activateImmediately: values.activateImmediately,
      // Der Ablaufzeitpunkt wird hier berechnet (nie das Dropdown-Label speichern).
      expiresAt: computeExpiresAt(values.expiresInDays, referenceDate ?? new Date()),
    };
    const created = await invitationService.createInvitation(input);
    setRecords((current) => sortInvitations([created, ...current]));
    return created;
  }

  async function revokeInvitation(id: string): Promise<Invitation | undefined> {
    const updated = await invitationService.revokeInvitation(id);
    if (updated) {
      setRecords((current) => current.map((invitation) => (invitation.id === updated.id ? updated : invitation)));
    }
    return updated;
  }

  return {
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
    createInvitation,
    revokeInvitation,
  };
}

// Gemeinsame Instanz für Einladungen-Tab und Einladungsdialog (ein State).
export type InvitationsData = ReturnType<typeof useInvitations>;
