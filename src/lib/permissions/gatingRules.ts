// UI-Gating-Regeln (rein funktional, ohne React und Firebase). Komfort/UX, keine
// Sicherheit: Die Firestore Rules entscheiden. Das Gating sorgt dafür, dass die
// App nichts abfragt und anbietet, was die Rules ohnehin ablehnen würden.
//
// Abhängigkeiten (Services lesen vor jedem Schreiben in einer Transaktion bzw.
// laden Referenzdaten):
//  - Mitarbeiter verwalten  ⇒ setzt mitarbeiter.ansehen voraus,
//  - Standorte verwalten    ⇒ setzt standorte.ansehen voraus,
//  - Rollen verwalten       ⇒ setzt rollen.ansehen voraus,
//  - Einladen               ⇒ liest zusätzlich Mitarbeiter (Duplikat-Check), Rollen
//                             (Auswahl, Validierung) und Standorte (Auswahl).
import { PROTECTED_ROLE_PERMISSION_KEYS } from "@/config/roles";
import { ADMIN_ROLE_ID } from "@/lib/roles/roleRules";
import { hasAnyPermission, hasPermission } from "@/lib/permissions/permissionRules";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";

export type CompanyTabValue =
  | "uebersicht"
  | "standorte"
  | "mitarbeiter"
  | "einladungen"
  | "rollen"
  | "einstellungen";

export interface CompanyAccess {
  employees: { view: boolean; manage: boolean; changeRole: boolean };
  invitations: {
    // Lesen UND Widerrufen: administration.mitarbeiter_verwalten
    view: boolean;
    manage: boolean;
    // Einladen zusätzlich mit Leserechten für Mitarbeiter, Rollen, Standorte.
    invite: boolean;
    // Fehlende Leserechte, die das Einladen verhindern (leer, wenn invite oder nicht manage).
    inviteMissing: string[];
  };
  locations: { view: boolean; manage: boolean };
  roles: {
    view: boolean;
    manage: boolean;
    // rollen.admin_verwalten: geschützte Rechte vergeben/entziehen, geschützte Rollen zuweisen.
    manageProtected: boolean;
  };
  // Sichtbarkeit der Übersichts-Kacheln/Schnellaktionen.
  quick: { branding: boolean; billing: boolean };
  tabs: Record<CompanyTabValue, boolean>;
}

const OVERVIEW_KEYS = [
  "standorte.ansehen",
  "mitarbeiter.ansehen",
  "rollen.ansehen",
  "administration.mitarbeiter_verwalten",
  "administration.standorte_verwalten",
  "administration.rollen_verwalten",
  "administration.branding_aendern",
  "administration.abrechnung_verwalten",
  "administration.systemeinstellungen_aendern",
] as const;

// Einstellungen-Tab: Firmenstammdaten/Branding/Abrechnung/System – nur mit einem der
// entsprechenden Verwaltungsrechte (alle restricted, d. h. Administrator). Das
// reine Lesen von Standorten genügt dafür nicht.
const SETTINGS_KEYS = [
  "administration.branding_aendern",
  "administration.abrechnung_verwalten",
  "administration.systemeinstellungen_aendern",
] as const;

// Reihenfolge der Tabs auf der Company-Seite.
export const COMPANY_TAB_ORDER: CompanyTabValue[] = [
  "uebersicht",
  "standorte",
  "mitarbeiter",
  "einladungen",
  "rollen",
  "einstellungen",
];

export function getCompanyAccess(permissions: Record<string, boolean>): CompanyAccess {
  const has = (key: string) => hasPermission(permissions, key);

  const viewEmployees = has("mitarbeiter.ansehen");
  const viewLocations = has("standorte.ansehen");
  const viewRoles = has("rollen.ansehen");
  const manageInvitations = has("administration.mitarbeiter_verwalten");

  const inviteMissing: string[] = [];
  if (manageInvitations) {
    if (!viewEmployees) inviteMissing.push("Mitarbeiter");
    if (!viewRoles) inviteMissing.push("Rollen");
    if (!viewLocations) inviteMissing.push("Standorte");
  }

  const access: Omit<CompanyAccess, "tabs"> = {
    employees: {
      view: viewEmployees,
      manage: viewEmployees && has("administration.mitarbeiter_verwalten"),
      changeRole: viewEmployees && has("administration.mitarbeiter_verwalten") && viewRoles,
    },
    invitations: {
      view: manageInvitations,
      manage: manageInvitations,
      invite: manageInvitations && inviteMissing.length === 0,
      inviteMissing,
    },
    locations: { view: viewLocations, manage: viewLocations && has("administration.standorte_verwalten") },
    roles: {
      view: viewRoles,
      manage: viewRoles && has("administration.rollen_verwalten"),
      manageProtected: has("rollen.admin_verwalten"),
    },
    quick: {
      branding: has("administration.branding_aendern"),
      billing: has("administration.abrechnung_verwalten"),
    },
  };

  return {
    ...access,
    tabs: {
      uebersicht: hasAnyPermission(permissions, OVERVIEW_KEYS),
      standorte: access.locations.view,
      mitarbeiter: access.employees.view,
      einladungen: access.invitations.view,
      rollen: access.roles.view,
      einstellungen: hasAnyPermission(permissions, SETTINGS_KEYS),
    },
  };
}

export function getVisibleCompanyTabs(access: CompanyAccess): CompanyTabValue[] {
  return COMPANY_TAB_ORDER.filter((tab) => access.tabs[tab]);
}

// Gewünschter Tab (z. B. aus der URL) oder – wenn nicht erlaubt – der erste
// sichtbare Tab; null, wenn gar kein Tab erlaubt ist. Rein abgeleitet, daher
// keine State-/URL-Schleife.
export function pickActiveTab(requested: string, visible: readonly CompanyTabValue[]): CompanyTabValue | null {
  const match = visible.find((tab) => tab === requested);
  return match ?? visible[0] ?? null;
}

// --- Geschützte Rollen/Rechte (Spiegel der Rules-Policy) -------------------------

// Enthält die Rolle irgendeinen der 7 geschützten Schlüssel (4 Restricted + 3
// Admin-only-Löschrechte)? Die Liste kommt aus der Config, nicht aus der UI.
export function hasProtectedPermission(permissions: Record<string, boolean> | undefined): boolean {
  return PROTECTED_ROLE_PERMISSION_KEYS.some((key) => permissions?.[key] === true);
}

// "Geschützte Rolle" wie in den Rules (roleIdIsProtected): Administrator-Rolle
// oder Rolle mit geschütztem Schlüssel. Zuweisen/Einladen erfordert dafür
// rollen.admin_verwalten.
export function isProtectedRole(role: Pick<Role, "id" | "permissions">): boolean {
  return role.id === ADMIN_ROLE_ID || hasProtectedPermission(role.permissions);
}

// Rollen, die der User zuweisen/einladen darf: mit rollen.admin_verwalten alle,
// sonst nur Rollen ohne geschützte Rechte.
export function filterAssignableRoles<T extends Pick<Role, "id" | "permissions">>(
  roles: T[],
  canManageProtected: boolean
): T[] {
  return canManageProtected ? roles : roles.filter((role) => !isProtectedRole(role));
}

// Setzt alle geschützten Schlüssel auf false (z. B. für Vorlagen/Kopien ohne
// rollen.admin_verwalten). Bekannte andere Schlüssel bleiben unverändert.
export function stripProtectedPermissions(permissions: Record<string, boolean>): Record<string, boolean> {
  const result = { ...permissions };
  for (const key of PROTECTED_ROLE_PERMISSION_KEYS) result[key] = false;
  return result;
}

// --- Mitarbeiter-Aktionen ----------------------------------------------------------

export interface EmployeeActionPolicy {
  canChangeRole: boolean;
  canChangeLocation: boolean;
  // Sperren, Reaktivieren, Zugriff entziehen
  canChangeStatus: boolean;
  // Platzhalter-Aktionen (noch nicht angebunden): nur mit Verwaltungsrecht anbieten
  canResetPassword: boolean;
  canRevokeInvitation: boolean;
  // true, wenn irgendeine Aktion außer „Details“ angeboten wird
  any: boolean;
}

export function getEmployeeActionPolicy(input: {
  access: CompanyAccess;
  employee: Pick<Employee, "id" | "roleId">;
  // membership.employeeId des eingeloggten Users (Verknüpfung, nie über Name/E-Mail).
  ownEmployeeId: string | null | undefined;
  roles: Pick<Role, "id" | "permissions">[];
  // false, wenn die Rollenliste nicht geladen werden darf/konnte (kein rollen.ansehen).
  rolesAvailable: boolean;
}): EmployeeActionPolicy {
  const { access, employee, ownEmployeeId, roles, rolesAvailable } = input;
  const isOwn = Boolean(ownEmployeeId) && employee.id === ownEmployeeId;

  // Wie die Rules: Ziel mit Administrator-/geschützter oder nicht auflösbarer
  // Rolle (auch fehlende roleId) braucht rollen.admin_verwalten. Fail-closed: Lässt
  // sich die Zielrolle nicht sicher auflösen (Rollenliste nicht verfügbar, unbekannte
  // oder fehlende roleId), gilt sie als geschützt – sonst würde die UI Aktionen
  // anbieten, die die Rules mit permission-denied ablehnen.
  let targetProtected = false;
  if (!access.roles.manageProtected) {
    if (!rolesAvailable) {
      targetProtected = true;
    } else {
      const targetRole = employee.roleId ? roles.find((role) => role.id === employee.roleId) : undefined;
      targetProtected = !targetRole || isProtectedRole(targetRole);
    }
  }

  const manageable = access.employees.manage && !targetProtected;
  // Eigene Rolle und eigener Status sind nie änderbar (Self-Promotion/Selbstsperre);
  // der eigene Standort schon.
  const policy = {
    canChangeRole: manageable && access.employees.changeRole && !isOwn,
    // Der Standort-Dialog braucht die Standortliste (standorte.ansehen).
    canChangeLocation: manageable && access.locations.view,
    canChangeStatus: manageable && !isOwn,
    canResetPassword: manageable,
    canRevokeInvitation: manageable,
  };
  return { ...policy, any: Object.values(policy).some(Boolean) };
}
