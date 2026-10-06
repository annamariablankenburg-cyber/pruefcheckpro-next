// Phase 1: employees – eigenes Dokument lesen, Verwalten, Self-Promotion-Schutz
// und Schutz von Administratoren/Restricted-Rollen.
//
// Hinweis: Diese Regeln betreffen nur das Mitarbeiter-DOKUMENT. Die wirksame
// Rolle eines Users ist die seiner Membership (userMemberships/{uid}.roleId);
// eine Änderung von employees.roleId ändert sie nicht (kein Server-Sync).
import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

import {
  ARCHIVED_ROLE,
  BILLING_ROLE,
  COMPANY_A,
  HR_ROLE,
  NORMAL_DELETE_ROLE,
  P,
  PROTECTED_DELETE_ROLES,
  collectionPath,
  seedMembership,
  seedPhase1World,
} from "./helpers/fixtures";
import { asUser, createTestEnv, seed } from "./helpers/testEnv";

const employees = collectionPath("employees", COMPANY_A);
const T = "2026-03-01T00:00:00.000Z";

describe("Phase 1: employees", () => {
  let env: RulesTestEnvironment;

  before(async () => {
    env = await createTestEnv();
  });
  after(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await seedPhase1World(env);
  });

  const ref = (uid: string, id: string) => doc(asUser(env, uid), employees, id);

  describe("lesen: eigenes Dokument über membership.employeeId", () => {
    it("Prüfer liest sein eigenes Dokument (ohne mitarbeiter.ansehen) → ALLOW", async () => {
      await assertSucceeds(getDoc(ref(P.pruefer, "emp-pruefer")));
    });

    it("Gast liest sein eigenes Dokument → ALLOW", async () => {
      await assertSucceeds(getDoc(ref(P.gast, "emp-gast")));
    });

    it("Azubi liest das Dokument eines anderen Mitarbeiters → DENY", async () => {
      await assertFails(getDoc(ref(P.azubi, "emp-pruefer")));
    });

    it("Prüfer listet alle Mitarbeiter → DENY (kein list über „eigenes Dokument“)", async () => {
      await assertFails(getDocs(collection(asUser(env, P.pruefer), employees)));
    });

    it("Membership ohne employeeId liest kein Dokument (kein Abgleich über Name/E-Mail) → DENY", async () => {
      await assertFails(getDoc(ref(P.noRoleId, "emp-target")));
    });

    it("gesperrte Membership liest ihr eigenes Dokument → DENY", async () => {
      await seedMembership(env, "u-blocked-with-employee", {
        companyId: COMPANY_A,
        status: "Gesperrt",
        roleId: "pruefer",
        employeeId: "emp-pruefer",
      });
      await assertFails(getDoc(ref("u-blocked-with-employee", "emp-pruefer")));
    });

    it("Mitglied einer anderen Firma liest das Dokument → DENY", async () => {
      await assertFails(getDoc(ref(P.wrongCompany, "emp-pruefer")));
    });

    it("Administrator und Laborleiter lesen und listen alle → ALLOW", async () => {
      await assertSucceeds(getDoc(ref(P.admin, "emp-target")));
      await assertSucceeds(getDocs(collection(asUser(env, P.laborleiter), employees)));
    });
  });

  describe("verwalten (administration.mitarbeiter_verwalten)", () => {
    it("Laborleiter ändert den Standort eines normalen Mitarbeiters → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { location: "Labor München", locationId: "loc-2", updatedAt: T }));
    });

    it("Laborleiter sperrt einen normalen Mitarbeiter (status + Historie) → ALLOW", async () => {
      await assertSucceeds(
        updateDoc(ref(P.laborleiter, "emp-target"), {
          status: "Gesperrt",
          history: [{ message: "Zugriff temporär gesperrt.", timestamp: "01.03.2026" }],
          updatedAt: T,
        })
      );
    });

    it("Laborleiter ändert die Rolle eines Prüfers auf Azubi / Baustellenleiter / HR (nicht restricted) → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { role: "Azubi", roleId: "azubi", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { role: "Baustellenleiter", roleId: "baustellenleiter", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { role: "HR", roleId: HR_ROLE, updatedAt: T }));
    });

    it("Custom Role mit mitarbeiter_verwalten (ohne Admin-Schlüssel) ändert einen normalen Mitarbeiter → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.hr, "emp-target"), { location: "Labor München", locationId: "loc-2", updatedAt: T }));
    });

    it("Prüfer, Azubi, Gast, Baustellenleiter ändern einen Mitarbeiter → DENY", async () => {
      for (const uid of [P.pruefer, P.azubi, P.gast, P.baustellenleiter]) {
        await assertFails(updateDoc(ref(uid, "emp-target"), { location: "x", updatedAt: T }));
      }
    });

    it("Anlegen → DENY, auch für den Administrator (Phase 1: nur serverseitig)", async () => {
      await assertFails(setDoc(ref(P.admin, "emp-new"), { name: "Neu", email: "neu@example.de", role: "Prüfer", roleId: "pruefer" }));
      await assertFails(setDoc(ref(P.laborleiter, "emp-new"), { name: "Neu", email: "neu@example.de" }));
    });

    it("Löschen → DENY für Administrator, Laborleiter und die Person selbst", async () => {
      await assertFails(deleteDoc(ref(P.admin, "emp-target")));
      await assertFails(deleteDoc(ref(P.laborleiter, "emp-target")));
      await assertFails(deleteDoc(ref(P.pruefer, "emp-pruefer")));
    });
  });

  describe("Administratoren und Restricted-Rollen sind für den Laborleiter tabu", () => {
    it("Laborleiter ändert einen Administrator (beliebiges Feld) → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-admin-2"), { location: "x", updatedAt: T }));
    });

    it("Laborleiter sperrt einen Administrator → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-admin-2"), { status: "Gesperrt", updatedAt: T }));
    });

    it("Laborleiter setzt einen normalen Mitarbeiter auf die Administrator-Rolle → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { role: "Administrator", roleId: "admin", updatedAt: T }));
    });

    it("Laborleiter setzt einen Mitarbeiter auf eine Rolle mit Restricted-Schlüssel (Billing) → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { role: "Billing", roleId: BILLING_ROLE, updatedAt: T }));
    });

    it("Laborleiter setzt einen Mitarbeiter auf eine archivierte Rolle mit Restricted-Schlüsseln → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { roleId: ARCHIVED_ROLE, updatedAt: T }));
    });

    it("Laborleiter ändert einen Mitarbeiter, dessen aktuelle Rolle Restricted-Schlüssel enthält → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-billing"), { location: "x", updatedAt: T }));
    });

    it("Laborleiter setzt eine unbekannte Rolle → DENY (fail-closed)", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { roleId: "ghost-role", updatedAt: T }));
    });

    it("Laborleiter entfernt die roleId (deleteField) → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { roleId: deleteField(), updatedAt: T }));
    });

    it("Laborleiter ändert einen Mitarbeiter ohne roleId (Altdaten) → DENY (nicht auflösbar, fail-closed)", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-legacy-no-roleid"), { location: "x", updatedAt: T }));
    });

    it("Custom Role ohne Admin-Schlüssel (HR) ändert einen Administrator oder vergibt Admin → DENY", async () => {
      await assertFails(updateDoc(ref(P.hr, "emp-admin-2"), { location: "x", updatedAt: T }));
      await assertFails(updateDoc(ref(P.hr, "emp-target"), { roleId: "admin", updatedAt: T }));
    });

    it("Administrator darf all das (hat rollen.admin_verwalten) → ALLOW", async () => {
      const admin = P.admin;
      await assertSucceeds(updateDoc(ref(admin, "emp-target"), { role: "Administrator", roleId: "admin", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(admin, "emp-target-2"), { roleId: BILLING_ROLE, updatedAt: T }));
      await assertSucceeds(updateDoc(ref(admin, "emp-admin-2"), { status: "Gesperrt", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(admin, "emp-billing"), { location: "x", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(admin, "emp-legacy-no-roleid"), { roleId: "admin", updatedAt: T }));
    });
  });

  // Policy: Jede Rolle mit einem der 7 geschützten Schlüssel (4 Restricted + geraete./laborbuch./
  // berichte.loeschen) ist nur mit rollen.admin_verwalten zuweisbar – egal ob System-, Custom- oder
  // archivierte Rolle.
  describe("Zuweisung geschützter Rollen (Restricted UND Admin-only-Löschrechte)", () => {
    for (const [key, roleId] of Object.entries(PROTECTED_DELETE_ROLES)) {
      it(`Laborleiter weist einem Mitarbeiter eine Rolle mit ${key} zu → DENY; Administrator → ALLOW`, async () => {
        await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { role: roleId, roleId, updatedAt: T }));
        await assertSucceeds(updateDoc(ref(P.admin, "emp-target"), { role: roleId, roleId, updatedAt: T }));
      });
    }

    it("Laborleiter ändert einen Mitarbeiter, dessen AKTUELLE Rolle Admin-only-Löschrechte enthält → DENY; Administrator → ALLOW", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-deleter"), { location: "x", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.admin, "emp-deleter"), { location: "x", updatedAt: T }));
    });

    it("Laborleiter weist eine Systemrolle zu, die (z. B. nach Admin-Konfiguration) ein Admin-only-Löschrecht enthält → DENY", async () => {
      await seed(env, async (firestore) => {
        await setDoc(
          doc(firestore, collectionPath("roles", COMPANY_A), "azubi"),
          { permissions: { "berichte.loeschen": true } },
          { merge: true }
        );
      });
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { role: "Azubi", roleId: "azubi", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.admin, "emp-target"), { role: "Azubi", roleId: "azubi", updatedAt: T }));
    });

    it("Laborleiter weist eine normale Rolle zu (proben.loeschen ist NICHT geschützt) → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { role: "Proben-Löscher", roleId: NORMAL_DELETE_ROLE, updatedAt: T }));
    });

    it("Laborleiter weist weiterhin normale Systemrollen ohne geschützte Schlüssel zu (Prüfer, Azubi, Gast) → ALLOW", async () => {
      for (const roleId of ["pruefer", "azubi", "gast"]) {
        await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { roleId, updatedAt: T }));
      }
    });
  });

  describe("Self-Promotion und Selbstsperre", () => {
    it("Laborleiter ändert seine eigene roleId auf einen Administrator → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { role: "Administrator", roleId: "admin", updatedAt: T }));
    });

    it("Laborleiter ändert seine eigene roleId auf eine harmlose Rolle → DENY (eigene Rolle nie ändern)", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { roleId: "azubi", updatedAt: T }));
    });

    it("Laborleiter ändert nur seinen eigenen Rollen-Snapshot (role) → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { role: "Administrator", updatedAt: T }));
    });

    // Hilfsfunktion: setzt den Status eines Mitarbeiter-Dokuments direkt (mit deaktivierten Rules),
    // damit ein ECHTER Statuswechsel getestet wird. Ein Write mit dem bereits gespeicherten Wert ist
    // kein Statuswechsel (diff().affectedKeys() enthält status dann nicht).
    const setStoredStatus = (id: string, status: string) =>
      seed(env, async (firestore) => {
        await updateDoc(doc(firestore, employees, id), { status });
      });

    it("Laborleiter sperrt sich selbst (eigener Status Aktiv → Gesperrt) → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { status: "Gesperrt", updatedAt: T }));
    });

    it("Laborleiter entsperrt sich selbst (eigener Status Gesperrt → Aktiv) → DENY", async () => {
      await setStoredStatus("emp-laborleiter", "Gesperrt");
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { status: "Aktiv", updatedAt: T }));
    });

    it("Laborleiter schmuggelt den Statuswechsel zusammen mit einem erlaubten Feld ein → DENY", async () => {
      await assertFails(
        updateDoc(ref(P.laborleiter, "emp-laborleiter"), { location: "Labor München", locationId: "loc-2", status: "Gesperrt", updatedAt: T })
      );
    });

    it("Laborleiter sperrt UND entsperrt einen normalen FREMDEN Mitarbeiter → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { status: "Gesperrt", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { status: "Aktiv", updatedAt: T }));
    });

    it("Laborleiter entsperrt einen bereits gesperrten fremden Mitarbeiter (Gesperrt → Aktiv) → ALLOW", async () => {
      await setStoredStatus("emp-target", "Gesperrt");
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { status: "Aktiv", updatedAt: T }));
    });

    it("Laborleiter ändert unkritische Felder seines eigenen Dokuments (Standort, Kontaktdaten) → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { location: "Labor München", locationId: "loc-2", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { phone: "+49 711 0000", updatedAt: T }));
    });

    it("Laborleiter schreibt seinen eigenen, unveränderten Status (kein Wechsel) → ALLOW (kein Security-Zustand ändert sich)", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { status: "Aktiv", updatedAt: T }));
    });

    it("Administrator ändert seine eigene Rolle oder seinen Status → DENY", async () => {
      await assertFails(updateDoc(ref(P.admin, "emp-admin"), { roleId: "laborleiter", updatedAt: T }));
      await assertFails(updateDoc(ref(P.admin, "emp-admin"), { role: "Laborleiter", updatedAt: T }));
      await assertFails(updateDoc(ref(P.admin, "emp-admin"), { status: "Gesperrt", updatedAt: T }));
    });

    it("Administrator entsperrt sich selbst (eigener Status Gesperrt → Aktiv) → DENY", async () => {
      await seed(env, async (firestore) => {
        await updateDoc(doc(firestore, employees, "emp-admin"), { status: "Gesperrt" });
      });
      await assertFails(updateDoc(ref(P.admin, "emp-admin"), { status: "Aktiv", updatedAt: T }));
    });

    it("Administrator ändert unkritische Felder seines eigenen Dokuments → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.admin, "emp-admin"), { location: "Labor München", locationId: "loc-2", updatedAt: T }));
    });

    it("Administrator ändert Rolle/Status eines ANDEREN Administrators → ALLOW (nicht „selbst“)", async () => {
      await assertSucceeds(updateDoc(ref(P.admin, "emp-admin-2"), { roleId: "laborleiter", updatedAt: T }));
    });
  });

  describe("Migration: Rolle vor der Migration (nur 31 Schlüssel)", () => {
    it("Legacy-Administrator verliert Lesezugriff auf Mitarbeiter (mitarbeiter.ansehen fehlt) → DENY, behält Verwalten", async () => {
      await assertFails(getDocs(collection(asUser(env, P.legacyAdmin), employees)));
      await assertFails(getDoc(ref(P.legacyAdmin, "emp-target")));
      // mitarbeiter_verwalten existiert als Legacy-Schlüssel -> Schreiben bleibt möglich.
      await assertSucceeds(updateDoc(ref(P.legacyAdmin, "emp-target"), { location: "x", updatedAt: T }));
    });
  });
});
