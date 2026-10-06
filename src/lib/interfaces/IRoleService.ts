import type { RoleChanges, RoleFormValues } from "@/lib/roles/roleRules";
import type { PermissionCategoryDef, Role } from "@/types/role";

// Eingabe für neue (benutzerdefinierte) Rollen. Typ, Status und Zeitstempel
// setzt der Service.
export type NewRoleInput = RoleFormValues;

// Promise-basiert. Mutationen liefern das bestätigte Ergebnis zurück.
//
// Bewusst KEIN Hard-Delete: Rollen können von Mitarbeitern und Einladungen
// referenziert werden. Statt Löschen gibt es Archivieren (deactivateRole) und
// Reaktivieren. Rollen und Berechtigungen sind Verwaltungsdaten – keine
// serverseitige Durchsetzung, keine Custom Claims.
export interface IRoleService {
  getRoles(): Promise<Role[]>;
  getRoleById(id: string): Promise<Role | undefined>;
  // Legt immer eine benutzerdefinierte, aktive Rolle an. Wirft RoleRuleError
  // (z. B. doppelter Name).
  createRole(input: NewRoleInput): Promise<Role>;
  // Systemrollen: nur Berechtigungen (nicht beim Administrator).
  // Benutzerdefiniert: Name, Beschreibung, Farbe, Berechtigungen.
  updateRole(id: string, changes: RoleChanges): Promise<Role | undefined>;
  // Setzt den Status "Archiviert" (nicht für Systemrollen).
  deactivateRole(id: string): Promise<Role | undefined>;
  reactivateRole(id: string): Promise<Role | undefined>;
  // Statische Produktkonfiguration (Berechtigungs-Taxonomie), kein Firestore.
  getPermissionCategories(): PermissionCategoryDef[];
  getAllPermissionKeys(): string[];
  buildPermissions(granted: string[]): Record<string, boolean>;
}
