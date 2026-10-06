"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { isRoleActive, sortRoles, type RoleChanges, type RoleFormValues } from "@/lib/roles/roleRules";
import { roleService } from "@/lib/services/roleService";
import type { Role } from "@/types/role";

// Lädt Rollen über roleService (Mock oder Firestore) und hält sie als lokalen
// State. Lokaler State ändert sich erst nach einem bestätigten Service-Ergebnis
// (keine optimistischen Updates). Fehler (auch RoleRuleError) werden NICHT
// verschluckt, sondern an die UI weitergereicht.
//
// Rollen sind Verwaltungsdaten: kein Löschen (nur Archivieren) und keine
// serverseitige Durchsetzung. Eine einzige Instanz lebt auf der Company-Seite
// und versorgt Rollen-Tab, Mitarbeiter-Tab, Einladungs-Tab und Dialoge.
// `enabled` (Standard true): Nur wenn der User die Collection lesen darf, wird
// geladen. Ist es false, wird NICHT abgefragt (kein erwarteter permission-denied),
// und der Hook liefert leere Daten ohne Ladezustand/Fehler. Das ist UI-Gating
// (Komfort); die Firestore Rules bleiben die Sicherheitsgrenze.
export function useRoles(enabled = true) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoles(sortRoles(await roleService.getRoles()));
    } catch {
      setError("Rollen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Lädt die Rollen beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshRoles();
  }, [enabled, refreshRoles]);

  // Ohne Leserecht (enabled = false): leere Daten, nichts wurde abgefragt.
  const visibleRoles = useMemo(() => (enabled ? roles : []), [enabled, roles]);

  // Nur aktive (nicht archivierte) Rollen sind für neue Zuweisungen wählbar.
  const activeRoles = useMemo(() => visibleRoles.filter(isRoleActive), [visibleRoles]);

  function replaceRole(updated: Role | undefined) {
    if (!updated) return;
    setRoles((current) => sortRoles(current.map((role) => (role.id === updated.id ? updated : role))));
  }

  async function createRole(values: RoleFormValues): Promise<Role> {
    const created = await roleService.createRole(values);
    setRoles((current) => sortRoles([...current, created]));
    return created;
  }

  async function updateRole(id: string, changes: RoleChanges): Promise<Role | undefined> {
    const updated = await roleService.updateRole(id, changes);
    replaceRole(updated);
    return updated;
  }

  async function deactivateRole(id: string): Promise<Role | undefined> {
    const updated = await roleService.deactivateRole(id);
    replaceRole(updated);
    return updated;
  }

  async function reactivateRole(id: string): Promise<Role | undefined> {
    const updated = await roleService.reactivateRole(id);
    replaceRole(updated);
    return updated;
  }

  return {
    roles: visibleRoles,
    activeRoles,
    enabled,
    loading: enabled && loading,
    error: enabled ? error : null,
    refreshRoles,
    createRole,
    updateRole,
    deactivateRole,
    reactivateRole,
  };
}

// Gemeinsame Instanz für Rollen-Tab, Mitarbeiter-Tab und Einladungsdialog.
export type RolesData = ReturnType<typeof useRoles>;
