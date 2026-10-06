// Gemeinsame Regeln für Rollen (rein funktional, ohne React und Firebase).
// Mock und Firestore nutzen dieselben Funktionen.
//
// Rollen und Berechtigungen sind Verwaltungsdaten: Sie steuern Darstellung
// und Verwaltungslogik, aber NICHT die serverseitige Zugriffskontrolle (keine
// Rules-Auswertung, keine Custom Claims, kein Admin SDK).
import { allPermissionKeys, permissionCategories } from "@/config/roles";
import type { PermissionCategoryDef, Role, RoleColor } from "@/types/role";

// Stabile ID der Administrator-Rolle. Ihre Berechtigungen sind festgeschrieben.
export const ADMIN_ROLE_ID = "admin";

// Altdaten: Mitarbeiter/Einladungen vor der Rollen-Anbindung tragen nur den
// Rollennamen ("Admin" statt "Administrator"). Alle anderen Altnamen sind
// identisch mit dem Rollennamen und brauchen keinen Alias.
export const LEGACY_ROLE_ALIASES: Record<string, string> = {
  Admin: ADMIN_ROLE_ID,
};

// Wird geworfen, wenn eine fachliche Regel das Speichern blockiert. Die
// Meldung ist für die Anzeige gedacht.
export class RoleRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoleRuleError";
  }
}

// Alles, was der Dialog liefert. Typ, Status und Zeitstempel setzt der Service.
export interface RoleFormValues {
  name: string;
  description: string;
  color: RoleColor;
  permissions: Record<string, boolean>;
}

// Felder, die sich über updateRole ändern lassen (nie type/status/id).
export type RoleChanges = Partial<RoleFormValues>;

export function isSystemRole(role: Pick<Role, "type">): boolean {
  return role.type === "System";
}

// Der Administrator behält immer alle Rechte (kein Aussperren-Szenario durch
// versehentliches Abwählen).
export function arePermissionsEditable(role: Pick<Role, "id" | "type">): boolean {
  return !(isSystemRole(role) && role.id === ADMIN_ROLE_ID);
}

// Systemrollen werden nie archiviert, nur benutzerdefinierte Rollen.
export function isRoleArchivable(role: Pick<Role, "type">): boolean {
  return !isSystemRole(role);
}

export function isRoleActive(role: Pick<Role, "status">): boolean {
  return role.status === "Aktiv";
}

// Nur bekannte Berechtigungs-Schlüssel, jeder mit explizitem true/false.
// Unbekannte (z. B. entfernte) Schlüssel fallen weg, fehlende gelten als false.
export function normalizePermissions(raw: Record<string, boolean> | undefined): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const key of allPermissionKeys) {
    result[key] = raw?.[key] === true;
  }
  return result;
}

// Eingehende Datensätze (Firestore/Mock) auf ein konsistentes Modell bringen.
export function normalizeRole(role: Role): Role {
  return { ...role, permissions: normalizePermissions(role.permissions) };
}

// System zuerst (in stabiler Reihenfolge der Basisrollen), danach
// benutzerdefinierte Rollen nach Erstellung aufsteigend, dann nach Name.
const SYSTEM_ORDER = ["admin", "laborleiter", "pruefer", "azubi", "gast"];

export function sortRoles(roles: Role[]): Role[] {
  return [...roles].sort((a, b) => {
    if (a.type !== b.type) return a.type === "System" ? -1 : 1;
    if (a.type === "System") {
      const rank = (role: Role) => {
        const index = SYSTEM_ORDER.indexOf(role.id);
        return index === -1 ? SYSTEM_ORDER.length : index;
      };
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
    }
    const byCreated = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    return byCreated !== 0 ? byCreated : a.name.localeCompare(b.name, "de");
  });
}

export function normalizeRoleName(name: string): string {
  return name.trim().toLowerCase();
}

// Rollennamen sind eindeutig (ohne Groß-/Kleinschreibung, über ALLE Rollen
// inkl. Systemrollen und archivierter). Einfacher Prüfschritt vor dem
// Schreiben, nicht atomar: zwei gleichzeitige Anfragen aus verschiedenen
// Sitzungen könnten beide bestehen (siehe Doku).
export function assertRoleNameAvailable(name: string, roles: Role[], ignoreId?: string): void {
  const target = normalizeRoleName(name);
  if (target === "") {
    throw new RoleRuleError("Bitte einen Rollennamen angeben.");
  }
  const taken = roles.some((role) => role.id !== ignoreId && normalizeRoleName(role.name) === target);
  if (taken) {
    throw new RoleRuleError("Eine Rolle mit diesem Namen existiert bereits.");
  }
}

// Welche Änderungen sind für diese Rolle erlaubt?
//  - Systemrolle: nur Berechtigungen (Name, Beschreibung, Farbe sind fest);
//    beim Administrator auch die nicht.
//  - Benutzerdefiniert: Name, Beschreibung, Farbe und Berechtigungen.
// Wird in Facade UND Firestore-Transaktion mit dem gelesenen Datensatz geprüft.
export function assertRoleChangeAllowed(current: Pick<Role, "id" | "type" | "name">, changes: RoleChanges): void {
  if (isSystemRole(current)) {
    if (changes.name !== undefined && changes.name.trim() !== current.name) {
      throw new RoleRuleError("Der Name einer Systemrolle kann nicht geändert werden.");
    }
    if (changes.description !== undefined || changes.color !== undefined) {
      throw new RoleRuleError("Beschreibung und Farbe einer Systemrolle können nicht geändert werden.");
    }
    if (changes.permissions !== undefined && !arePermissionsEditable(current)) {
      throw new RoleRuleError("Die Berechtigungen der Administrator-Rolle können nicht geändert werden.");
    }
  }
}

export function assertRoleArchivable(role: Pick<Role, "type">): void {
  if (!isRoleArchivable(role)) {
    throw new RoleRuleError("Systemrollen können nicht archiviert werden.");
  }
}

// --- Zuordnung Mitarbeiter/Einladung -> Rolle --------------------------------

export interface RoleRef {
  roleId?: string;
  role: string;
}

// Löst die Rolle eines Mitarbeiters/einer Einladung auf:
// 1. roleId (stabile Beziehung), 2. exakter Rollenname (Altdaten),
// 3. Legacy-Alias ("Admin"). Nichts davon wird zurückgeschrieben – Altdaten
// werden angezeigt, nicht still überschrieben.
export function resolveRole(ref: RoleRef, roles: Role[]): Role | undefined {
  if (ref.roleId) {
    const byId = roles.find((role) => role.id === ref.roleId);
    if (byId) return byId;
  }
  const byName = roles.find((role) => role.name === ref.role);
  if (byName) return byName;
  const aliasId = LEGACY_ROLE_ALIASES[ref.role];
  return aliasId ? roles.find((role) => role.id === aliasId) : undefined;
}

// Aktueller Rollenname, falls die Rolle auflösbar ist, sonst der gespeicherte
// Snapshot (z. B. solange Rollen laden oder bei unbekannter Rolle).
export function getRoleDisplayName(ref: RoleRef, roles: Role[]): string {
  return resolveRole(ref, roles)?.name ?? ref.role;
}

// Benutzer je Rolle, abgeleitet aus den Mitarbeitern (nicht gespeichert).
// Gezählt werden alle Mitarbeiter, deren Rolle auflösbar ist.
export function countRoleUsers(roles: Role[], assignees: RoleRef[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const role of roles) counts[role.id] = 0;
  for (const assignee of assignees) {
    const role = resolveRole(assignee, roles);
    if (role) counts[role.id] += 1;
  }
  return counts;
}

// --- Anzeige -------------------------------------------------------------------

export interface PermissionGroupSummary {
  key: string;
  label: string;
  granted: number;
  total: number;
}

// Pro Modul: wie viele Berechtigungen sind gewährt?
export function summarizePermissions(permissions: Record<string, boolean>): PermissionGroupSummary[] {
  return permissionCategories.map((category) => ({
    key: category.key,
    label: category.label,
    granted: category.permissions.filter((permission) => permissions[permission.key] === true).length,
    total: category.permissions.length,
  }));
}

export function countGrantedPermissions(permissions: Record<string, boolean>): number {
  return allPermissionKeys.filter((key) => permissions[key] === true).length;
}

export function formatIsoDateTimeDE(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

// Suche in der Berechtigungsliste (Drawer und Dialog): Treffer im Modulnamen
// oder im Berechtigungstext; Module ohne Treffer fallen weg.
export function filterPermissionCategories(query: string): PermissionCategoryDef[] {
  const term = query.trim().toLowerCase();
  if (term.length === 0) return permissionCategories;
  return permissionCategories
    .map((category) => ({
      ...category,
      permissions: category.permissions.filter(
        (permission) =>
          permission.label.toLowerCase().includes(term) || category.label.toLowerCase().includes(term)
      ),
    }))
    .filter((category) => category.permissions.length > 0);
}
