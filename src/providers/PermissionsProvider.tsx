"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isFirestoreDataSource } from "@/config/dataSource";
import { firestoreRoleService } from "@/lib/firebase/services/firestoreRoleService";
import { watchMembership } from "@/lib/firebase/services/firestoreUserMembershipService";
import {
  demoPermissions,
  emptyPermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  resolveEffectivePermissions,
  type PermissionDenyReason,
} from "@/lib/permissions/permissionRules";
import { evaluateMembership } from "@/lib/security/membershipRules";
import { useAuth } from "@/providers/AuthProvider";
import type { Role } from "@/types/role";
import type { UserMembership } from "@/types/userMembership";

// Effektive Berechtigungen des eingeloggten Users – EINMAL pro Sitzung geladen
// und für die ganze App bereitgestellt (kein Role-Fetch pro Button/Ansicht).
//
// Quelle (identisch zu den Firestore Rules):
//   userMemberships/{uid}  (live)  ->  roleId
//   ->  companies/{companyId}/roles/{roleId}  (live, eigene Rolle ist immer lesbar)
//   ->  role.permissions  (nur bekannte Schlüssel, nur exakt true)
// NICHT verwendet: users/{uid}.role, membership.role, Employee.role/roleId.
//
// Fail-closed: Solange etwas lädt oder fehlt, gibt es keine Rechte. Es gibt
// keinen Admin-Fallback. Ändern sich Membership (roleId/status) oder Rolle
// (status/permissions), aktualisiert sich der State live (Snapshot-Listener).
//
// UI-Gating ist Komfort/UX, KEINE Sicherheit: Die Rules bleiben die Grenze.
//
// Mock-/Demo-Modus (NEXT_PUBLIC_DATA_SOURCE != firestore): Es gibt keine
// Anmeldung/Rolle und die App läuft auf Mock-Daten; dort sind alle Rechte
// gewährt (isDemo = true). Das gilt NIE im Firestore-Modus.
export interface PermissionsContextValue {
  // Immer alle 45 bekannten Schlüssel mit explizitem true/false.
  permissions: Record<string, boolean>;
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: readonly string[]) => boolean;
  hasAllPermissions: (keys: readonly string[]) => boolean;
  // true, bis Membership UND Rolle bekannt sind.
  loading: boolean;
  // Unerwarteter Ladefehler (z. B. Netzwerk, permission-denied auf eigene Rolle).
  // Die Rechte sind dann leer (fail-closed); der Fehler wird nicht verschluckt.
  error: string | null;
  // Warum es keine Rechte gibt (null = aus aktiver Rolle aufgelöst).
  reason: PermissionDenyReason | null;
  roleId: string | undefined;
  role: Role | undefined;
  // Mock-/Demo-Modus: alle Rechte ohne Rolle.
  isDemo: boolean;
  // Listener nach einem Fehler neu aufbauen.
  retry: () => void;
}

const LOADING_VALUE: PermissionsContextValue = {
  permissions: emptyPermissions(),
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: (keys) => keys.length === 0,
  loading: true,
  error: null,
  reason: null,
  roleId: undefined,
  role: undefined,
  isDemo: false,
  retry: () => {},
};

const PermissionsContext = createContext<PermissionsContextValue>(LOADING_VALUE);

// Ergebnis eines Listeners, dem Schlüssel zugeordnet, für den er gilt (so gibt es
// kein synchrones Zurücksetzen im Effect und kein Anzeigen veralteter Daten).
interface Live<T> {
  key: string;
  value?: T;
  failed?: boolean;
}

function buildValue(
  permissions: Record<string, boolean>,
  extra: Partial<PermissionsContextValue>,
  retry: () => void
): PermissionsContextValue {
  return {
    permissions,
    hasPermission: (key) => hasPermission(permissions, key),
    hasAnyPermission: (keys) => hasAnyPermission(permissions, keys),
    hasAllPermissions: (keys) => hasAllPermissions(permissions, keys),
    loading: false,
    error: null,
    reason: null,
    roleId: undefined,
    role: undefined,
    isDemo: false,
    retry,
    ...extra,
  };
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { currentUser, membership: authMembership } = useAuth();
  const uid = currentUser?.uid ?? null;
  const [nonce, setNonce] = useState(0);
  const retry = useCallback(() => setNonce((value) => value + 1), []);

  // Nur im Firestore-Modus, nur mit gültiger Membership (das Gate sorgt dafür).
  const listening = isFirestoreDataSource && uid !== null && authMembership.status === "valid";

  const [membershipLive, setMembershipLive] = useState<Live<UserMembership | undefined> | null>(null);
  useEffect(() => {
    if (!listening || !uid) return;
    const key = `${uid}#${nonce}`;
    return watchMembership(
      uid,
      (membership) => setMembershipLive({ key, value: membership }),
      () => setMembershipLive({ key, failed: true })
    );
  }, [listening, uid, nonce]);

  const membershipKey = uid ? `${uid}#${nonce}` : "";
  const currentMembershipLive = listening && membershipLive?.key === membershipKey ? membershipLive : null;
  const evaluation =
    currentMembershipLive && !currentMembershipLive.failed ? evaluateMembership(currentMembershipLive.value) : null;
  const companyId = evaluation?.state === "valid" ? evaluation.membership.companyId : null;
  const rawRoleId = evaluation?.state === "valid" ? evaluation.membership.roleId : undefined;
  const roleId = typeof rawRoleId === "string" && rawRoleId.trim() !== "" ? rawRoleId : null;

  const [roleLive, setRoleLive] = useState<Live<Role | undefined> | null>(null);
  useEffect(() => {
    if (!companyId || !roleId) return;
    const key = `${companyId}/${roleId}#${nonce}`;
    return firestoreRoleService.watchRoleById(
      companyId,
      roleId,
      (role) => setRoleLive({ key, value: role }),
      () => setRoleLive({ key, failed: true })
    );
  }, [companyId, roleId, nonce]);

  const roleKey = companyId && roleId ? `${companyId}/${roleId}#${nonce}` : "";
  const currentRoleLive = roleKey && roleLive?.key === roleKey ? roleLive : null;

  const value = useMemo<PermissionsContextValue>(() => {
    if (!isFirestoreDataSource) return buildValue(demoPermissions(), { isDemo: true }, retry);

    // Anmeldung/Membership noch nicht bekannt.
    if (authMembership.status === "idle" || authMembership.status === "loading") return { ...LOADING_VALUE, retry };
    // Nicht angemeldet oder Membership fehlt/gesperrt/ungültig/Fehler: keine Rechte
    // (das MembershipGate zeigt dem User den Grund).
    if (!listening) return buildValue(emptyPermissions(), { reason: "membership-missing" }, retry);

    if (!currentMembershipLive) return { ...LOADING_VALUE, retry };
    if (currentMembershipLive.failed) {
      return buildValue(emptyPermissions(), { error: "Berechtigungen konnten nicht geladen werden." }, retry);
    }

    // Live-Membership ungültig/gesperrt (kann sich nach dem Laden geändert haben).
    if (!companyId) {
      const resolved = resolveEffectivePermissions({ membership: currentMembershipLive.value, role: undefined });
      return buildValue(resolved.permissions, { reason: resolved.reason }, retry);
    }
    // Aktive Membership ohne roleId: keine Rechte (kein Admin-Fallback).
    if (!roleId) {
      const resolved = resolveEffectivePermissions({ membership: currentMembershipLive.value, role: undefined });
      return buildValue(resolved.permissions, { reason: resolved.reason }, retry);
    }

    if (!currentRoleLive) return { ...LOADING_VALUE, retry };
    if (currentRoleLive.failed) {
      return buildValue(emptyPermissions(), { error: "Berechtigungen konnten nicht geladen werden.", roleId }, retry);
    }

    const resolved = resolveEffectivePermissions({ membership: currentMembershipLive.value, role: currentRoleLive.value });
    return buildValue(resolved.permissions, { reason: resolved.reason, roleId: resolved.roleId, role: resolved.role }, retry);
  }, [authMembership.status, listening, currentMembershipLive, companyId, roleId, currentRoleLive, retry]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
