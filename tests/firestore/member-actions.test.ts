// Serverseitige Mitglieder-Aktionen (assignRole, setMemberStatus) gegen den
// Firestore-EMULATOR mit dem Admin SDK. Es gibt keine echten Firebase-Projekte,
// keine echten User und keine Secrets: Projekt "demo-…", Emulator-Host aus
// FIRESTORE_EMULATOR_HOST (gesetzt von `npm run test:rules`).
//
// Die Autorisierungsentscheidungen selbst sind zusätzlich als reine Unit-Tests
// abgedeckt (tests/config/member-action-rules.test.ts). Hier: echtes Lesen/
// Schreiben in einer Transaktion (Employee + Membership), Atomizität und die
// HTTP-Schicht (Token, Body, Fehlercodes).
//
// Auth: ID-Tokens werden für den Großteil der Tests durch einen Fake-Verifier
// ersetzt ("token-<uid>"). Die echte Admin-SDK-Prüfung wird für ungültige Tokens
// getestet (ein kaputtes Token scheitert bereits beim Dekodieren, ohne
// Netzwerk/Auth-Emulator). Eine gültige Signaturprüfung braucht echte
// Schlüssel bzw. den Auth-Emulator und ist nicht Teil dieser Tests.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type DocumentReference, type Firestore, type Transaction } from "firebase-admin/firestore";

import { MemberActionError, type MemberActionErrorCode } from "../../src/lib/security/memberActionRules";
import { handleMemberActionRequest, type MemberActionDeps } from "../../src/server/memberActions/requestHandler";
import { verifyFirebaseIdToken } from "../../src/server/memberActions/firebaseAdmin";
import { assignRole, setMemberStatus } from "../../src/server/memberActions/memberActionsService";
import {
  ARCHIVED_ROLE,
  BILLING_ROLE,
  COMPANY_A,
  COMPANY_B,
  COMPANY_B_ONLY_ROLE,
  DELETER_ROLE,
  HR_ROLE,
  NORMAL_DELETE_ROLE,
  P,
  PROTECTED_DELETE_ROLES,
  customRoleData,
  permissionMap,
  seedPhase1World,
} from "./helpers/fixtures";
import { TEST_PROJECT_ID, createTestEnv } from "./helpers/testEnv";

const NOW = new Date("2026-03-01T10:00:00.000Z");
const employeePath = (id: string, companyId = COMPANY_A) => `companies/${companyId}/employees/${id}`;
const rolePath = (id: string, companyId = COMPANY_A) => `companies/${companyId}/roles/${id}`;
const membershipPath = (uid: string) => `userMemberships/${uid}`;

// Custom Role, die geschützte Rollen verwalten darf, ohne selbst "admin" zu sein
// (für den Letzter-Administrator-Fall: der Actor ist KEIN Administrator).
const PROTECTED_MANAGER_ROLE = "protected-manager-role";
const PROTECTED_MANAGER = "u-protected-manager";
const TARGET_BILLING = "u-billing";

describe("Serverseitige Mitglieder-Aktionen (Admin SDK + Emulator)", () => {
  let env: RulesTestEnvironment;
  let db: Firestore;

  before(async () => {
    env = await createTestEnv();
    process.env.FIREBASE_ADMIN_PROJECT_ID = TEST_PROJECT_ID;
    const app = getApps().find((candidate) => candidate.name === "member-actions-test");
    db = getFirestore(app ?? initializeApp(
        {
          projectId: TEST_PROJECT_ID,
          credential: applicationDefault(),
        },
        "member-actions-test"
      ));
  });
  after(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await seedPhase1World(env);
    // Zusatz-Seed per Admin SDK (umgeht die Rules wie der Server).
    await db.doc(rolePath(PROTECTED_MANAGER_ROLE)).set(
      customRoleData("Protected-Manager", permissionMap(["administration.mitarbeiter_verwalten", "rollen.admin_verwalten"]))
    );
    await db.doc(membershipPath(PROTECTED_MANAGER)).set({
      companyId: COMPANY_A,
      employeeId: "emp-protected-manager",
      roleId: PROTECTED_MANAGER_ROLE,
      role: "Protected-Manager",
      status: "Aktiv",
    });
    await db.doc(employeePath("emp-protected-manager")).set({ name: "PM", status: "Aktiv", roleId: PROTECTED_MANAGER_ROLE, role: "Protected-Manager", history: [] });
    // Zielperson mit Membership und Rolle mit Restricted-Schlüssel.
    await db.doc(membershipPath(TARGET_BILLING)).set({
      companyId: COMPANY_A,
      employeeId: "emp-billing",
      roleId: BILLING_ROLE,
      role: "Billing",
      status: "Aktiv",
    });
  });

  const snapshot = async (employeeId: string, uid: string) => ({
    employee: (await db.doc(employeePath(employeeId)).get()).data(),
    membership: (await db.doc(membershipPath(uid)).get()).data(),
  });

  async function expectDenied(promise: Promise<unknown>, code: MemberActionErrorCode) {
    await assert.rejects(promise, (error: unknown) => {
      assert.ok(error instanceof MemberActionError, `MemberActionError erwartet, erhalten: ${String(error)}`);
      assert.equal(error.code, code);
      return true;
    });
  }

  // Nur einer der beiden Administratoren bleibt (u-admin-2 wird Laborleiter).
  async function makeSingleAdmin() {
    await db.doc(membershipPath(P.admin2)).update({ roleId: "laborleiter", role: "Laborleiter" });
    await db.doc(employeePath("emp-admin-2")).update({ roleId: "laborleiter", role: "Laborleiter" });
  }

  describe("assignRole", () => {
    it("Administrator weist eine normale Rolle zu → ALLOW (Employee + Membership + updatedAt + Historie)", async () => {
      const result = await assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW);
      const after = await snapshot("emp-pruefer", P.pruefer);
      assert.equal(after.employee?.roleId, "azubi");
      assert.equal(after.employee?.role, "Azubi");
      assert.equal(after.employee?.updatedAt, NOW.toISOString());
      assert.equal((after.employee?.history as unknown[]).length, 1);
      assert.equal(after.membership?.roleId, "azubi");
      assert.equal(after.membership?.role, "Azubi");
      assert.equal(after.membership?.updatedAt, NOW.toISOString());
      assert.equal(after.membership?.status, "Aktiv");
      assert.equal(result.employee.id, "emp-pruefer");
      assert.equal(result.employee.roleId, "azubi");
      assert.equal(result.membership.roleId, "azubi");
    });

    it("Rollenname kommt vom Rollen-Dokument, nicht vom Client", async () => {
      await assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: "gast" }, NOW);
      assert.equal((await db.doc(employeePath("emp-pruefer")).get()).data()?.role, "Gast");
    });

    it("Laborleiter weist eine normale Rolle zu → ALLOW", async () => {
      await assignRole(db, P.laborleiter, { employeeId: "emp-gast", roleId: "pruefer" }, NOW);
      assert.equal((await db.doc(membershipPath(P.gast)).get()).data()?.roleId, "pruefer");
    });

    it("HR-Rolle (mitarbeiter_verwalten) weist eine normale Rolle zu → ALLOW", async () => {
      await assignRole(db, P.hr, { employeeId: "emp-azubi", roleId: NORMAL_DELETE_ROLE }, NOW);
      assert.equal((await db.doc(membershipPath(P.azubi)).get()).data()?.roleId, NORMAL_DELETE_ROLE);
    });

    it("Laborleiter weist die Administrator-Rolle zu → DENY (protected-role-denied), keine Änderung", async () => {
      const before = await snapshot("emp-pruefer", P.pruefer);
      await expectDenied(assignRole(db, P.laborleiter, { employeeId: "emp-pruefer", roleId: "admin" }, NOW), "protected-role-denied");
      assert.deepEqual(await snapshot("emp-pruefer", P.pruefer), before);
    });

    it("Laborleiter weist eine Rolle mit Restricted-Schlüssel zu → DENY", async () => {
      await expectDenied(assignRole(db, P.laborleiter, { employeeId: "emp-pruefer", roleId: BILLING_ROLE }, NOW), "protected-role-denied");
    });

    for (const [key, roleId] of Object.entries(PROTECTED_DELETE_ROLES)) {
      it(`Laborleiter weist eine Rolle mit dem Admin-only-Löschrecht ${key} zu → DENY; Administrator → ALLOW`, async () => {
        await expectDenied(assignRole(db, P.laborleiter, { employeeId: "emp-pruefer", roleId }, NOW), "protected-role-denied");
        await assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId }, NOW);
        assert.equal((await db.doc(membershipPath(P.pruefer)).get()).data()?.roleId, roleId);
      });
    }

    it("Laborleiter weist eine Rolle mit einem NORMALEN Löschrecht zu → ALLOW (nicht geschützt)", async () => {
      await assignRole(db, P.laborleiter, { employeeId: "emp-pruefer", roleId: NORMAL_DELETE_ROLE }, NOW);
    });

    it("Administrator weist Protected Role zu → ALLOW (Billing, Administrator, Löscher)", async () => {
      await assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: BILLING_ROLE }, NOW);
      await assignRole(db, P.admin, { employeeId: "emp-azubi", roleId: DELETER_ROLE }, NOW);
      await assignRole(db, P.admin, { employeeId: "emp-gast", roleId: "admin" }, NOW);
      assert.equal((await db.doc(membershipPath(P.gast)).get()).data()?.roleId, "admin");
    });

    it("Laborleiter ändert einen Mitarbeiter mit geschützter Rolle (Administrator) → DENY", async () => {
      await expectDenied(assignRole(db, P.laborleiter, { employeeId: "emp-admin-2", roleId: "pruefer" }, NOW), "protected-role-denied");
    });

    it("Laborleiter ändert einen Mitarbeiter, dessen Membership-Rolle ein Restricted-Recht hat → DENY", async () => {
      await expectDenied(assignRole(db, P.laborleiter, { employeeId: "emp-billing", roleId: "pruefer" }, NOW), "protected-role-denied");
      await assignRole(db, P.admin, { employeeId: "emp-billing", roleId: "pruefer" }, NOW);
    });

    it("geschützte Employee-Rolle (Membership harmlos) → ohne Adminrecht DENY", async () => {
      await db.doc(employeePath("emp-pruefer")).update({ roleId: BILLING_ROLE });
      await expectDenied(assignRole(db, P.laborleiter, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), "protected-role-denied");
    });

    it("Mitarbeiter ohne auflösbare Membership-Rolle → nur mit Adminrecht (fail-closed)", async () => {
      await db.doc(membershipPath(P.pruefer)).update({ roleId: "ghost-role" });
      await expectDenied(assignRole(db, P.laborleiter, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), "protected-role-denied");
      await assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW);
    });

    it("unbekannte Rolle → DENY (target-role-not-found)", async () => {
      const before = await snapshot("emp-pruefer", P.pruefer);
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: "ghost" }, NOW), "target-role-not-found");
      assert.deepEqual(await snapshot("emp-pruefer", P.pruefer), before);
    });

    it("archivierte Rolle → DENY (target-role-inactive)", async () => {
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: ARCHIVED_ROLE }, NOW), "target-role-inactive");
    });

    it("Rolle einer fremden Firma → DENY (wird nur in der Firma des Actors gesucht)", async () => {
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: COMPANY_B_ONLY_ROLE }, NOW), "target-role-not-found");
    });

    it("fremde Firma: Actor aus company-b greift auf einen Mitarbeiter aus company-a zu → DENY, keine Änderung", async () => {
      const before = await snapshot("emp-pruefer", P.pruefer);
      await expectDenied(assignRole(db, P.wrongCompany, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), "employee-not-found");
      assert.deepEqual(await snapshot("emp-pruefer", P.pruefer), before);
    });

    it("Membership einer fremden Firma mit gleicher employeeId wird weder gelesen noch geändert", async () => {
      await db.doc(membershipPath("u-foreign")).set({ companyId: COMPANY_B, employeeId: "emp-pruefer", roleId: "pruefer", status: "Aktiv" });
      await assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW);
      assert.equal((await db.doc(membershipPath("u-foreign")).get()).data()?.roleId, "pruefer");
    });

    it("Ziel-Membership fehlt → DENY (membership-not-found), Employee bleibt unverändert", async () => {
      const before = (await db.doc(employeePath("emp-target")).get()).data();
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-target", roleId: "azubi" }, NOW), "membership-not-found");
      assert.deepEqual((await db.doc(employeePath("emp-target")).get()).data(), before);
    });

    it("Mitarbeiter existiert nicht → DENY (employee-not-found)", async () => {
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-ghost", roleId: "azubi" }, NOW), "employee-not-found");
    });

    it("zwei Memberships für denselben Mitarbeiter → DENY (membership-employee-mismatch)", async () => {
      await db.doc(membershipPath("u-duplicate")).set({ companyId: COMPANY_A, employeeId: "emp-pruefer", roleId: "pruefer", status: "Aktiv" });
      const before = await snapshot("emp-pruefer", P.pruefer);
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), "membership-employee-mismatch");
      assert.deepEqual(await snapshot("emp-pruefer", P.pruefer), before);
    });

    it("Mitarbeiter mit Status „Ausstehend“, aber vorhandener Membership → DENY (mismatch)", async () => {
      await db.doc(employeePath("emp-pruefer")).update({ status: "Ausstehend" });
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), "membership-employee-mismatch");
    });

    it("eigene Rolle ändern → DENY (self-change-denied), auch Administrator und auch dieselbe Rolle", async () => {
      await expectDenied(assignRole(db, P.laborleiter, { employeeId: "emp-laborleiter", roleId: "azubi" }, NOW), "self-change-denied");
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-admin", roleId: "laborleiter" }, NOW), "self-change-denied");
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-admin", roleId: "admin" }, NOW), "self-change-denied");
    });

    it("Actor ohne mitarbeiter_verwalten (Prüfer, Azubi, Gast) → DENY (permission-denied)", async () => {
      for (const uid of [P.pruefer, P.azubi, P.gast]) {
        await expectDenied(assignRole(db, uid, { employeeId: "emp-baustellenleiter", roleId: "azubi" }, NOW), "permission-denied");
      }
    });

    it("Actor mit defekter Rollenkette → DENY (keine Rechte)", async () => {
      for (const uid of [P.noRoleId, P.emptyRoleId, P.unknownRole, P.archivedRole, P.noPermissionsField, P.emptyPermissions, P.roleOfOtherCompany, P.nonStringRoleId]) {
        await expectDenied(assignRole(db, uid, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), "permission-denied");
      }
    });

    it("gesperrte Membership des Actors → DENY (membership-blocked)", async () => {
      await expectDenied(assignRole(db, P.blocked, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), "membership-blocked");
    });

    it("Actor ohne Membership → DENY (membership-missing)", async () => {
      await expectDenied(assignRole(db, P.noMembership, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), "membership-missing");
    });

    it("Actor in einer anderen Firma darf nichts in company-a ändern", async () => {
      const before = await snapshot("emp-pruefer", P.pruefer);
      await expectDenied(assignRole(db, P.wrongCompany, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), "employee-not-found");
      assert.deepEqual(await snapshot("emp-pruefer", P.pruefer), before);
    });

    it("ungültige IDs (Pfad, „..“) → invalid-request, ohne Firestore-Zugriff auf fremde Pfade", async () => {
      await expectDenied(assignRole(db, P.admin, { employeeId: "../x", roleId: "azubi" }, NOW), "invalid-request");
      await expectDenied(assignRole(db, P.admin, { employeeId: "emp-pruefer", roleId: "a/b" }, NOW), "invalid-request");
    });

    describe("letzter Administrator", () => {
      it("2 Administratoren → einer darf auf eine andere Rolle gesetzt werden → ALLOW", async () => {
        await assignRole(db, P.admin, { employeeId: "emp-admin-2", roleId: "laborleiter" }, NOW);
        assert.equal((await db.doc(membershipPath(P.admin2)).get()).data()?.roleId, "laborleiter");
      });

      it("1 aktiver Administrator → Rollenwechsel → DENY (last-admin-denied), keine Teiländerung", async () => {
        await makeSingleAdmin();
        const before = await snapshot("emp-admin", P.admin);
        await expectDenied(assignRole(db, PROTECTED_MANAGER, { employeeId: "emp-admin", roleId: "laborleiter" }, NOW), "last-admin-denied");
        assert.deepEqual(await snapshot("emp-admin", P.admin), before);
      });

      it("1 aktiver Administrator → Zuweisung der Administrator-Rolle an ihn selbst (dieselbe Rolle) → ALLOW (kein Verlust)", async () => {
        await makeSingleAdmin();
        await assignRole(db, PROTECTED_MANAGER, { employeeId: "emp-admin", roleId: "admin" }, NOW);
      });

      it("der zweite Administrator ist gesperrt → der verbleibende zählt als letzter (nur Aktive zählen)", async () => {
        await db.doc(membershipPath(P.admin2)).update({ status: "Gesperrt" });
        await expectDenied(assignRole(db, PROTECTED_MANAGER, { employeeId: "emp-admin", roleId: "pruefer" }, NOW), "last-admin-denied");
      });

      it("Custom Role mit rollen.admin_verwalten zählt NICHT als Administrator", async () => {
        // u-protected-manager hat rollen.admin_verwalten, ist aber kein "admin": zwei
        // echte Administratoren bleiben nötig, damit einer abgesetzt werden darf.
        await makeSingleAdmin();
        await expectDenied(assignRole(db, PROTECTED_MANAGER, { employeeId: "emp-admin", roleId: "pruefer" }, NOW), "last-admin-denied");
      });

      it("eigener Administrator-Datensatz → ohnehin DENY (self-change-denied vor last-admin)", async () => {
        await makeSingleAdmin();
        await expectDenied(assignRole(db, P.admin, { employeeId: "emp-admin", roleId: "laborleiter" }, NOW), "self-change-denied");
      });
    });

    describe("Atomizität", () => {
      // Der Proxy lässt die Employee-Änderung durch und bricht beim Schreiben der
      // Membership ab. Die Transaktion darf dann NICHTS committen.
      function failingMembershipWrite(): Firestore {
        return new Proxy(db, {
          get(target, property, receiver) {
            if (property === "runTransaction") {
              return (updateFunction: (tx: Transaction) => Promise<unknown>) =>
                target.runTransaction((tx) =>
                  updateFunction(
                    new Proxy(tx, {
                      get(txTarget, txProperty) {
                        if (txProperty === "update") {
                          return (ref: DocumentReference, data: object) => {
                            if (ref.path.startsWith("userMemberships/")) throw new Error("simulierter Schreibfehler");
                            return txTarget.update(ref, data);
                          };
                        }
                        const value = Reflect.get(txTarget, txProperty);
                        return typeof value === "function" ? value.bind(txTarget) : value;
                      },
                    })
                  )
                );
            }
            const value = Reflect.get(target, property, receiver);
            return typeof value === "function" ? value.bind(target) : value;
          },
        });
      }

      it("assignRole: Fehler beim Membership-Write → Employee bleibt unverändert", async () => {
        const before = await snapshot("emp-pruefer", P.pruefer);
        await assert.rejects(assignRole(failingMembershipWrite(), P.admin, { employeeId: "emp-pruefer", roleId: "azubi" }, NOW), /simulierter Schreibfehler/);
        assert.deepEqual(await snapshot("emp-pruefer", P.pruefer), before);
      });

      it("setMemberStatus: Fehler beim Membership-Write → Employee bleibt unverändert", async () => {
        const before = await snapshot("emp-pruefer", P.pruefer);
        await assert.rejects(setMemberStatus(failingMembershipWrite(), P.admin, { employeeId: "emp-pruefer", status: "Gesperrt" }, NOW), /simulierter Schreibfehler/);
        assert.deepEqual(await snapshot("emp-pruefer", P.pruefer), before);
      });
    });
  });

  // Echter Paralleltest der Last-Admin-Invariante: zwei gleichzeitige Transaktionen
  // (db.runTransaction gegen den Emulator) dürfen nicht BEIDE den jeweils "anderen"
  // Administrator als verbleibend ansehen (Write Skew). Der Actor ist kein Administrator,
  // hat aber mitarbeiter_verwalten + rollen.admin_verwalten; beide Ziele sind fremde Employees.
  describe("Last-Admin-Race (parallele Transaktionen)", () => {
    const ROUNDS = 5;
    const ADMINS = [
      { uid: P.admin, employeeId: "emp-admin" },
      { uid: P.admin2, employeeId: "emp-admin-2" },
    ] as const;

    // Beide Administratoren wieder aktiv/admin und synchron (Zustand vor jeder Runde).
    async function resetAdmins() {
      for (const admin of ADMINS) {
        await db.doc(membershipPath(admin.uid)).update({ roleId: "admin", role: "Administrator", status: "Aktiv" });
        await db.doc(employeePath(admin.employeeId)).update({ roleId: "admin", role: "Administrator", status: "Aktiv", history: [] });
      }
    }

    async function state(admin: (typeof ADMINS)[number]) {
      const snap = await snapshot(admin.employeeId, admin.uid);
      return { employee: snap.employee as Record<string, unknown>, membership: snap.membership as Record<string, unknown> };
    }

    async function activeAdminCount() {
      const result = await db.collection("userMemberships").where("companyId", "==", COMPANY_A).get();
      return result.docs.filter((doc) => doc.data().status === "Aktiv" && doc.data().roleId === "admin").length;
    }

    function outcome(settled: PromiseSettledResult<unknown>[]) {
      const fulfilled = settled.flatMap((result, index) => (result.status === "fulfilled" ? [index] : []));
      const rejected = settled.flatMap((result, index) =>
        result.status === "rejected" ? [{ index, reason: result.reason }] : []
      );
      return { fulfilled, rejected };
    }

    function assertExactlyOneDenied(settled: PromiseSettledResult<unknown>[]) {
      const { fulfilled, rejected } = outcome(settled);
      assert.equal(fulfilled.length, 1, "genau eine Operation darf erfolgreich sein");
      assert.equal(rejected.length, 1, "genau eine Operation muss scheitern");
      const reason = rejected[0].reason;
      assert.ok(reason instanceof MemberActionError, `MemberActionError erwartet, erhalten: ${String(reason)}`);
      assert.equal(reason.code, "last-admin-denied");
      return { winner: ADMINS[fulfilled[0]], loser: ADMINS[rejected[0].index] };
    }

    it("zwei Rollenwechsel admin → pruefer gleichzeitig: genau einer gelingt, ein Administrator bleibt", async () => {
      for (let round = 0; round < ROUNDS; round += 1) {
        await resetAdmins();
        assert.equal(await activeAdminCount(), 2, "Ausgangslage: genau zwei aktive Administratoren");
        const loserBefore = { 0: await state(ADMINS[0]), 1: await state(ADMINS[1]) };

        const settled = await Promise.allSettled([
          assignRole(db, PROTECTED_MANAGER, { employeeId: ADMINS[0].employeeId, roleId: "pruefer" }, NOW),
          assignRole(db, PROTECTED_MANAGER, { employeeId: ADMINS[1].employeeId, roleId: "pruefer" }, NOW),
        ]);
        const { winner, loser } = assertExactlyOneDenied(settled);

        assert.equal(await activeAdminCount(), 1, `Runde ${round}: exakt ein aktiver Administrator`);
        const won = await state(winner);
        assert.equal(won.membership.roleId, "pruefer");
        assert.equal(won.employee.roleId, "pruefer");
        assert.equal(won.membership.role, won.employee.role);
        assert.equal(won.membership.status, won.employee.status);
        // Der abgelehnte Administrator bleibt vollständig unverändert und synchron.
        const lost = await state(loser);
        assert.deepEqual(lost, loserBefore[ADMINS.indexOf(loser) as 0 | 1]);
        assert.equal(lost.membership.roleId, "admin");
        assert.equal(lost.employee.roleId, "admin");
      }
    });

    it("zwei Sperren gleichzeitig: genau eine gelingt, ein aktiver Administrator bleibt", async () => {
      for (let round = 0; round < ROUNDS; round += 1) {
        await resetAdmins();
        assert.equal(await activeAdminCount(), 2, "Ausgangslage: genau zwei aktive Administratoren");
        const before = { 0: await state(ADMINS[0]), 1: await state(ADMINS[1]) };

        const settled = await Promise.allSettled([
          setMemberStatus(db, PROTECTED_MANAGER, { employeeId: ADMINS[0].employeeId, status: "Gesperrt" }, NOW),
          setMemberStatus(db, PROTECTED_MANAGER, { employeeId: ADMINS[1].employeeId, status: "Gesperrt" }, NOW),
        ]);
        const { winner, loser } = assertExactlyOneDenied(settled);

        assert.equal(await activeAdminCount(), 1, `Runde ${round}: exakt ein aktiver Administrator`);
        const won = await state(winner);
        assert.equal(won.membership.status, "Gesperrt");
        assert.equal(won.employee.status, "Gesperrt");
        assert.equal(won.membership.roleId, "admin"); // nur der Status ändert sich
        const lost = await state(loser);
        assert.deepEqual(lost, before[ADMINS.indexOf(loser) as 0 | 1]);
        assert.equal(lost.membership.status, "Aktiv");
        assert.equal(lost.employee.status, "Aktiv");
      }
    });

    it("gemischt: Rollenwechsel des einen und Sperre des anderen Administrators gleichzeitig → genau eine gelingt", async () => {
      for (let round = 0; round < ROUNDS; round += 1) {
        await resetAdmins();
        const settled = await Promise.allSettled([
          assignRole(db, PROTECTED_MANAGER, { employeeId: ADMINS[0].employeeId, roleId: "pruefer" }, NOW),
          setMemberStatus(db, PROTECTED_MANAGER, { employeeId: ADMINS[1].employeeId, status: "Gesperrt" }, NOW),
        ]);
        assertExactlyOneDenied(settled);
        assert.equal(await activeAdminCount(), 1, `Runde ${round}: exakt ein aktiver Administrator`);
        // Beide Dokumentpaare sind in sich synchron (Rolle und Status).
        for (const admin of ADMINS) {
          const current = await state(admin);
          assert.equal(current.membership.roleId, current.employee.roleId, admin.uid);
          assert.equal(current.membership.status, current.employee.status, admin.uid);
        }
      }
    });

    it("dieselbe Operation doppelt auf denselben Administrator → beide dürfen gelingen (der andere bleibt Administrator)", async () => {
      await resetAdmins();
      const settled = await Promise.allSettled([
        assignRole(db, PROTECTED_MANAGER, { employeeId: ADMINS[0].employeeId, roleId: "pruefer" }, NOW),
        assignRole(db, PROTECTED_MANAGER, { employeeId: ADMINS[0].employeeId, roleId: "pruefer" }, NOW),
      ]);
      assert.deepEqual(settled.map((result) => result.status), ["fulfilled", "fulfilled"]);
      assert.equal(await activeAdminCount(), 1);
      assert.equal((await state(ADMINS[1])).membership.roleId, "admin");
    });
  });

  describe("setMemberStatus", () => {
    it("Laborleiter sperrt einen normalen Mitarbeiter → ALLOW (Employee + Membership + Historie)", async () => {
      const result = await setMemberStatus(db, P.laborleiter, { employeeId: "emp-pruefer", status: "Gesperrt" }, NOW);
      const after = await snapshot("emp-pruefer", P.pruefer);
      assert.equal(after.employee?.status, "Gesperrt");
      assert.equal(after.membership?.status, "Gesperrt");
      assert.equal(after.employee?.updatedAt, NOW.toISOString());
      assert.equal(after.membership?.updatedAt, NOW.toISOString());
      const history = after.employee?.history as Array<{ message: string }>;
      assert.equal(history[history.length - 1].message, "Zugriff temporär gesperrt.");
      assert.equal(result.employee.status, "Gesperrt");
      assert.equal(result.membership.status, "Gesperrt");
      // Rolle bleibt unverändert.
      assert.equal(after.membership?.roleId, "pruefer");
    });

    it("reason „revoke-access“ → Historie „Zugriff entzogen.“, Status Gesperrt", async () => {
      await setMemberStatus(db, P.laborleiter, { employeeId: "emp-pruefer", status: "Gesperrt", reason: "revoke-access" }, NOW);
      const history = (await db.doc(employeePath("emp-pruefer")).get()).data()?.history as Array<{ message: string }>;
      assert.equal(history[history.length - 1].message, "Zugriff entzogen.");
    });

    it("Laborleiter reaktiviert einen normalen Mitarbeiter → ALLOW", async () => {
      await db.doc(membershipPath(P.pruefer)).update({ status: "Gesperrt" });
      await db.doc(employeePath("emp-pruefer")).update({ status: "Gesperrt" });
      await setMemberStatus(db, P.laborleiter, { employeeId: "emp-pruefer", status: "Aktiv" }, NOW);
      const after = await snapshot("emp-pruefer", P.pruefer);
      assert.equal(after.employee?.status, "Aktiv");
      assert.equal(after.membership?.status, "Aktiv");
      const history = after.employee?.history as Array<{ message: string }>;
      assert.equal(history[history.length - 1].message, "Zugriff reaktiviert.");
    });

    it("Statusdivergenz (Employee Gesperrt, Membership Aktiv) wird durch die Aktion synchronisiert", async () => {
      await db.doc(employeePath("emp-pruefer")).update({ status: "Gesperrt" });
      await setMemberStatus(db, P.admin, { employeeId: "emp-pruefer", status: "Gesperrt" }, NOW);
      assert.equal((await db.doc(membershipPath(P.pruefer)).get()).data()?.status, "Gesperrt");
    });

    it("eigener Status (sperren/entsperren) → DENY (self-change-denied), auch Administrator", async () => {
      await expectDenied(setMemberStatus(db, P.laborleiter, { employeeId: "emp-laborleiter", status: "Gesperrt" }, NOW), "self-change-denied");
      await expectDenied(setMemberStatus(db, P.laborleiter, { employeeId: "emp-laborleiter", status: "Aktiv" }, NOW), "self-change-denied");
      await expectDenied(setMemberStatus(db, P.admin, { employeeId: "emp-admin", status: "Gesperrt" }, NOW), "self-change-denied");
    });

    it("geschützte Zielrolle ohne Adminrecht → DENY; Administrator darf geschützten fremden User sperren", async () => {
      await expectDenied(setMemberStatus(db, P.laborleiter, { employeeId: "emp-admin-2", status: "Gesperrt" }, NOW), "protected-role-denied");
      await expectDenied(setMemberStatus(db, P.laborleiter, { employeeId: "emp-billing", status: "Gesperrt" }, NOW), "protected-role-denied");
      await setMemberStatus(db, P.admin, { employeeId: "emp-billing", status: "Gesperrt" }, NOW);
      assert.equal((await db.doc(membershipPath(TARGET_BILLING)).get()).data()?.status, "Gesperrt");
      // 2 Administratoren: einer darf gesperrt werden.
      await setMemberStatus(db, P.admin, { employeeId: "emp-admin-2", status: "Gesperrt" }, NOW);
      assert.equal((await db.doc(membershipPath(P.admin2)).get()).data()?.status, "Gesperrt");
    });

    it("letzter aktiver Administrator → Sperren DENY (last-admin-denied), keine Teiländerung", async () => {
      await makeSingleAdmin();
      const before = await snapshot("emp-admin", P.admin);
      await expectDenied(setMemberStatus(db, PROTECTED_MANAGER, { employeeId: "emp-admin", status: "Gesperrt" }, NOW), "last-admin-denied");
      assert.deepEqual(await snapshot("emp-admin", P.admin), before);
    });

    it("Reaktivieren eines Administrators wird nie vom Last-Admin-Schutz blockiert", async () => {
      await db.doc(membershipPath(P.admin2)).update({ status: "Gesperrt" });
      await setMemberStatus(db, P.admin, { employeeId: "emp-admin-2", status: "Aktiv" }, NOW);
    });

    it("Actor ohne mitarbeiter_verwalten → DENY; gesperrt/ohne Membership/fremde Firma → DENY", async () => {
      await expectDenied(setMemberStatus(db, P.pruefer, { employeeId: "emp-azubi", status: "Gesperrt" }, NOW), "permission-denied");
      await expectDenied(setMemberStatus(db, P.blocked, { employeeId: "emp-azubi", status: "Gesperrt" }, NOW), "membership-blocked");
      await expectDenied(setMemberStatus(db, P.noMembership, { employeeId: "emp-azubi", status: "Gesperrt" }, NOW), "membership-missing");
      await expectDenied(setMemberStatus(db, P.wrongCompany, { employeeId: "emp-azubi", status: "Gesperrt" }, NOW), "employee-not-found");
      assert.equal((await db.doc(membershipPath(P.azubi)).get()).data()?.status, "Aktiv");
    });

    it("Membership fehlt → DENY (membership-not-found); Employee bleibt unverändert", async () => {
      await expectDenied(setMemberStatus(db, P.admin, { employeeId: "emp-target", status: "Gesperrt" }, NOW), "membership-not-found");
      assert.equal((await db.doc(employeePath("emp-target")).get()).data()?.status, "Aktiv");
    });

    it("Mitarbeiter fehlt, ungültiger Status → DENY", async () => {
      await expectDenied(setMemberStatus(db, P.admin, { employeeId: "emp-ghost", status: "Gesperrt" }, NOW), "employee-not-found");
      await expectDenied(setMemberStatus(db, P.admin, { employeeId: "x/y", status: "Gesperrt" }, NOW), "invalid-request");
    });

    it("HR-Rolle sperrt einen normalen Mitarbeiter → ALLOW", async () => {
      await setMemberStatus(db, P.hr, { employeeId: "emp-gast", status: "Gesperrt" }, NOW);
    });
  });

  describe("HTTP-Schicht (Token, Body, Fehlercodes)", () => {
    const deps = (overrides: Partial<MemberActionDeps> = {}): MemberActionDeps => ({
      verifyIdToken: async (token) => {
        if (!token.startsWith("token-")) throw new Error("ungültig");
        return { uid: token.slice("token-".length) };
      },
      getDb: () => db,
      now: () => NOW,
      ...overrides,
    });

    const post = (body: unknown, token?: string, raw?: string) =>
      new Request("http://localhost/api/member-actions/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: raw ?? JSON.stringify(body),
      });

    async function codeOf(response: Response) {
      const json = (await response.json()) as { ok: boolean; code?: string; message?: string };
      return { status: response.status, ...json };
    }

    it("kein Token → 401 unauthenticated", async () => {
      const result = await codeOf(await handleMemberActionRequest(post({ employeeId: "emp-pruefer", roleId: "azubi" }), "assign-role", deps()));
      assert.equal(result.status, 401);
      assert.equal(result.code, "unauthenticated");
    });

    it("falsches Schema im Authorization-Header → 401", async () => {
      const request = new Request("http://localhost/x", { method: "POST", headers: { Authorization: "Basic abc" }, body: "{}" });
      assert.equal((await codeOf(await handleMemberActionRequest(request, "assign-role", deps()))).code, "unauthenticated");
    });

    it("ungültiges Token (Fake-Verifier) → 401, keine Änderung", async () => {
      const before = await snapshot("emp-pruefer", P.pruefer);
      const result = await codeOf(await handleMemberActionRequest(post({ employeeId: "emp-pruefer", roleId: "azubi" }, "kaputt"), "assign-role", deps()));
      assert.equal(result.status, 401);
      assert.equal(result.code, "unauthenticated");
      assert.deepEqual(await snapshot("emp-pruefer", P.pruefer), before);
    });

    it("ungültiges Token mit der ECHTEN Admin-SDK-Prüfung → 401 unauthenticated", async () => {
      const result = await codeOf(
        await handleMemberActionRequest(
          post({ employeeId: "emp-pruefer", roleId: "azubi" }, "kein.gueltiges.token"),
          "assign-role",
          { verifyIdToken: verifyFirebaseIdToken, getDb: () => db, now: () => NOW }
        )
      );
      assert.equal(result.status, 401);
      assert.equal(result.code, "unauthenticated");
    });

    it("gültige Anfrage → 200 mit aktualisiertem Employee, ohne UID/Interna", async () => {
      const response = await handleMemberActionRequest(post({ employeeId: "emp-pruefer", roleId: "azubi" }, `token-${P.admin}`), "assign-role", deps());
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const json = (await response.json()) as { ok: boolean; employee: { id: string; roleId: string }; membership: Record<string, unknown> };
      assert.equal(json.ok, true);
      assert.equal(json.employee.id, "emp-pruefer");
      assert.equal(json.employee.roleId, "azubi");
      assert.deepEqual(Object.keys(json.membership).sort(), ["role", "roleId", "status"]);
      assert.equal(JSON.stringify(json).includes(P.pruefer), false);
    });

    it("set-status über HTTP → 200", async () => {
      const response = await handleMemberActionRequest(
        post({ employeeId: "emp-pruefer", status: "Gesperrt", reason: "revoke-access" }, `token-${P.laborleiter}`),
        "set-status",
        deps()
      );
      assert.equal(response.status, 200);
      assert.equal((await db.doc(membershipPath(P.pruefer)).get()).data()?.status, "Gesperrt");
    });

    it("gesperrte Membership → 403 membership-blocked", async () => {
      const result = await codeOf(await handleMemberActionRequest(post({ employeeId: "emp-pruefer", roleId: "azubi" }, `token-${P.blocked}`), "assign-role", deps()));
      assert.equal(result.status, 403);
      assert.equal(result.code, "membership-blocked");
    });

    it("Client-Felder companyId/actorRole/isAdmin/uid werden ignoriert (Prüfer bleibt ohne Recht)", async () => {
      const before = await snapshot("emp-azubi", P.azubi);
      const result = await codeOf(
        await handleMemberActionRequest(
          post(
            { employeeId: "emp-azubi", roleId: "admin", companyId: COMPANY_B, actorRole: "admin", isAdmin: true, uid: P.admin, actorUid: P.admin },
            `token-${P.pruefer}`
          ),
          "assign-role",
          deps()
        )
      );
      assert.equal(result.status, 403);
      assert.equal(result.code, "permission-denied");
      assert.deepEqual(await snapshot("emp-azubi", P.azubi), before);
    });

    it("falsche Firma per Request (companyId) hilft nicht: Firma kommt aus der Membership", async () => {
      const result = await codeOf(
        await handleMemberActionRequest(
          post({ employeeId: "emp-pruefer", roleId: "azubi", companyId: COMPANY_A }, `token-${P.wrongCompany}`),
          "assign-role",
          deps()
        )
      );
      assert.equal(result.status, 404);
      assert.equal(result.code, "employee-not-found");
    });

    it("ungültiger Body → 400 invalid-request (kein JSON, fehlende/unsichere Felder, zu groß, falscher Status)", async () => {
      const token = `token-${P.admin}`;
      for (const body of [{}, { employeeId: "emp-pruefer" }, { employeeId: "a/b", roleId: "azubi" }, { employeeId: 5, roleId: "azubi" }, null]) {
        const result = await codeOf(await handleMemberActionRequest(post(body, token), "assign-role", deps()));
        assert.equal(result.code, "invalid-request", JSON.stringify(body));
        assert.equal(result.status, 400);
      }
      assert.equal((await codeOf(await handleMemberActionRequest(post(null, token, "kein json"), "assign-role", deps()))).code, "invalid-request");
      assert.equal((await codeOf(await handleMemberActionRequest(post(null, token, "x".repeat(10_000)), "assign-role", deps()))).code, "invalid-request");
      for (const body of [{ employeeId: "emp-pruefer", status: "Ausstehend" }, { employeeId: "emp-pruefer" }, { employeeId: "emp-pruefer", status: "Gesperrt", reason: "x" }]) {
        const result = await codeOf(await handleMemberActionRequest(post(body, token), "set-status", deps()));
        assert.equal(result.code, "invalid-request", JSON.stringify(body));
      }
    });

    it("Fehlercodes werden stabil abgebildet (letzter Admin → 409, self → 403, Rolle fehlt → 404)", async () => {
      await makeSingleAdmin();
      const lastAdmin = await codeOf(
        await handleMemberActionRequest(post({ employeeId: "emp-admin", status: "Gesperrt" }, `token-${PROTECTED_MANAGER}`), "set-status", deps())
      );
      assert.deepEqual([lastAdmin.status, lastAdmin.code], [409, "last-admin-denied"]);
      const self = await codeOf(await handleMemberActionRequest(post({ employeeId: "emp-admin", roleId: "pruefer" }, `token-${P.admin}`), "assign-role", deps()));
      assert.deepEqual([self.status, self.code], [403, "self-change-denied"]);
      const missingRole = await codeOf(await handleMemberActionRequest(post({ employeeId: "emp-pruefer", roleId: "ghost" }, `token-${P.admin}`), "assign-role", deps()));
      assert.deepEqual([missingRole.status, missingRole.code], [404, "target-role-not-found"]);
    });

    it("unerwarteter Fehler → 500 internal-error ohne Interna im Response", async () => {
      const failingDb = {
        runTransaction: async () => {
          throw new Error("geheimer Pfad companies/company-a/roles und Stacktrace");
        },
      } as unknown as Firestore;
      const originalError = console.error;
      console.error = () => undefined;
      try {
        const response = await handleMemberActionRequest(post({ employeeId: "emp-pruefer", roleId: "azubi" }, `token-${P.admin}`), "assign-role", deps({ getDb: () => failingDb }));
        const text = await response.text();
        assert.equal(response.status, 500);
        assert.equal(JSON.parse(text).code, "internal-error");
        assert.equal(text.includes("geheim"), false);
        assert.equal(text.includes("company-a"), false);
      } finally {
        console.error = originalError;
      }
    });

    it("fehlende Server-Konfiguration → 503 server-not-configured", async () => {
      const result = await codeOf(
        await handleMemberActionRequest(
          post({ employeeId: "emp-pruefer", roleId: "azubi" }, "token-x"),
          "assign-role",
          deps({
            verifyIdToken: async () => {
              throw new MemberActionError("server-not-configured");
            },
          })
        )
      );
      assert.equal(result.status, 503);
      assert.equal(result.code, "server-not-configured");
    });
  });

  it("HR-Rolle-Konstante ist im Seed vorhanden (Sanity)", async () => {
    assert.equal((await db.doc(rolePath(HR_ROLE)).get()).exists, true);
  });
});
