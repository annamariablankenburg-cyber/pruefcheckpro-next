// Phase 1: employees – eigenes Dokument lesen, Verwalten unkritischer Felder und
// Schutz von Administratoren/Restricted-Rollen.
//
// Rolle (roleId/role) und Status eines Mitarbeiters ändert der CLIENT nie: Das
// geschieht ausschließlich serverseitig und gemeinsam mit der Membership
// (docs/firebase/member-security-actions.md; Tests: member-actions.test.ts). Die
// Rules verbieten diese Felder für alle Clients, auch für den Administrator.
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

  // Setzt den Status direkt (mit deaktivierten Rules), damit ein ECHTER Statuswechsel getestet wird.
  const setStoredStatus = (id: string, status: string) =>
    seed(env, async (firestore) => {
      await updateDoc(doc(firestore, employees, id), { status });
    });

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

  describe("verwalten (administration.mitarbeiter_verwalten): unkritische Felder", () => {
    it("Laborleiter ändert den Standort eines normalen Mitarbeiters → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-target"), { location: "Labor München", locationId: "loc-2", updatedAt: T }));
    });

    it("Laborleiter ändert Kontaktdaten und hängt einen Historieneintrag an → ALLOW", async () => {
      await assertSucceeds(
        updateDoc(ref(P.laborleiter, "emp-target"), {
          phone: "+49 711 0000",
          history: [{ message: "Standort auf „Labor München“ geändert.", timestamp: "01.03.2026" }],
          updatedAt: T,
        })
      );
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

  // Rolle (roleId/role) und Status ändern ausschließlich der Server (Admin SDK):
  // Mitarbeiter UND Membership werden gemeinsam geändert (docs/firebase/member-security-actions.md).
  // Für den Client gilt das ausnahmslos – auch für den Administrator, auch am eigenen Dokument.
  describe("Sicherheitsfelder roleId / role / status sind für ALLE Clients gesperrt", () => {
    const ACTORS: Array<[string, string]> = [
      ["Administrator", P.admin],
      ["zweiter Administrator", P.admin2],
      ["Laborleiter", P.laborleiter],
      ["HR-Rolle (mitarbeiter_verwalten)", P.hr],
      ["Legacy-Administrator (31 Schlüssel)", P.legacyAdmin],
    ];

    for (const [name, uid] of ACTORS) {
      describe(name, () => {
        it("ändert roleId eines normalen Mitarbeiters → DENY", async () => {
          await assertFails(updateDoc(ref(uid, "emp-target"), { roleId: "azubi", updatedAt: T }));
          await assertFails(updateDoc(ref(uid, "emp-target"), { role: "Azubi", roleId: "azubi", updatedAt: T }));
        });

        it("ändert nur den Rollen-Snapshot role → DENY", async () => {
          await assertFails(updateDoc(ref(uid, "emp-target"), { role: "Administrator", updatedAt: T }));
        });

        it("entfernt roleId (deleteField) oder fügt sie bei Altdaten hinzu → DENY", async () => {
          await assertFails(updateDoc(ref(uid, "emp-target"), { roleId: deleteField(), updatedAt: T }));
          await assertFails(updateDoc(ref(uid, "emp-legacy-no-roleid"), { roleId: "pruefer", updatedAt: T }));
        });

        it("sperrt einen normalen Mitarbeiter (Aktiv → Gesperrt) → DENY", async () => {
          await assertFails(updateDoc(ref(uid, "emp-target"), { status: "Gesperrt", updatedAt: T }));
        });

        it("reaktiviert einen gesperrten Mitarbeiter (Gesperrt → Aktiv) → DENY", async () => {
          await setStoredStatus("emp-target", "Gesperrt");
          await assertFails(updateDoc(ref(uid, "emp-target"), { status: "Aktiv", updatedAt: T }));
        });

        it("schmuggelt eine Rollen-/Statusänderung zusammen mit einem erlaubten Feld ein → DENY", async () => {
          await assertFails(
            updateDoc(ref(uid, "emp-target"), { location: "Labor München", locationId: "loc-2", status: "Gesperrt", updatedAt: T })
          );
          await assertFails(
            updateDoc(ref(uid, "emp-target"), { location: "Labor München", locationId: "loc-2", roleId: "azubi", updatedAt: T })
          );
        });

        it("schreibt Rolle/Status unverändert (kein Wechsel) zusammen mit einem erlaubten Feld → ALLOW (nichts ändert sich)", async () => {
          await assertSucceeds(updateDoc(ref(uid, "emp-target"), { status: "Aktiv", roleId: "pruefer", location: "Labor München", locationId: "loc-2", updatedAt: T }));
        });
      });
    }

    it("Administrator ändert Rolle/Status eines ANDEREN Administrators → DENY (nur Server)", async () => {
      await assertFails(updateDoc(ref(P.admin, "emp-admin-2"), { roleId: "laborleiter", updatedAt: T }));
      await assertFails(updateDoc(ref(P.admin, "emp-admin-2"), { status: "Gesperrt", updatedAt: T }));
    });

    it("Administrator vergibt eine geschützte Rolle (Billing, Löscher, Administrator) → DENY (nur Server)", async () => {
      await assertFails(updateDoc(ref(P.admin, "emp-target"), { role: "Administrator", roleId: "admin", updatedAt: T }));
      await assertFails(updateDoc(ref(P.admin, "emp-target-2"), { roleId: BILLING_ROLE, updatedAt: T }));
      for (const roleId of Object.values(PROTECTED_DELETE_ROLES)) {
        await assertFails(updateDoc(ref(P.admin, "emp-target"), { role: roleId, roleId, updatedAt: T }));
      }
      await assertFails(updateDoc(ref(P.admin, "emp-target"), { roleId: ARCHIVED_ROLE, updatedAt: T }));
    });

    it("Laborleiter setzt eine unbekannte oder normale Rolle (HR, Proben-Löscher) → DENY (nur Server)", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { roleId: "ghost-role", updatedAt: T }));
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { role: "HR", roleId: HR_ROLE, updatedAt: T }));
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { role: "Proben-Löscher", roleId: NORMAL_DELETE_ROLE, updatedAt: T }));
    });

    it("Self-Promotion: Laborleiter ändert seine eigene roleId/role/status → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { role: "Administrator", roleId: "admin", updatedAt: T }));
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { roleId: "azubi", updatedAt: T }));
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { role: "Administrator", updatedAt: T }));
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { status: "Gesperrt", updatedAt: T }));
    });

    it("Selbstsperre: Administrator ändert seine eigene Rolle oder seinen Status → DENY", async () => {
      await assertFails(updateDoc(ref(P.admin, "emp-admin"), { roleId: "laborleiter", updatedAt: T }));
      await assertFails(updateDoc(ref(P.admin, "emp-admin"), { role: "Laborleiter", updatedAt: T }));
      await assertFails(updateDoc(ref(P.admin, "emp-admin"), { status: "Gesperrt", updatedAt: T }));
    });

    it("Entsperren des eigenen Dokuments (Gesperrt → Aktiv) → DENY", async () => {
      await setStoredStatus("emp-laborleiter", "Gesperrt");
      await assertFails(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { status: "Aktiv", updatedAt: T }));
      await setStoredStatus("emp-admin", "Gesperrt");
      await assertFails(updateDoc(ref(P.admin, "emp-admin"), { status: "Aktiv", updatedAt: T }));
    });

    it("unkritische Felder des EIGENEN Dokuments (Standort, Kontaktdaten) → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { location: "Labor München", locationId: "loc-2", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { phone: "+49 711 0000", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.admin, "emp-admin"), { location: "Labor München", locationId: "loc-2", updatedAt: T }));
    });

    it("eigenen, unveränderten Status schreiben (kein Wechsel) → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "emp-laborleiter"), { status: "Aktiv", updatedAt: T }));
    });
  });

  describe("Administratoren und Mitarbeiter mit geschützter Rolle sind für den Laborleiter tabu (auch unkritische Felder)", () => {
    it("Laborleiter ändert einen Administrator (beliebiges Feld) → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-admin-2"), { location: "x", updatedAt: T }));
    });

    it("Laborleiter ändert einen Mitarbeiter, dessen aktuelle Rolle Restricted-Schlüssel enthält → DENY", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-billing"), { location: "x", updatedAt: T }));
    });

    it("Laborleiter ändert einen Mitarbeiter, dessen AKTUELLE Rolle Admin-only-Löschrechte enthält → DENY; Administrator → ALLOW", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-deleter"), { location: "x", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.admin, "emp-deleter"), { location: "x", updatedAt: T }));
    });

    it("Laborleiter ändert einen Mitarbeiter ohne roleId (Altdaten) → DENY (nicht auflösbar, fail-closed)", async () => {
      await assertFails(updateDoc(ref(P.laborleiter, "emp-legacy-no-roleid"), { location: "x", updatedAt: T }));
    });

    it("Custom Role ohne Admin-Schlüssel (HR) ändert einen Administrator → DENY", async () => {
      await assertFails(updateDoc(ref(P.hr, "emp-admin-2"), { location: "x", updatedAt: T }));
    });

    it("Administrator (hat rollen.admin_verwalten) ändert unkritische Felder dieser Mitarbeiter → ALLOW", async () => {
      const admin = P.admin;
      await assertSucceeds(updateDoc(ref(admin, "emp-admin-2"), { location: "x", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(admin, "emp-billing"), { location: "x", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(admin, "emp-legacy-no-roleid"), { location: "x", updatedAt: T }));
    });

    it("eine archivierte Rolle mit Restricted-Schlüsseln als aktuelle Rolle schützt den Mitarbeiter ebenfalls", async () => {
      await seed(env, async (firestore) => {
        await updateDoc(doc(firestore, employees, "emp-target"), { roleId: ARCHIVED_ROLE });
      });
      await assertFails(updateDoc(ref(P.laborleiter, "emp-target"), { location: "x", updatedAt: T }));
      await assertSucceeds(updateDoc(ref(P.admin, "emp-target"), { location: "x", updatedAt: T }));
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
