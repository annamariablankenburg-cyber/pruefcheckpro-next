// Phase 1: Persona × Collection × Operation für roles, employees, invitations
// und locations – gegen die TATSÄCHLICHE Rollenmatrix aus src/config/roles.ts
// (Administrator, Laborleiter, Prüfer, Azubi, Gast, Baustellenleiter als Custom
// Role) sowie gegen defekte Auflösungsketten (fehlende/leere/unbekannte/
// archivierte Rolle, Rolle ohne permissions, falsche Firma, gesperrte
// Membership …). Defekt heißt immer: kein Zugriff.
//
// Spezialfälle (eigene Dokumente, Restricted-Schutz, Self-Promotion, Formregeln)
// stehen in phase1-employees/-roles/-invitations-locations.test.ts.
import { after, before, describe, it } from "node:test";

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

import { COMPANY_A, P, collectionPath, invitationData, locationData, newCustomRole, permissionMap, seedPhase1World } from "./helpers/fixtures";
import { asAnonymous, asUser, createTestEnv } from "./helpers/testEnv";

interface Expectation {
  locationsRead: boolean;
  locationsWrite: boolean;
  invitations: boolean; // lesen, anlegen, widerrufen
  employeesRead: boolean;
  employeesWrite: boolean;
  rolesRead: boolean;
  rolesWrite: boolean;
}

const NONE: Expectation = {
  locationsRead: false,
  locationsWrite: false,
  invitations: false,
  employeesRead: false,
  employeesWrite: false,
  rolesRead: false,
  rolesWrite: false,
};
const FULL: Expectation = {
  locationsRead: true,
  locationsWrite: true,
  invitations: true,
  employeesRead: true,
  employeesWrite: true,
  rolesRead: true,
  rolesWrite: true,
};
// Prüfer, Azubi und Baustellenleiter besitzen laut Matrix nur standorte.ansehen.
const LOCATIONS_READ_ONLY: Expectation = { ...NONE, locationsRead: true };

// uid === null: nicht authentifiziert.
const PERSONAS: Array<{ name: string; uid: string | null; expect: Expectation }> = [
  { name: "Administrator", uid: P.admin, expect: FULL },
  { name: "zweiter Administrator", uid: P.admin2, expect: FULL },
  { name: "Laborleiter", uid: P.laborleiter, expect: FULL },
  { name: "Prüfer", uid: P.pruefer, expect: LOCATIONS_READ_ONLY },
  { name: "Azubi", uid: P.azubi, expect: LOCATIONS_READ_ONLY },
  { name: "Gast", uid: P.gast, expect: NONE },
  { name: "Custom Role (Baustellenleiter)", uid: P.baustellenleiter, expect: LOCATIONS_READ_ONLY },
  // --- defekte Ketten: kein Zugriff ---
  { name: "Membership ohne roleId", uid: P.noRoleId, expect: NONE },
  { name: "Membership mit leerer roleId", uid: P.emptyRoleId, expect: NONE },
  { name: "Membership mit unbekannter Rolle", uid: P.unknownRole, expect: NONE },
  { name: "Membership mit archivierter Rolle (alle Rechte, aber archiviert)", uid: P.archivedRole, expect: NONE },
  { name: "Rolle ohne permissions-Feld", uid: P.noPermissionsField, expect: NONE },
  { name: "Rolle mit leerer permissions-Map (fehlende Schlüssel)", uid: P.emptyPermissions, expect: NONE },
  { name: "Rolle, die nur in einer anderen Firma existiert", uid: P.roleOfOtherCompany, expect: NONE },
  { name: "Membership mit roleId, die kein String ist", uid: P.nonStringRoleId, expect: NONE },
  { name: "gesperrte Membership (Rolle Administrator)", uid: P.blocked, expect: NONE },
  { name: "Mitglied einer anderen Firma (dort Administrator)", uid: P.wrongCompany, expect: NONE },
  { name: "authentifiziert ohne Membership", uid: P.noMembership, expect: NONE },
  { name: "nicht authentifiziert", uid: null, expect: NONE },
];

const check = (allowed: boolean, operation: Promise<unknown>) =>
  allowed ? assertSucceeds(operation) : assertFails(operation);

describe("Phase 1: Persona × Collection × Operation", () => {
  let env: RulesTestEnvironment;

  before(async () => {
    env = await createTestEnv();
    await env.clearFirestore();
    await seedPhase1World(env);
  });
  after(async () => {
    await env.cleanup();
  });

  const locations = collectionPath("locations", COMPANY_A);
  const invitations = collectionPath("invitations", COMPANY_A);
  const employees = collectionPath("employees", COMPANY_A);
  const roles = collectionPath("roles", COMPANY_A);
  const timestamp = "2026-03-01T00:00:00.000Z";

  for (const persona of PERSONAS) {
    describe(persona.name, () => {
      const e = persona.expect;
      const uid = persona.uid ?? "anonymous";
      const database = () => (persona.uid ? asUser(env, persona.uid) : asAnonymous(env));

      // Idempotente Operationen: Schreibzugriffe nutzen eindeutige IDs je
      // Persona oder setzen dieselben Werte, damit die Reihenfolge egal ist.
      describe("locations", () => {
        it(`get → ${e.locationsRead ? "ALLOW" : "DENY"}`, () =>
          check(e.locationsRead, getDoc(doc(database(), locations, "loc-1"))));
        it(`list → ${e.locationsRead ? "ALLOW" : "DENY"}`, () =>
          check(e.locationsRead, getDocs(collection(database(), locations))));
        it(`create → ${e.locationsWrite ? "ALLOW" : "DENY"}`, () =>
          check(e.locationsWrite, setDoc(doc(database(), locations, `new-${uid}`), locationData())));
        it(`update → ${e.locationsWrite ? "ALLOW" : "DENY"}`, () =>
          check(e.locationsWrite, updateDoc(doc(database(), locations, "loc-1"), { phone: "0711", updatedAt: timestamp })));
        it("delete → DENY (Standorte werden deaktiviert, nie gelöscht)", () =>
          assertFails(deleteDoc(doc(database(), locations, "loc-1"))));
      });

      describe("invitations", () => {
        it(`get → ${e.invitations ? "ALLOW" : "DENY"}`, () =>
          check(e.invitations, getDoc(doc(database(), invitations, "inv-pending"))));
        it(`list → ${e.invitations ? "ALLOW" : "DENY"}`, () =>
          check(e.invitations, getDocs(collection(database(), invitations))));
        it(`create (Prüfer-Rolle, Ausstehend) → ${e.invitations ? "ALLOW" : "DENY"}`, () =>
          check(e.invitations, setDoc(doc(database(), invitations, `inv-new-${uid}`), invitationData("Ausstehend"))));
        it(`widerrufen → ${e.invitations ? "ALLOW" : "DENY"}`, () =>
          check(
            e.invitations,
            updateDoc(doc(database(), invitations, `inv-of-${uid}`), {
              status: "Widerrufen",
              revokedAt: timestamp,
              updatedAt: timestamp,
            })
          ));
        it("delete → DENY", () => assertFails(deleteDoc(doc(database(), invitations, "inv-pending"))));
      });

      describe("employees", () => {
        // emp-target gehört keiner Persona: kein „eigenes Dokument“.
        it(`get (fremdes Dokument) → ${e.employeesRead ? "ALLOW" : "DENY"}`, () =>
          check(e.employeesRead, getDoc(doc(database(), employees, "emp-target"))));
        it(`list → ${e.employeesRead ? "ALLOW" : "DENY"}`, () =>
          check(e.employeesRead, getDocs(collection(database(), employees))));
        it("create → DENY (Phase 1: Employees entstehen nur serverseitig)", () =>
          assertFails(setDoc(doc(database(), employees, `emp-new-${uid}`), { name: "Neu", email: "n@example.de" })));
        it(`update (Standort eines normalen Mitarbeiters) → ${e.employeesWrite ? "ALLOW" : "DENY"}`, () =>
          check(
            e.employeesWrite,
            updateDoc(doc(database(), employees, "emp-target"), {
              location: "Labor Stuttgart",
              locationId: "loc-1",
              updatedAt: timestamp,
            })
          ));
        it("delete → DENY", () => assertFails(deleteDoc(doc(database(), employees, "emp-target"))));
      });

      describe("roles", () => {
        it(`get (fremde Rolle) → ${e.rolesRead ? "ALLOW" : "DENY"}`, () =>
          check(e.rolesRead, getDoc(doc(database(), roles, "qualitaetsmanager"))));
        it(`list → ${e.rolesRead ? "ALLOW" : "DENY"}`, () =>
          check(e.rolesRead, getDocs(collection(database(), roles))));
        it(`create (Custom Role ohne Restricted-Rechte) → ${e.rolesWrite ? "ALLOW" : "DENY"}`, () =>
          check(
            e.rolesWrite,
            setDoc(doc(database(), roles, `role-new-${uid}`), newCustomRole(permissionMap(["proben.ansehen"])))
          ));
        it(`update (Beschreibung einer Custom Role) → ${e.rolesWrite ? "ALLOW" : "DENY"}`, () =>
          check(e.rolesWrite, updateDoc(doc(database(), roles, "baustellenleiter"), { description: "Matrix", updatedAt: timestamp })));
        it("delete → DENY (Rollen werden nie gelöscht)", () =>
          assertFails(deleteDoc(doc(database(), roles, "qualitaetsmanager"))));
      });
    });
  }
});
