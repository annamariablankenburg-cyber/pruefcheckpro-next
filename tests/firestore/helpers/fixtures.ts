import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

import { allPermissionKeys, buildPermissions, roles as configRoles } from "../../../src/config/roles";
import { COLLECTIONS, companyCollectionPaths } from "../../../src/lib/firebase/collections";
import type { Role } from "../../../src/types/role";
import { seed } from "./testEnv";

export const COMPANY_A = "company-a";
export const COMPANY_B = "company-b";

// Test-User. Die Namen beschreiben den Zustand der Membership.
export const USERS = {
  activeA: "user-active-a", // Membership: company-a, Aktiv
  activeB: "user-active-b", // Membership: company-b, Aktiv
  blockedA: "user-blocked-a", // Membership: company-a, Gesperrt
  noMembership: "user-no-membership", // authentifiziert, aber ohne Membership-Dokument
} as const;

// Die 12 Company-Collections mit eigenem match-Block in firestore.rules. Die
// Schlüssel müssen in companyCollectionPaths (src/lib/firebase/collections.ts)
// existieren – dort stehen die echten Pfadnamen (z. B. testValues, laborbook).
export const COMPANY_COLLECTIONS = [
  "customers",
  "projects",
  "devices",
  "samples",
  "testValues",
  "reports",
  "calendarEvents",
  "laborbook",
  "locations",
  "employees",
  "invitations",
  "roles",
] as const satisfies readonly (keyof typeof companyCollectionPaths)[];

export type CompanyCollection = (typeof COMPANY_COLLECTIONS)[number];

// Collections mit rollenbasierten Rules, Phase 1 (Verwaltungsdaten) ...
export const PHASE1_COLLECTIONS = ["roles", "employees", "invitations", "locations"] as const;

// ... und Phase 2 (Fach-Collections). Die Zuordnung Operation -> Permission-Schlüssel
// ist die ERWARTUNG der Tests und steht bewusst getrennt von den Rules: rules-config-sync
// prüft, dass beide übereinstimmen und dass jeder Schlüssel in allPermissionKeys existiert.
// Quelle: docs/database/permissions.md (Abschnitt 5) und src/config/roles.ts.
export const PHASE2_PERMISSIONS = {
  customers: { read: "kunden.ansehen", create: "kunden.erstellen", update: "kunden.bearbeiten", delete: "kunden.loeschen" },
  projects: { read: "projekte.ansehen", create: "projekte.erstellen", update: "projekte.bearbeiten", delete: "projekte.loeschen" },
  devices: { read: "geraete.ansehen", create: "geraete.erstellen", update: "geraete.bearbeiten", delete: "geraete.loeschen" },
  samples: { read: "proben.ansehen", create: "proben.erstellen", update: "proben.bearbeiten", delete: "proben.loeschen" },
  testValues: {
    read: "pruefungen.ansehen",
    create: "pruefungen.erstellen",
    update: "pruefungen.bearbeiten",
    delete: "pruefungen.loeschen",
  },
  reports: { read: "berichte.ansehen", create: "berichte.erstellen", update: "berichte.bearbeiten", delete: "berichte.loeschen" },
  calendarEvents: {
    read: "kalender.ansehen",
    create: "kalender.termine_erstellen",
    update: "kalender.bearbeiten",
    delete: "kalender.loeschen",
  },
  laborbook: {
    read: "laborbuch.ansehen",
    create: "laborbuch.erstellen",
    update: "laborbuch.bearbeiten",
    delete: "laborbuch.loeschen",
  },
} as const satisfies Record<string, { read: string; create: string; update: string; delete: string }>;

export type Phase2Collection = keyof typeof PHASE2_PERMISSIONS;
export type Phase2Operation = "read" | "create" | "update" | "delete";
export const PHASE2_COLLECTIONS = Object.keys(PHASE2_PERMISSIONS) as Phase2Collection[];

// Dokumentinhalt für Fach-Collections in den Tests. Mit `sampleId` == Dokument-ID bei
// testValues (die Rules verlangen das beim Anlegen) und Status "Entwurf" bei Berichten.
export function phase2DocData(collection: Phase2Collection, id: string, extra: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = {
    name: `${collection}-${id}`,
    status: collection === "reports" ? "Entwurf" : "Aktiv",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
  if (collection === "testValues") data.sampleId = id;
  return data;
}

export function collectionPath(collection: CompanyCollection, companyId: string): string {
  return companyCollectionPaths[collection](companyId);
}

// Dokument-ID, die in jeder Collection beider Firmen vorab existiert (seedWorld).
export const EXISTING_DOC_ID = "existing";

export function membershipData(companyId: string, status: string) {
  return {
    companyId,
    employeeId: "emp-test",
    // Administrator: die Collection-Tests (Tenant-Isolation, Membership-Defekte) brauchen
    // eine Rolle, die in der eigenen Firma alles darf. Der Name im Snapshot ist ohne Bedeutung.
    roleId: "admin",
    role: "Administrator",
    status,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

export async function seedMembership(env: RulesTestEnvironment, uid: string, data: Record<string, unknown>) {
  await seed(env, async (firestore) => {
    await setDoc(doc(firestore, COLLECTIONS.USER_MEMBERSHIPS, uid), data);
  });
}

// Standard-Welt: drei Memberships (activeA, activeB, blockedA; noMembership hat
// absichtlich keine), die Systemrollen der Konfiguration in beiden Firmen (die
// Memberships zeigen auf "admin") und in beiden Firmen je ein bestehendes Dokument
// in jeder der 12 Collections.
export async function seedWorld(env: RulesTestEnvironment) {
  await seed(env, async (firestore) => {
    for (const companyId of [COMPANY_A, COMPANY_B]) {
      for (const role of configRoles) {
        await setDoc(doc(firestore, companyCollectionPaths.roles(companyId), role.id), configRoleData(role));
      }
    }

    await setDoc(doc(firestore, COLLECTIONS.USER_MEMBERSHIPS, USERS.activeA), membershipData(COMPANY_A, "Aktiv"));
    await setDoc(doc(firestore, COLLECTIONS.USER_MEMBERSHIPS, USERS.activeB), membershipData(COMPANY_B, "Aktiv"));
    await setDoc(doc(firestore, COLLECTIONS.USER_MEMBERSHIPS, USERS.blockedA), membershipData(COMPANY_A, "Gesperrt"));

    for (const companyId of [COMPANY_A, COMPANY_B]) {
      for (const collection of COMPANY_COLLECTIONS) {
        await setDoc(doc(firestore, collectionPath(collection, companyId), EXISTING_DOC_ID), {
          name: `${collection}-${companyId}`,
        });
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Phase 1 (roles, employees, invitations, locations): rollenbasierte Rules.
// ---------------------------------------------------------------------------

// Permission-Map mit ALLEN 45 bekannten Schlüsseln (wie nach der Migration);
// `grant` setzt die gewährten Rechte.
export function permissionMap(grant: readonly string[]): Record<string, boolean> {
  return buildPermissions([...grant]);
}

// Echte Rollen der Konfiguration (Administrator, Laborleiter, Prüfer, Azubi,
// Gast, Qualitätsmanager, Baustellenleiter): getestet wird gegen die tatsächlich
// beschlossene Matrix, nicht gegen eine Testkopie.
function configRoleData(role: Role): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- id ist die Dokument-ID, kein Feld
  const { id, ...data } = role;
  return data;
}

export const BILLING_ROLE = "billing-role"; // Custom Role MIT Restricted-Schlüssel (Abrechnung)
export const ARCHIVED_ROLE = "archived-role"; // alle Rechte, aber status "Archiviert"
export const NO_PERMISSIONS_ROLE = "no-permissions-role"; // Dokument ohne permissions-Feld
export const EMPTY_PERMISSIONS_ROLE = "empty-permissions-role"; // permissions: {}
export const LOCATION_MANAGER_ROLE = "location-manager-role"; // nur standorte_verwalten (ohne ansehen)
export const HR_ROLE = "hr-role"; // mitarbeiter ansehen + verwalten, kein Admin-Schlüssel
export const LEGACY_ADMIN_ROLE = "legacy-admin-role"; // vor der Migration: nur die 31 alten Schlüssel
export const COMPANY_B_ONLY_ROLE = "company-b-only-role"; // existiert nur in company-b
export const DELETER_ROLE = "deleter-role"; // Custom Role (vom Admin angelegt) mit allen Löschrechten
// Je eine Custom Role mit GENAU EINEM Admin-only-Löschrecht (geschützt) und eine mit einem normalen Löschrecht.
export const PROTECTED_DELETE_ROLES: Record<string, string> = {
  "geraete.loeschen": "role-geraete-loeschen",
  "laborbuch.loeschen": "role-laborbuch-loeschen",
  "berichte.loeschen": "role-berichte-loeschen",
};
export const NORMAL_DELETE_ROLE = "role-proben-loeschen"; // proben.loeschen: NICHT geschützt

// Die 14 Schlüssel, die erst durch den Taxonomie-Slice dazukamen.
const NEW_KEYS_SINCE_31 = [
  "geraete.erstellen",
  "geraete.loeschen",
  "kalender.bearbeiten",
  "kalender.loeschen",
  "laborbuch.erstellen",
  "laborbuch.loeschen",
  "berichte.ansehen",
  "berichte.erstellen",
  "berichte.bearbeiten",
  "berichte.loeschen",
  "standorte.ansehen",
  "mitarbeiter.ansehen",
  "rollen.ansehen",
  "rollen.admin_verwalten",
];
// Die 31 Schlüssel vor dem Taxonomie-Slice (exportiert für Legacy-Tests).
export const LEGACY_31_KEYS = allPermissionKeys.filter((key) => !NEW_KEYS_SINCE_31.includes(key));

export function customRoleData(
  name: string,
  permissions: Record<string, boolean>,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    name,
    description: `${name} (Test)`,
    type: "Benutzerdefiniert",
    color: "neutral",
    status: "Aktiv",
    permissions,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

// Personas: jede hat eine Membership mit eigener (oder defekter) Rolle.
export const P = {
  admin: "u-admin",
  admin2: "u-admin-2", // zweiter Administrator (für „Admin ändert anderen Admin“)
  laborleiter: "u-laborleiter",
  pruefer: "u-pruefer",
  azubi: "u-azubi",
  gast: "u-gast",
  baustellenleiter: "u-baustellenleiter", // Custom Role der Config
  hr: "u-hr", // Custom Role: mitarbeiter ansehen+verwalten, kein Admin-Schlüssel
  locationManager: "u-location-manager", // Custom Role: standorte_verwalten ohne ansehen
  legacyAdmin: "u-legacy-admin", // Rolle vor der Migration (31 Schlüssel)
  // defekte Ketten (alle: kein Zugriff)
  noRoleId: "u-no-roleid",
  emptyRoleId: "u-empty-roleid",
  unknownRole: "u-unknown-role",
  archivedRole: "u-archived-role",
  noPermissionsField: "u-no-permissions-field",
  emptyPermissions: "u-empty-permissions",
  roleOfOtherCompany: "u-role-of-other-company",
  nonStringRoleId: "u-non-string-roleid",
  blocked: "u-blocked", // Gesperrt, Rolle admin
  wrongCompany: "u-wrong-company", // company-b-Mitglied (Rolle admin dort)
  noMembership: "u-no-membership",
} as const;

// Welche Persona gehört zu welchem Mitarbeiter-Dokument (company-a).
export const EMPLOYEE_OF: Record<string, string> = {
  [P.admin]: "emp-admin",
  [P.admin2]: "emp-admin-2",
  [P.laborleiter]: "emp-laborleiter",
  [P.pruefer]: "emp-pruefer",
  [P.azubi]: "emp-azubi",
  [P.gast]: "emp-gast",
  [P.baustellenleiter]: "emp-baustellenleiter",
  [P.hr]: "emp-hr",
  [P.locationManager]: "emp-location-manager",
  [P.legacyAdmin]: "emp-legacy-admin",
};

function membershipOf(
  companyId: string,
  roleId: unknown,
  uid: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    companyId,
    status: "Aktiv",
    // Snapshot-Name ohne Bedeutung: darf nie ausgewertet werden.
    role: "Administrator",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
  if (roleId !== undefined) data.roleId = roleId;
  if (EMPLOYEE_OF[uid]) data.employeeId = EMPLOYEE_OF[uid];
  return data;
}

// Seed der Phase-1-Welt (mit deaktivierten Rules): Rollen, Memberships, je ein
// Mitarbeiter pro Persona (+ Zielpersonen), Einladungen und ein Standort in
// company-a, dazu Rollen in company-b.
export async function seedPhase1World(env: RulesTestEnvironment) {
  await seed(env, async (firestore) => {
    const put = (path: string, id: string, data: Record<string, unknown>) =>
      setDoc(doc(firestore, path, id), data);

    // --- Rollen company-a und company-b (Konfigurations-Matrix) ---
    for (const companyId of [COMPANY_A, COMPANY_B]) {
      const path = collectionPath("roles", companyId);
      for (const role of configRoles) await put(path, role.id, configRoleData(role));
    }
    const rolesA = collectionPath("roles", COMPANY_A);
    await put(
      rolesA,
      BILLING_ROLE,
      customRoleData("Billing", permissionMap(["administration.abrechnung_verwalten", "rollen.ansehen"]))
    );
    await put(
      rolesA,
      ARCHIVED_ROLE,
      customRoleData("Archiviert", permissionMap(allPermissionKeys), { status: "Archiviert" })
    );
    const withoutPermissions = customRoleData("Ohne permissions", {});
    delete withoutPermissions.permissions;
    await put(rolesA, NO_PERMISSIONS_ROLE, withoutPermissions);
    await put(rolesA, EMPTY_PERMISSIONS_ROLE, customRoleData("Leere permissions", {}));
    await put(
      rolesA,
      LOCATION_MANAGER_ROLE,
      customRoleData("Standort-Verwalter", permissionMap(["administration.standorte_verwalten"]))
    );
    await put(
      rolesA,
      HR_ROLE,
      customRoleData("HR", permissionMap(["mitarbeiter.ansehen", "administration.mitarbeiter_verwalten", "rollen.ansehen"]))
    );
    // Rolle aus der Zeit vor der Migration: nur die 31 alten Schlüssel, die neuen fehlen komplett.
    const legacyPermissions: Record<string, boolean> = {};
    for (const key of LEGACY_31_KEYS) legacyPermissions[key] = true;
    await put(rolesA, LEGACY_ADMIN_ROLE, customRoleData("Legacy-Admin", legacyPermissions));
    await put(
      rolesA,
      DELETER_ROLE,
      customRoleData(
        "Löscher",
        permissionMap([
          "proben.ansehen",
          "proben.loeschen",
          "geraete.loeschen",
          "laborbuch.loeschen",
          "berichte.loeschen",
        ])
      )
    );
    await put(
      collectionPath("roles", COMPANY_B),
      COMPANY_B_ONLY_ROLE,
      customRoleData("Nur company-b", permissionMap(allPermissionKeys))
    );

    for (const [key, roleId] of Object.entries(PROTECTED_DELETE_ROLES)) {
      await put(rolesA, roleId, customRoleData(roleId, permissionMap(["proben.ansehen", key])));
    }
    await put(rolesA, NORMAL_DELETE_ROLE, customRoleData("Proben-Löscher", permissionMap(["proben.ansehen", "proben.loeschen"])));

    // --- Memberships ---
    const M = COLLECTIONS.USER_MEMBERSHIPS;
    await put(M, P.admin, membershipOf(COMPANY_A, "admin", P.admin));
    await put(M, P.admin2, membershipOf(COMPANY_A, "admin", P.admin2));
    await put(M, P.laborleiter, membershipOf(COMPANY_A, "laborleiter", P.laborleiter));
    await put(M, P.pruefer, membershipOf(COMPANY_A, "pruefer", P.pruefer));
    await put(M, P.azubi, membershipOf(COMPANY_A, "azubi", P.azubi));
    await put(M, P.gast, membershipOf(COMPANY_A, "gast", P.gast));
    await put(M, P.baustellenleiter, membershipOf(COMPANY_A, "baustellenleiter", P.baustellenleiter));
    await put(M, P.hr, membershipOf(COMPANY_A, HR_ROLE, P.hr));
    await put(M, P.locationManager, membershipOf(COMPANY_A, LOCATION_MANAGER_ROLE, P.locationManager));
    await put(M, P.legacyAdmin, membershipOf(COMPANY_A, LEGACY_ADMIN_ROLE, P.legacyAdmin));
    await put(M, P.noRoleId, membershipOf(COMPANY_A, undefined, P.noRoleId));
    await put(M, P.emptyRoleId, membershipOf(COMPANY_A, "", P.emptyRoleId));
    await put(M, P.unknownRole, membershipOf(COMPANY_A, "ghost-role", P.unknownRole));
    await put(M, P.archivedRole, membershipOf(COMPANY_A, ARCHIVED_ROLE, P.archivedRole));
    await put(M, P.noPermissionsField, membershipOf(COMPANY_A, NO_PERMISSIONS_ROLE, P.noPermissionsField));
    await put(M, P.emptyPermissions, membershipOf(COMPANY_A, EMPTY_PERMISSIONS_ROLE, P.emptyPermissions));
    await put(M, P.roleOfOtherCompany, membershipOf(COMPANY_A, COMPANY_B_ONLY_ROLE, P.roleOfOtherCompany));
    await put(M, P.nonStringRoleId, membershipOf(COMPANY_A, 42, P.nonStringRoleId));
    await put(M, P.blocked, membershipOf(COMPANY_A, "admin", P.blocked, { status: "Gesperrt" }));
    await put(M, P.wrongCompany, membershipOf(COMPANY_B, "admin", P.wrongCompany));

    // --- Mitarbeiter (company-a): je Persona einer + Zielpersonen ---
    const employee = (id: string, roleId: string | undefined, role: string) => {
      const data: Record<string, unknown> = {
        name: id,
        initials: "XX",
        email: `${id}@example.de`,
        role,
        location: "Labor Stuttgart",
        locationId: "loc-1",
        status: "Aktiv",
        lastLogin: "Online",
        invitationStatus: "Angenommen",
        history: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };
      if (roleId !== undefined) data.roleId = roleId;
      return put(collectionPath("employees", COMPANY_A), id, data);
    };
    await employee("emp-admin", "admin", "Administrator");
    await employee("emp-admin-2", "admin", "Administrator");
    await employee("emp-laborleiter", "laborleiter", "Laborleiter");
    await employee("emp-pruefer", "pruefer", "Prüfer");
    await employee("emp-azubi", "azubi", "Azubi");
    await employee("emp-gast", "gast", "Gast");
    await employee("emp-baustellenleiter", "baustellenleiter", "Baustellenleiter");
    await employee("emp-hr", HR_ROLE, "HR");
    await employee("emp-location-manager", LOCATION_MANAGER_ROLE, "Standort-Verwalter");
    await employee("emp-legacy-admin", LEGACY_ADMIN_ROLE, "Legacy-Admin");
    // Zielpersonen, die keiner Persona gehören:
    await employee("emp-target", "pruefer", "Prüfer"); // normaler Mitarbeiter
    await employee("emp-target-2", "azubi", "Azubi");
    await employee("emp-billing", BILLING_ROLE, "Billing"); // Rolle mit Restricted-Schlüssel
    await employee("emp-legacy-no-roleid", undefined, "Admin"); // Altdaten: nur Rollenname, keine roleId
    await employee("emp-deleter", DELETER_ROLE, "Löscher"); // aktuelle Rolle enthält Admin-only-Löschrechte

    // --- Einladungen: je Persona eine zum Widerrufen + feste Zustände ---
    const invitationsPath = collectionPath("invitations", COMPANY_A);
    for (const persona of Object.values(P)) await put(invitationsPath, `inv-of-${persona}`, invitationData("Ausstehend"));
    await put(invitationsPath, "inv-pending", invitationData("Ausstehend"));
    await put(invitationsPath, "inv-revoked", invitationData("Widerrufen", { revokedAt: "2026-02-01T00:00:00.000Z" }));
    await put(invitationsPath, "inv-accepted", invitationData("Angenommen", { acceptedAt: "2026-02-01T00:00:00.000Z" }));

    // --- Standorte ---
    await put(collectionPath("locations", COMPANY_A), "loc-1", locationData());
  });
}

// Phase-1-Welt + je Fach-Collection die Dokumente `existing` und `del-<name>` (für jeden Namen
// in `deleteTargets`; so kann jede Persona/Rolle ein EIGENES Dokument löschen, ohne dass sich
// Tests gegenseitig die Daten wegnehmen) in company-a; `existing` auch in company-b.
export async function seedPhase2World(env: RulesTestEnvironment, deleteTargets: readonly string[] = []) {
  await seedPhase1World(env);
  await seed(env, async (firestore) => {
    for (const collection of PHASE2_COLLECTIONS) {
      const ids = [EXISTING_DOC_ID, ...deleteTargets.map((name) => `del-${name}`)];
      for (const id of ids) {
        await setDoc(doc(firestore, collectionPath(collection, COMPANY_A), id), phase2DocData(collection, id));
      }
      await setDoc(doc(firestore, collectionPath(collection, COMPANY_B), EXISTING_DOC_ID), phase2DocData(collection, EXISTING_DOC_ID));
    }
  });
}

// Einladungsdokument wie vom Service geschrieben (ohne id).
export function invitationData(status: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "Eingeladen",
    email: "eingeladen@example.de",
    role: "Prüfer",
    roleId: "pruefer",
    location: "Labor Stuttgart",
    locationId: "loc-1",
    status,
    expiresAt: "2099-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    activateImmediately: false,
    ...extra,
  };
}

export function locationData(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "Labor Stuttgart",
    type: "Hauptstandort",
    street: "Teststraße 1",
    postalCode: "70173",
    city: "Stuttgart",
    country: "Deutschland",
    contactPerson: "Test",
    phone: "0",
    email: "labor@example.de",
    timezone: "Europe/Berlin",
    employeeCount: 0,
    deviceCount: 0,
    projectCount: 0,
    status: "Aktiv",
    history: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

// Rolle wie vom Client-Service geschrieben (benutzerdefiniert, aktiv).
export function newCustomRole(
  permissions: Record<string, boolean>,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return customRoleData("Neue Rolle", permissions, extra);
}

// Permission-Map einer Rolle aus der Zeit vor der Migration: nur die 31 alten
// Schlüssel gewährt, die 14 neuen (fehlenden) gelten als false.
export function legacyPermissionMap(): Record<string, boolean> {
  return permissionMap(LEGACY_31_KEYS);
}
