// Einladung annehmen (Invitation Acceptance / Membership Provisioning) gegen den Firestore-EMULATOR mit dem
// Admin SDK. Keine echten Projekte, User oder Secrets: Projekt "demo-…", Emulator-Host aus
// FIRESTORE_EMULATOR_HOST (gesetzt von `npm run test:rules`).
//
// Die Entscheidungen sind zusätzlich als reine Tests abgedeckt (tests/config/invitation-acceptance-rules.test.ts).
// Hier: echtes Lesen/Schreiben in EINER Transaktion (Mitarbeiter + Membership + Einladung), Rollback,
// Idempotenz, Parallelität und die HTTP-Schicht (Token, Body, Fehlercodes).
//
// Auth: ID-Tokens werden durch einen Fake-Verifier ersetzt ("token-<uid>"); die E-Mail und der
// Verifizierungsstatus kommen aus der Tabelle PRINCIPALS. Die echte Admin-SDK-Prüfung wird für ein ungültiges
// Token getestet (scheitert beim Dekodieren, ohne Netzwerk).
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type DocumentReference, type Firestore, type Transaction } from "firebase-admin/firestore";

import { auditMemberLinks } from "../../src/lib/security/memberLinkAudit";
import {
  INVITATION_ACTION_HTTP_STATUS,
  InvitationActionError,
  type InvitationActionErrorCode,
  type VerifiedPrincipal,
} from "../../src/lib/security/invitationAcceptanceRules";
import { MemberActionError } from "../../src/lib/security/memberActionRules";
import { verifyFirebaseIdPrincipal } from "../../src/server/memberActions/firebaseAdmin";
import { acceptInvitation } from "../../src/server/invitationActions/invitationActionsService";
import { handleAcceptInvitationRequest, type InvitationActionDeps } from "../../src/server/invitationActions/requestHandler";
import {
  ARCHIVED_ROLE,
  COMPANY_A,
  COMPANY_B,
  COMPANY_B_ONLY_ROLE,
  P,
  invitationData,
  seedPhase1World,
} from "./helpers/fixtures";
import { TEST_PROJECT_ID, createTestEnv } from "./helpers/testEnv";

const NOW = new Date("2026-03-01T10:00:00.000Z");
const NEW_UID = "u-new";
const NEW_EMAIL = "neu@example.de";
const OTHER_UID = "u-other";
const INV = "inv-accept";
const EMP = `emp-${INV}`;

const invitationPath = (id = INV, companyId = COMPANY_A) => `companies/${companyId}/invitations/${id}`;
const employeePath = (id = EMP, companyId = COMPANY_A) => `companies/${companyId}/employees/${id}`;
const rolePath = (id: string, companyId = COMPANY_A) => `companies/${companyId}/roles/${id}`;
const membershipPath = (uid: string) => `userMemberships/${uid}`;

const verified = (uid: string, email: string | undefined, emailVerified = true): VerifiedPrincipal => ({ uid, email, emailVerified });
const NEW_PRINCIPAL = verified(NEW_UID, NEW_EMAIL);
const REQUEST = { companyId: COMPANY_A, invitationId: INV };

// Token → Identität (Fake-Verifier für die HTTP-Tests).
const PRINCIPALS: Record<string, VerifiedPrincipal> = {
  [`token-${NEW_UID}`]: NEW_PRINCIPAL,
  [`token-${OTHER_UID}`]: verified(OTHER_UID, "andere@example.de"),
  "token-unverified": verified(NEW_UID, NEW_EMAIL, false),
};

describe("Einladung annehmen (Admin SDK + Emulator)", () => {
  let env: RulesTestEnvironment;
  let db: Firestore;

  before(async () => {
    env = await createTestEnv();
    process.env.FIREBASE_ADMIN_PROJECT_ID = TEST_PROJECT_ID;
    const app = getApps().find((candidate) => candidate.name === "invitation-acceptance-test");
    db = getFirestore(
      app ?? initializeApp({ projectId: TEST_PROJECT_ID, credential: applicationDefault() }, "invitation-acceptance-test")
    );
  });
  after(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await seedPhase1World(env);
    await db.doc(invitationPath()).set(invitationData("Ausstehend", { name: "Neue Person", email: NEW_EMAIL, roleId: "pruefer", role: "Prüfer" }));
  });

  const data = async (path: string) => (await db.doc(path).get()).data();
  const exists = async (path: string) => (await db.doc(path).get()).exists;
  const world = async () => ({
    invitation: await data(invitationPath()),
    employee: await data(employeePath()),
    membership: await data(membershipPath(NEW_UID)),
    otherMembership: await data(membershipPath(OTHER_UID)),
  });

  async function expectDenied(promise: Promise<unknown>, code: InvitationActionErrorCode) {
    await assert.rejects(promise, (error: unknown) => {
      assert.ok(error instanceof InvitationActionError, `InvitationActionError erwartet, erhalten: ${String(error)}`);
      assert.equal(error.code, code);
      return true;
    });
  }

  // Ein abgelehnter Versuch darf NICHTS verändern.
  async function expectDeniedUnchanged(attempt: () => Promise<unknown>, code: InvitationActionErrorCode) {
    const before = await world();
    await expectDenied(attempt(), code);
    assert.deepEqual(await world(), before);
  }

  describe("Erfolgsfall", () => {
    it("gültige Einladung → Mitarbeiter, Membership und angenommene Einladung in einem Schritt", async () => {
      const result = await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      assert.deepEqual(result, { alreadyAccepted: false });

      const { invitation, employee, membership } = await world();
      assert.equal(invitation?.status, "Angenommen");
      assert.equal(invitation?.acceptedAt, NOW.toISOString());
      assert.equal(invitation?.acceptedByUid, NEW_UID);
      assert.equal(invitation?.employeeId, EMP);
      assert.equal(invitation?.updatedAt, NOW.toISOString());

      assert.equal(employee?.name, "Neue Person");
      assert.equal(employee?.email, NEW_EMAIL);
      assert.equal(employee?.roleId, "pruefer");
      assert.equal(employee?.role, "Prüfer");
      assert.equal(employee?.status, "Aktiv");
      assert.equal(employee?.invitationStatus, "Angenommen");
      assert.equal(employee?.locationId, "loc-1");
      assert.equal(employee?.initials, "NP");
      assert.equal((employee?.history as unknown[]).length, 1);

      assert.deepEqual(membership, {
        companyId: COMPANY_A,
        employeeId: EMP,
        roleId: "pruefer",
        role: "Prüfer",
        status: "Aktiv",
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      });
    });

    it("Rollenname stammt aus dem Rollen-Dokument, nicht aus dem Snapshot der Einladung", async () => {
      await db.doc(invitationPath()).update({ role: "Manipulierter Snapshot" });
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      assert.equal((await data(employeePath()))?.role, "Prüfer");
      assert.equal((await data(membershipPath(NEW_UID)))?.role, "Prüfer");
    });

    it("E-Mail-Vergleich ignoriert Groß-/Kleinschreibung und Leerzeichen", async () => {
      await db.doc(invitationPath()).update({ email: "  Neu@Example.DE " });
      await acceptInvitation(db, verified(NEW_UID, "NEU@example.de"), REQUEST, NOW);
      assert.equal((await data(employeePath()))?.email, NEW_EMAIL);
    });

    it("Employee ↔ Membership sind danach konsistent (auditMemberLinks ohne Befund für den neuen Zugang)", async () => {
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      const employee = await data(employeePath());
      const membership = await data(membershipPath(NEW_UID));
      const findings = auditMemberLinks({
        employees: [{ id: EMP, roleId: employee?.roleId as string, status: employee?.status as string }],
        memberships: [
          {
            uid: NEW_UID,
            employeeId: membership?.employeeId as string,
            roleId: membership?.roleId as string,
            status: membership?.status as string,
          },
        ],
      });
      assert.deepEqual(findings, []);
    });

    it("geschützte Rolle (Administrator) kann angenommen werden; verwendet wird nur Invitation.roleId", async () => {
      await db.doc(invitationPath()).update({ roleId: "admin", role: "Administrator" });
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      assert.equal((await data(membershipPath(NEW_UID)))?.roleId, "admin");
    });

    it("die Rolle wird beim Annehmen NEU gelesen (Einladung nach Rollenwechsel → aktuelle roleId der Einladung)", async () => {
      await db.doc(invitationPath()).update({ roleId: "azubi", role: "Prüfer" });
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      assert.equal((await data(membershipPath(NEW_UID)))?.roleId, "azubi");
      assert.equal((await data(membershipPath(NEW_UID)))?.role, "Azubi");
    });
  });

  describe("Identität", () => {
    it("falsche E-Mail → invitation-not-found, nichts geschrieben (kein Status-Leak)", async () => {
      await expectDeniedUnchanged(() => acceptInvitation(db, verified(OTHER_UID, "andere@example.de"), REQUEST, NOW), "invitation-not-found");
    });

    it("E-Mail nicht verifiziert → email-not-verified, nichts geschrieben", async () => {
      await expectDeniedUnchanged(() => acceptInvitation(db, verified(NEW_UID, NEW_EMAIL, false), REQUEST, NOW), "email-not-verified");
    });

    it("kein E-Mail-Claim im Token → email-not-verified", async () => {
      await expectDeniedUnchanged(() => acceptInvitation(db, verified(NEW_UID, undefined), REQUEST, NOW), "email-not-verified");
    });

    it("emailVerified muss exakt true sein", async () => {
      await expectDeniedUnchanged(
        () => acceptInvitation(db, { uid: NEW_UID, email: NEW_EMAIL, emailVerified: "true" as unknown as boolean }, REQUEST, NOW),
        "email-not-verified"
      );
    });

    it("Wissen um die invitationId allein genügt nicht (andere verifizierte Identität bei widerrufener/abgelaufener Einladung → not-found)", async () => {
      await db.doc(invitationPath()).update({ status: "Widerrufen" });
      await expectDeniedUnchanged(() => acceptInvitation(db, verified(OTHER_UID, "andere@example.de"), REQUEST, NOW), "invitation-not-found");
    });

    it("unsichere uid → unauthenticated, Pfad-Injektion in den IDs → invalid-request", async () => {
      await expectDenied(acceptInvitation(db, verified("a/b", NEW_EMAIL), REQUEST, NOW), "unauthenticated");
      await expectDenied(acceptInvitation(db, NEW_PRINCIPAL, { companyId: "company-a/roles", invitationId: INV }, NOW), "invalid-request");
      await expectDenied(acceptInvitation(db, NEW_PRINCIPAL, { companyId: COMPANY_A, invitationId: "../x" }, NOW), "invalid-request");
    });
  });

  describe("Einladungszustand", () => {
    it("Einladung existiert nicht → invitation-not-found", async () => {
      await expectDenied(acceptInvitation(db, NEW_PRINCIPAL, { companyId: COMPANY_A, invitationId: "gibt-es-nicht" }, NOW), "invitation-not-found");
    });

    it("widerrufen → invitation-revoked, nichts geschrieben", async () => {
      await db.doc(invitationPath()).update({ status: "Widerrufen", revokedAt: NOW.toISOString() });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "invitation-revoked");
      assert.equal(await exists(employeePath()), false);
      assert.equal(await exists(membershipPath(NEW_UID)), false);
    });

    it("abgelaufen → invitation-expired; Ablauf genau zum Zeitpunkt noch gültig", async () => {
      await db.doc(invitationPath()).update({ expiresAt: "2026-02-28T10:00:00.000Z" });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "invitation-expired");
      await db.doc(invitationPath()).update({ expiresAt: NOW.toISOString() });
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      assert.equal((await data(membershipPath(NEW_UID)))?.status, "Aktiv");
    });

    it("kaputtes oder fehlendes expiresAt → invitation-invalid", async () => {
      await db.doc(invitationPath()).update({ expiresAt: "irgendwann" });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "invitation-invalid");
    });

    it("bereits von einem anderen Konto angenommen → invitation-already-accepted", async () => {
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      await db.doc(invitationPath()).update({ email: "andere@example.de" });
      await expectDeniedUnchanged(() => acceptInvitation(db, verified(OTHER_UID, "andere@example.de"), REQUEST, NOW), "invitation-already-accepted");
    });

    it("Einladung ohne roleId / mit leerer roleId → invitation-invalid (kein Rollenname-Fallback)", async () => {
      await db.doc(invitationPath()).update({ roleId: "" });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "invitation-invalid");
      await db.doc(invitationPath()).update({ roleId: 7 });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "invitation-invalid");
    });
  });

  describe("Rolle", () => {
    it("Rolle existiert nicht → role-not-found", async () => {
      await db.doc(invitationPath()).update({ roleId: "ghost-role" });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "role-not-found");
    });

    it("Rolle archiviert (zwischen Einladung und Annahme) → role-inactive, auch mit passendem Snapshot", async () => {
      await db.doc(invitationPath()).update({ roleId: ARCHIVED_ROLE, role: "Archiviert" });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "role-inactive");
      await db.doc(rolePath("pruefer")).update({ status: "Archiviert" });
      await db.doc(invitationPath()).update({ roleId: "pruefer" });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "role-inactive");
    });

    it("Rolle existiert nur in einer anderen Firma → role-not-found (keine Firmen-übergreifende Rolle)", async () => {
      await db.doc(invitationPath()).update({ roleId: COMPANY_B_ONLY_ROLE });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "role-not-found");
    });
  });

  describe("Firmenzuordnung", () => {
    it("die Firma der Membership ist die Firma, unter der die validierte Einladung liegt (Einladung in company-b)", async () => {
      await db.doc(invitationPath(INV, COMPANY_B)).set(invitationData("Ausstehend", { name: "B-Person", email: NEW_EMAIL, roleId: "pruefer" }));
      await acceptInvitation(db, NEW_PRINCIPAL, { companyId: COMPANY_B, invitationId: INV }, NOW);
      assert.equal((await data(membershipPath(NEW_UID)))?.companyId, COMPANY_B);
      assert.equal(await exists(employeePath(EMP, COMPANY_B)), true);
      assert.equal(await exists(employeePath(EMP, COMPANY_A)), false);
    });

    it("Einladung existiert nur in company-a, Request nennt company-b → nicht gefunden, nichts in company-a verändert", async () => {
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, { companyId: COMPANY_B, invitationId: INV }, NOW), "invitation-not-found");
      assert.equal(await exists(membershipPath(NEW_UID)), false);
    });

    it("Einladung in company-b, Request nennt company-a → nicht gefunden", async () => {
      await db.doc(invitationPath("inv-only-b", COMPANY_B)).set(invitationData("Ausstehend", { email: NEW_EMAIL, roleId: "pruefer" }));
      await expectDenied(acceptInvitation(db, NEW_PRINCIPAL, { companyId: COMPANY_A, invitationId: "inv-only-b" }, NOW), "invitation-not-found");
      assert.equal(await exists(membershipPath(NEW_UID)), false);
    });

    it("gleiche invitationId in zwei Firmen: nur die Einladung der genannten Firma wird angenommen", async () => {
      await db.doc(invitationPath(INV, COMPANY_B)).set(invitationData("Ausstehend", { email: NEW_EMAIL, roleId: "azubi" }));
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      assert.equal((await data(invitationPath(INV, COMPANY_B)))?.status, "Ausstehend");
      assert.equal((await data(membershipPath(NEW_UID)))?.companyId, COMPANY_A);
      assert.equal((await data(membershipPath(NEW_UID)))?.roleId, "pruefer");
    });
  });

  describe("Bestehende Membership / bestehender Mitarbeiter", () => {
    it("Membership einer anderen Firma → already-member, nichts überschrieben", async () => {
      await db.doc(membershipPath(NEW_UID)).set({ companyId: COMPANY_B, employeeId: "emp-b", roleId: "admin", role: "Administrator", status: "Aktiv" });
      const before = await data(membershipPath(NEW_UID));
      await expectDenied(acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "already-member");
      assert.deepEqual(await data(membershipPath(NEW_UID)), before);
      assert.equal((await data(invitationPath()))?.status, "Ausstehend");
      assert.equal(await exists(employeePath()), false);
    });

    it("Membership derselben Firma mit anderem Mitarbeiter/anderer Rolle → membership-conflict (fail-closed)", async () => {
      await db.doc(membershipPath(NEW_UID)).set({ companyId: COMPANY_A, employeeId: "emp-pruefer", roleId: "azubi", role: "Azubi", status: "Aktiv" });
      const before = await data(membershipPath(NEW_UID));
      await expectDenied(acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "membership-conflict");
      assert.deepEqual(await data(membershipPath(NEW_UID)), before);
      assert.equal((await data(invitationPath()))?.status, "Ausstehend");
    });

    it("gesperrte Membership wird NICHT still reaktiviert", async () => {
      await db.doc(membershipPath(NEW_UID)).set({ companyId: COMPANY_A, employeeId: "emp-pruefer", roleId: "pruefer", role: "Prüfer", status: "Gesperrt" });
      const before = await data(membershipPath(NEW_UID));
      await expectDenied(acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "membership-conflict");
      assert.deepEqual(await data(membershipPath(NEW_UID)), before);
      assert.equal((await data(membershipPath(NEW_UID)))?.status, "Gesperrt");
    });

    it("gesperrte Membership + passende, bereits angenommene Einladung → kein idempotenter Erfolg", async () => {
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      await db.doc(membershipPath(NEW_UID)).update({ status: "Gesperrt" });
      await expectDenied(acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "membership-conflict");
      assert.equal((await data(membershipPath(NEW_UID)))?.status, "Gesperrt");
    });

    it("Mitarbeiter an der geplanten ID existiert schon → employee-invalid, nichts geschrieben", async () => {
      await db.doc(employeePath()).set({ name: "Altbestand", status: "Gesperrt", roleId: "admin", role: "Administrator", history: [] });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "employee-invalid");
      assert.equal((await data(employeePath()))?.status, "Gesperrt");
    });

    it("anderer Mitarbeiter mit derselben E-Mail (auch gesperrt) → employee-invalid, keine stille Verknüpfung", async () => {
      await db.doc(employeePath("emp-old")).set({ name: "Alt", email: NEW_EMAIL, status: "Gesperrt", roleId: "admin", role: "Administrator", history: [] });
      await expectDeniedUnchanged(() => acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "employee-invalid");
      assert.equal((await data(employeePath("emp-old")))?.status, "Gesperrt");
      assert.equal(await exists(membershipPath(NEW_UID)), false);
    });
  });

  describe("Idempotenz", () => {
    it("zweite Annahme derselben UID → alreadyAccepted, keine Änderung (auch updatedAt unverändert)", async () => {
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      const before = await world();
      const later = new Date("2026-03-02T10:00:00.000Z");
      assert.deepEqual(await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, later), { alreadyAccepted: true });
      assert.deepEqual(await world(), before);
    });

    it("Wiederholung nach Widerruf der angenommenen Einladung ist nicht möglich, der Zugang bleibt bestehen", async () => {
      await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
      // Die Rules erlauben Widerruf nur für offene Einladungen; hier simuliert der Admin-Zugriff einen Fehlzustand.
      await db.doc(invitationPath()).update({ status: "Widerrufen" });
      await expectDenied(acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW), "invitation-revoked");
      assert.equal((await data(membershipPath(NEW_UID)))?.status, "Aktiv");
    });
  });

  describe("Atomizität (Rollback bei Schreibfehler)", () => {
    // Der Proxy lässt Schreibzugriffe passieren, bis auf den gewählten Typ/Pfad: dort bricht er ab. Die
    // Transaktion darf dann NICHTS committen (weder Mitarbeiter noch Membership noch Einladung).
    function failingWrite(method: "create" | "update", pathPrefix: string): Firestore {
      return new Proxy(db, {
        get(target, property, receiver) {
          if (property === "runTransaction") {
            return (updateFunction: (tx: Transaction) => Promise<unknown>) =>
              target.runTransaction((tx) =>
                updateFunction(
                  new Proxy(tx, {
                    get(txTarget, txProperty) {
                      if (txProperty === method) {
                        return (ref: DocumentReference, payload: object) => {
                          if (ref.path.startsWith(pathPrefix)) throw new Error("simulierter Schreibfehler");
                          return (txTarget[method] as (r: DocumentReference, p: object) => Transaction).call(txTarget, ref, payload);
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

    for (const [label, method, prefix] of [
      ["Membership-Write schlägt fehl", "create", "userMemberships/"],
      ["Mitarbeiter-Write schlägt fehl", "create", "companies/"],
      ["Einladungs-Update schlägt fehl (nach Mitarbeiter + Membership)", "update", "companies/"],
    ] as const) {
      it(`${label} → nichts committed, Einladung bleibt offen, erneuter Versuch gelingt`, async () => {
        const before = await world();
        await assert.rejects(acceptInvitation(failingWrite(method, prefix), NEW_PRINCIPAL, REQUEST, NOW), /simulierter Schreibfehler/);
        assert.deepEqual(await world(), before);
        assert.equal(await exists(employeePath()), false);
        assert.equal(await exists(membershipPath(NEW_UID)), false);
        assert.equal((await data(invitationPath()))?.status, "Ausstehend");

        await acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW);
        assert.equal((await data(membershipPath(NEW_UID)))?.status, "Aktiv");
      });
    }
  });

  describe("Parallelität", () => {
    const ROUNDS = 3;

    it("dieselbe UID zweimal gleichzeitig → genau ein Mitarbeiter und eine Membership, beide Aufrufe gelingen (einer idempotent)", async () => {
      for (let round = 0; round < ROUNDS; round += 1) {
        await db.doc(employeePath()).delete();
        await db.doc(membershipPath(NEW_UID)).delete();
        await db.doc(invitationPath()).set(invitationData("Ausstehend", { name: "Neue Person", email: NEW_EMAIL, roleId: "pruefer" }));

        const settled = await Promise.allSettled([
          acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW),
          acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW),
        ]);
        assert.deepEqual(settled.map((result) => result.status), ["fulfilled", "fulfilled"], `Runde ${round}`);
        const flags = settled.map((result) => (result as PromiseFulfilledResult<{ alreadyAccepted: boolean }>).value.alreadyAccepted);
        assert.equal(flags.filter(Boolean).length, 1, `Runde ${round}: genau ein idempotenter Aufruf`);

        const employees = await db.collection(`companies/${COMPANY_A}/employees`).where("email", "==", NEW_EMAIL).get();
        assert.equal(employees.size, 1, `Runde ${round}: genau ein Mitarbeiter`);
        assert.equal((await data(membershipPath(NEW_UID)))?.employeeId, EMP);
        assert.equal((await data(invitationPath()))?.acceptedByUid, NEW_UID);
      }
    });

    it("zwei verschiedene Konten (nur eines mit passender E-Mail) → nur das passende Konto wird provisioniert", async () => {
      for (let round = 0; round < ROUNDS; round += 1) {
        await db.doc(employeePath()).delete();
        await db.doc(membershipPath(NEW_UID)).delete();
        await db.doc(membershipPath(OTHER_UID)).delete();
        await db.doc(invitationPath()).set(invitationData("Ausstehend", { name: "Neue Person", email: NEW_EMAIL, roleId: "pruefer" }));

        const settled = await Promise.allSettled([
          acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW),
          acceptInvitation(db, verified(OTHER_UID, "andere@example.de"), REQUEST, NOW),
        ]);
        assert.equal(settled[0].status, "fulfilled", `Runde ${round}`);
        assert.equal(settled[1].status, "rejected", `Runde ${round}`);
        const reason = (settled[1] as PromiseRejectedResult).reason;
        assert.ok(reason instanceof InvitationActionError);
        assert.ok(["invitation-not-found", "invitation-already-accepted"].includes(reason.code), reason.code);
        assert.equal(await exists(membershipPath(OTHER_UID)), false, `Runde ${round}: fremdes Konto ohne Membership`);
        assert.equal((await data(membershipPath(NEW_UID)))?.companyId, COMPANY_A);
      }
    });

    it("zwei Konten mit (hypothetisch) gleicher E-Mail → genau eines gewinnt, das andere wird abgelehnt", async () => {
      for (let round = 0; round < ROUNDS; round += 1) {
        await db.doc(employeePath()).delete();
        await db.doc(membershipPath(NEW_UID)).delete();
        await db.doc(membershipPath(OTHER_UID)).delete();
        await db.doc(invitationPath()).set(invitationData("Ausstehend", { name: "Neue Person", email: NEW_EMAIL, roleId: "pruefer" }));

        const settled = await Promise.allSettled([
          acceptInvitation(db, NEW_PRINCIPAL, REQUEST, NOW),
          acceptInvitation(db, verified(OTHER_UID, NEW_EMAIL), REQUEST, NOW),
        ]);
        const fulfilled = settled.filter((result) => result.status === "fulfilled");
        const rejected = settled.filter((result): result is PromiseRejectedResult => result.status === "rejected");
        assert.equal(fulfilled.length, 1, `Runde ${round}: genau ein Gewinner`);
        assert.equal(rejected.length, 1);
        assert.ok(rejected[0].reason instanceof InvitationActionError);
        assert.equal(rejected[0].reason.code, "invitation-already-accepted");

        const memberships = await db.collection("userMemberships").where("employeeId", "==", EMP).get();
        assert.equal(memberships.size, 1, `Runde ${round}: genau eine Membership für den Mitarbeiter`);
        const winnerUid = memberships.docs[0].id;
        assert.equal((await data(invitationPath()))?.acceptedByUid, winnerUid);
      }
    });
  });

  // ---------------------------------------------------------------------------------------------------------
  describe("HTTP-Schicht", () => {
    const deps = (overrides: Partial<InvitationActionDeps> = {}): InvitationActionDeps => ({
      verifyPrincipal: async (token) => {
        const principal = PRINCIPALS[token];
        if (!principal) throw new Error("ungültiges Token");
        return principal;
      },
      getDb: () => db,
      now: () => NOW,
      ...overrides,
    });

    const post = (body: unknown, token?: string, raw?: string) =>
      new Request("http://localhost/api/invitation-actions/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: raw ?? JSON.stringify(body),
      });

    async function codeOf(response: Response) {
      const json = (await response.json()) as { ok: boolean; code?: string; message?: string; alreadyAccepted?: boolean };
      return { status: response.status, ...json };
    }

    it("gültiges Token + Body → 200 ok, Zugang angelegt", async () => {
      const result = await codeOf(await handleAcceptInvitationRequest(post(REQUEST, `token-${NEW_UID}`), deps()));
      assert.equal(result.status, 200);
      assert.equal(result.ok, true);
      assert.equal(result.alreadyAccepted, false);
      assert.equal((await data(membershipPath(NEW_UID)))?.employeeId, EMP);
    });

    it("zweiter identischer Request → 200 mit alreadyAccepted: true", async () => {
      await handleAcceptInvitationRequest(post(REQUEST, `token-${NEW_UID}`), deps());
      const result = await codeOf(await handleAcceptInvitationRequest(post(REQUEST, `token-${NEW_UID}`), deps()));
      assert.equal(result.status, 200);
      assert.equal(result.alreadyAccepted, true);
    });

    it("kein Token → 401 unauthenticated, nichts geschrieben", async () => {
      const before = await world();
      const result = await codeOf(await handleAcceptInvitationRequest(post(REQUEST), deps()));
      assert.equal(result.status, 401);
      assert.equal(result.code, "unauthenticated");
      assert.deepEqual(await world(), before);
    });

    it("falsches Schema im Authorization-Header → 401", async () => {
      const request = new Request("http://localhost/x", { method: "POST", headers: { Authorization: "Basic abc" }, body: "{}" });
      assert.equal((await codeOf(await handleAcceptInvitationRequest(request, deps()))).code, "unauthenticated");
    });

    it("ungültiges Token (Fake-Verifier) → 401", async () => {
      const result = await codeOf(await handleAcceptInvitationRequest(post(REQUEST, "kaputt"), deps()));
      assert.equal(result.status, 401);
      assert.equal(result.code, "unauthenticated");
    });

    it("ungültiges Token mit der ECHTEN Admin-SDK-Prüfung → 401 unauthenticated", async () => {
      const result = await codeOf(
        await handleAcceptInvitationRequest(post(REQUEST, "kein.gueltiges.token"), {
          verifyPrincipal: verifyFirebaseIdPrincipal,
          getDb: () => db,
          now: () => NOW,
        })
      );
      assert.equal(result.status, 401);
      assert.equal(result.code, "unauthenticated");
    });

    it("E-Mail nicht verifiziert → 403 email-not-verified", async () => {
      const result = await codeOf(await handleAcceptInvitationRequest(post(REQUEST, "token-unverified"), deps()));
      assert.equal(result.status, INVITATION_ACTION_HTTP_STATUS["email-not-verified"]);
      assert.equal(result.code, "email-not-verified");
      assert.equal(await exists(membershipPath(NEW_UID)), false);
    });

    it("fremdes Konto → invitation-not-found (404)", async () => {
      const result = await codeOf(await handleAcceptInvitationRequest(post(REQUEST, `token-${OTHER_UID}`), deps()));
      assert.equal(result.status, 404);
      assert.equal(result.code, "invitation-not-found");
    });

    it("ungültiges JSON, zu großer Body, fehlende oder unsichere IDs → 400 invalid-request", async () => {
      const bodies: Array<[unknown, string | undefined]> = [
        [undefined, "{kein json"],
        [undefined, JSON.stringify({ companyId: COMPANY_A, invitationId: INV, pad: "x".repeat(5000) })],
        [{}, undefined],
        [{ companyId: COMPANY_A }, undefined],
        [{ companyId: COMPANY_A, invitationId: "a/b" }, undefined],
        [{ companyId: "company-a/roles/admin", invitationId: INV }, undefined],
        [[REQUEST], undefined],
      ];
      for (const [body, raw] of bodies) {
        const result = await codeOf(await handleAcceptInvitationRequest(post(body, `token-${NEW_UID}`, raw), deps()));
        assert.equal(result.status, 400, JSON.stringify(body) ?? raw);
        assert.equal(result.code, "invalid-request");
      }
      assert.equal(await exists(membershipPath(NEW_UID)), false);
    });

    it("Body-Limit zählt UTF-8-Bytes: exakt 2048 Bytes ok, 2049 → 400; Mehrbyte-Zeichen (Zeichenzahl < 2048, Bytes > 2048) → 400", async () => {
      const padTo = (bytes: number, filler: string) => {
        const base = JSON.stringify({ ...REQUEST, pad: "" });
        const fillerBytes = new TextEncoder().encode(filler).length;
        const count = Math.floor((bytes - new TextEncoder().encode(base).length) / fillerBytes);
        let raw = JSON.stringify({ ...REQUEST, pad: filler.repeat(count) });
        // mit ASCII-Zeichen exakt auf die Zielgröße auffüllen
        raw = raw.replace(/"pad":"/, `"pad":"${"x".repeat(bytes - new TextEncoder().encode(raw).length)}`);
        return raw;
      };
      const exact = padTo(2048, "x");
      assert.equal(new TextEncoder().encode(exact).length, 2048);
      assert.equal((await codeOf(await handleAcceptInvitationRequest(post(undefined, `token-${NEW_UID}`, exact), deps()))).status, 200);

      await db.doc(membershipPath(NEW_UID)).delete();
      await db.doc(employeePath()).delete();
      await db.doc(invitationPath()).set(invitationData("Ausstehend", { name: "Neue Person", email: NEW_EMAIL, roleId: "pruefer" }));
      const over = padTo(2049, "x");
      assert.equal(new TextEncoder().encode(over).length, 2049);
      const overResult = await codeOf(await handleAcceptInvitationRequest(post(undefined, `token-${NEW_UID}`, over), deps()));
      assert.equal(overResult.status, 400);
      assert.equal(overResult.code, "invalid-request");
      assert.equal(await exists(membershipPath(NEW_UID)), false);

      const multibyte = JSON.stringify({ ...REQUEST, pad: "ä".repeat(1100) });
      assert.ok(multibyte.length < 2048, "Zeichenzahl unter dem Limit");
      assert.ok(new TextEncoder().encode(multibyte).length > 2048, "Bytezahl über dem Limit");
      const multiResult = await codeOf(await handleAcceptInvitationRequest(post(undefined, `token-${NEW_UID}`, multibyte), deps()));
      assert.equal(multiResult.status, 400);
      assert.equal(multiResult.code, "invalid-request");
      assert.equal(await exists(membershipPath(NEW_UID)), false);
    });

    it("gefälschte Felder im Body (uid, email, employeeId, roleId, role, status, isAdmin, permissions, actorRole) werden ignoriert", async () => {
      const result = await codeOf(
        await handleAcceptInvitationRequest(
          post(
            {
              ...REQUEST,
              uid: OTHER_UID,
              email: "andere@example.de",
              employeeId: "emp-admin",
              roleId: "admin",
              role: "Administrator",
              status: "Aktiv",
              isAdmin: true,
              permissions: { "rollen.admin_verwalten": true },
              actorRole: "admin",
            },
            `token-${NEW_UID}`
          ),
          deps()
        )
      );
      assert.equal(result.status, 200);
      const membership = await data(membershipPath(NEW_UID));
      assert.equal(membership?.roleId, "pruefer");
      assert.equal(membership?.employeeId, EMP);
      assert.equal(await exists(membershipPath(OTHER_UID)), false);
      // Der vorhandene Administrator-Datensatz bleibt unangetastet.
      assert.equal((await data(employeePath("emp-admin")))?.roleId, "admin");
      assert.equal((await data(membershipPath(P.admin)))?.roleId, "admin");
    });

    it("fehlende Server-Konfiguration → 503 server-not-configured", async () => {
      const result = await codeOf(
        await handleAcceptInvitationRequest(
          post(REQUEST, "token-x"),
          deps({
            verifyPrincipal: async () => {
              throw new MemberActionError("server-not-configured");
            },
          })
        )
      );
      assert.equal(result.status, 503);
      assert.equal(result.code, "server-not-configured");
    });

    it("unerwarteter Fehler → 500 internal-error ohne Interna (kein Pfad, keine E-Mail, kein Token)", async () => {
      const originalError = console.error;
      const logged: string[] = [];
      console.error = (...args: unknown[]) => void logged.push(args.map(String).join(" "));
      try {
        const response = await handleAcceptInvitationRequest(
          post(REQUEST, `token-${NEW_UID}`),
          deps({
            getDb: () => {
              throw new Error("boom companies/company-a/invitations/inv-accept neu@example.de token-u-new");
            },
          })
        );
        const text = await response.text();
        assert.equal(response.status, 500);
        assert.equal(JSON.parse(text).code, "internal-error");
        for (const secret of ["company-a", "inv-accept", NEW_EMAIL, "token-u-new", "boom"]) {
          assert.equal(text.includes(secret), false, `Antwort enthält ${secret}`);
          assert.equal(logged.join("\n").includes(secret), false, `Log enthält ${secret}`);
        }
      } finally {
        console.error = originalError;
      }
    });

    it("Fehlerantworten enthalten weder E-Mail noch Pfade noch IDs der Einladung", async () => {
      await db.doc(invitationPath()).update({ status: "Widerrufen" });
      const response = await handleAcceptInvitationRequest(post(REQUEST, `token-${NEW_UID}`), deps());
      const text = await response.text();
      assert.equal(JSON.parse(text).code, "invitation-revoked");
      for (const secret of [NEW_EMAIL, "companies/", INV, "emp-"]) assert.equal(text.includes(secret), false, secret);
    });
  });
});
