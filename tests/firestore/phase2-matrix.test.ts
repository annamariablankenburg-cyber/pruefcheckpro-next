// Phase 2: Persona × Fach-Collection × Operation für customers, projects, devices,
// samples, testValues, reports, calendarEvents und laborbook.
//
// Die Erwartung wird NICHT aus dem Rollennamen abgeleitet, sondern aus der
// tatsächlichen Permission-Matrix:
//
//   erlaubt  ==  permissions[PHASE2_PERMISSIONS[collection][operation]] === true
//
// Für Systemrollen und die Beispiel-Custom-Role stammt permissions aus
// src/config/roles.ts. Laufen Rules und Config auseinander (neue Matrix, geänderter
// Schlüssel, Tippfehler in den Rules), schlagen diese Tests automatisch fehl.
// Defekte Auflösungsketten (fehlende/leere/unbekannte/archivierte Rolle, falsche
// Firma, gesperrte Membership …) ergeben immer "kein Recht" (permissions = null).
//
// Sonderfälle (Berichte-Export, testValues.sampleId, Bulk, Tenant, Service-Abläufe)
// stehen in phase2-permissions.test.ts.
import { after, before, describe, it } from "node:test";

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

import { roles as configRoles } from "../../src/config/roles";
import {
  COMPANY_A,
  EXISTING_DOC_ID,
  LEGACY_31_KEYS,
  P,
  PHASE2_COLLECTIONS,
  PHASE2_PERMISSIONS,
  collectionPath,
  permissionMap,
  phase2DocData,
  seedPhase2World,
  type Phase2Operation,
} from "./helpers/fixtures";
import { asAnonymous, asUser, createTestEnv } from "./helpers/testEnv";

const configPermissions = (roleId: string): Record<string, boolean> => {
  const role = configRoles.find((candidate) => candidate.id === roleId);
  if (!role) throw new Error(`Rolle ${roleId} nicht in der Config`);
  return role.permissions;
};

const legacyPermissions = Object.fromEntries(LEGACY_31_KEYS.map((key) => [key, true]));

// permissions === null: keine auflösbare Rolle -> nichts erlaubt.
interface Persona {
  name: string;
  uid: string | null;
  permissions: Record<string, boolean> | null;
}

const PERSONAS: Persona[] = [
  { name: "Administrator", uid: P.admin, permissions: configPermissions("admin") },
  { name: "zweiter Administrator", uid: P.admin2, permissions: configPermissions("admin") },
  { name: "Laborleiter", uid: P.laborleiter, permissions: configPermissions("laborleiter") },
  { name: "Prüfer", uid: P.pruefer, permissions: configPermissions("pruefer") },
  { name: "Azubi", uid: P.azubi, permissions: configPermissions("azubi") },
  { name: "Gast", uid: P.gast, permissions: configPermissions("gast") },
  { name: "Custom Role (Baustellenleiter, Config)", uid: P.baustellenleiter, permissions: configPermissions("baustellenleiter") },
  // Custom Roles aus dem Seed ohne Fach-Rechte (nur Verwaltungsrechte).
  { name: "Custom Role HR (nur Mitarbeiter-Verwaltung)", uid: P.hr, permissions: permissionMap(["mitarbeiter.ansehen", "administration.mitarbeiter_verwalten", "rollen.ansehen"]) },
  { name: "Custom Role Standort-Verwalter (nur standorte_verwalten)", uid: P.locationManager, permissions: permissionMap(["administration.standorte_verwalten"]) },
  // Rolle aus der Zeit vor der Migration: nur die 31 alten Schlüssel, neue fehlen komplett.
  { name: "Legacy-Rolle (31 alte Schlüssel, 14 neue fehlen)", uid: P.legacyAdmin, permissions: legacyPermissions },
  // --- defekte Ketten und fremde/fehlende Zugänge: kein Recht ---
  { name: "Membership ohne roleId", uid: P.noRoleId, permissions: null },
  { name: "Membership mit leerer roleId", uid: P.emptyRoleId, permissions: null },
  { name: "Membership mit unbekannter Rolle", uid: P.unknownRole, permissions: null },
  { name: "Membership mit archivierter Rolle (alle Rechte, aber archiviert)", uid: P.archivedRole, permissions: null },
  { name: "Rolle ohne permissions-Feld", uid: P.noPermissionsField, permissions: null },
  { name: "Rolle mit leerer permissions-Map (fehlende Schlüssel)", uid: P.emptyPermissions, permissions: null },
  { name: "Rolle, die nur in einer anderen Firma existiert", uid: P.roleOfOtherCompany, permissions: null },
  { name: "Membership mit roleId, die kein String ist", uid: P.nonStringRoleId, permissions: null },
  { name: "gesperrte Membership (Rolle Administrator)", uid: P.blocked, permissions: null },
  { name: "Mitglied einer anderen Firma (dort Administrator)", uid: P.wrongCompany, permissions: null },
  { name: "authentifiziert ohne Membership", uid: P.noMembership, permissions: null },
  { name: "nicht authentifiziert", uid: null, permissions: null },
];

const OPERATIONS: Array<{ id: Phase2Operation | "list"; label: string }> = [
  { id: "read", label: "get" },
  { id: "list", label: "list" },
  { id: "create", label: "create" },
  { id: "update", label: "update" },
  { id: "delete", label: "delete" },
];

const check = (allowed: boolean, operation: Promise<unknown>) =>
  allowed ? assertSucceeds(operation) : assertFails(operation);

describe("Phase 2: Persona × Fach-Collection × Operation (Erwartung aus der Permission-Matrix)", () => {
  let env: RulesTestEnvironment;
  const uidOf = (persona: Persona) => persona.uid ?? "anonymous";

  before(async () => {
    env = await createTestEnv();
    await env.clearFirestore();
    // Jede Persona bekommt je Collection ein eigenes Lösch-Ziel.
    await seedPhase2World(env, PERSONAS.map(uidOf));
  });
  after(async () => {
    await env.cleanup();
  });

  for (const persona of PERSONAS) {
    describe(persona.name, () => {
      const uid = uidOf(persona);
      const database = () => (persona.uid ? asUser(env, persona.uid) : asAnonymous(env));
      const grants = (key: string) => persona.permissions?.[key] === true;

      for (const name of PHASE2_COLLECTIONS) {
        describe(name, () => {
          const path = collectionPath(name, COMPANY_A);
          const required = PHASE2_PERMISSIONS[name];

          for (const operation of OPERATIONS) {
            const key = operation.id === "list" ? required.read : required[operation.id];
            const allowed = grants(key);
            const title = `${operation.label} (${key}) → ${allowed ? "ALLOW" : "DENY"}`;

            it(title, () => {
              switch (operation.id) {
                case "read":
                  return check(allowed, getDoc(doc(database(), path, EXISTING_DOC_ID)));
                case "list":
                  return check(allowed, getDocs(collection(database(), path)));
                case "create":
                  return check(allowed, setDoc(doc(database(), path, `new-${uid}`), phase2DocData(name, `new-${uid}`)));
                case "update":
                  return check(allowed, updateDoc(doc(database(), path, EXISTING_DOC_ID), { notiz: `von ${uid}` }));
                case "delete":
                  return check(allowed, deleteDoc(doc(database(), path, `del-${uid}`)));
              }
            });
          }
        });
      }
    });
  }
});
