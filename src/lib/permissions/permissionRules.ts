// Effektive Berechtigungen des eingeloggten Users (rein funktional, ohne React
// und Firebase). UI-Gating ist Komfort/UX – die Sicherheitsgrenze sind die
// Firestore Security Rules.
//
// Die Auflösung folgt EXAKT derselben Kette wie die Rules (hasPermission):
//   Membership (aktiv, companyId)  ->  membership.roleId
//   ->  companies/{companyId}/roles/{roleId}  (status "Aktiv")
//   ->  role.permissions[key] === true
//
// NICHT verwendet werden users/{uid}.role, der Snapshot membership.role sowie
// Employee.role/Employee.roleId (Mitarbeiter-Rollen sind aktuell nur Verwaltungs-
// und Anzeigedaten und nicht mit der Membership synchronisiert).
import { allPermissionKeys, buildPermissions } from "@/config/roles";
import { normalizePermissions } from "@/lib/roles/roleRules";
import { evaluateMembership } from "@/lib/security/membershipRules";
import type { Role } from "@/types/role";
import type { UserMembership } from "@/types/userMembership";

// Warum es (noch) keine Rechte gibt. `null` = Rechte wurden aus einer aktiven
// Rolle aufgelöst.
export type PermissionDenyReason =
  | "membership-missing"
  | "membership-blocked"
  | "membership-invalid"
  | "no-role-id"
  | "role-missing"
  | "role-inactive";

export interface EffectivePermissions {
  // Immer alle 45 bekannten Schlüssel mit explizitem true/false.
  permissions: Record<string, boolean>;
  roleId: string | undefined;
  role: Role | undefined;
  reason: PermissionDenyReason | null;
}

// Fail-closed: kein Schlüssel gewährt.
export function emptyPermissions(): Record<string, boolean> {
  return normalizePermissions({});
}

// NUR Mock-/Demo-Modus (NEXT_PUBLIC_DATA_SOURCE != firestore): dort gibt es keine
// Anmeldung und keine Rolle, die App läuft auf Mock-Daten. Im Firestore-Modus
// wird dies nie verwendet (kein Admin-/Demo-Fallback).
export function demoPermissions(): Record<string, boolean> {
  return buildPermissions(allPermissionKeys);
}

function denied(reason: PermissionDenyReason, extra: Partial<EffectivePermissions> = {}): EffectivePermissions {
  return { permissions: emptyPermissions(), roleId: undefined, role: undefined, reason, ...extra };
}

// membership: das Membership-Dokument des Users (undefined = existiert nicht).
// role: das Rollen-Dokument zu membership.roleId (undefined/null = existiert nicht).
export function resolveEffectivePermissions(input: {
  membership: UserMembership | undefined;
  role: Role | null | undefined;
}): EffectivePermissions {
  const evaluation = evaluateMembership(input.membership);
  if (evaluation.state === "missing") return denied("membership-missing");
  if (evaluation.state === "blocked") return denied("membership-blocked");
  if (evaluation.state === "invalid") return denied("membership-invalid");

  const roleId = evaluation.membership.roleId;
  if (typeof roleId !== "string" || roleId.trim() === "") return denied("no-role-id");

  // Das Rollen-Dokument muss genau zu dieser roleId gehören.
  const role = input.role && input.role.id === roleId ? input.role : undefined;
  if (!role) return denied("role-missing", { roleId });
  if (role.status !== "Aktiv") return denied("role-inactive", { roleId, role });

  // Nur bekannte Schlüssel, nur exakt true gewährt; Unbekanntes wird ignoriert.
  return { permissions: normalizePermissions(role.permissions), roleId, role, reason: null };
}

export function hasPermission(permissions: Record<string, boolean>, key: string): boolean {
  return permissions[key] === true;
}

export function hasAnyPermission(permissions: Record<string, boolean>, keys: readonly string[]): boolean {
  return keys.some((key) => hasPermission(permissions, key));
}

export function hasAllPermissions(permissions: Record<string, boolean>, keys: readonly string[]): boolean {
  return keys.every((key) => hasPermission(permissions, key));
}
