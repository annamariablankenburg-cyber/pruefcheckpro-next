// Phase 1: invitations und locations – Spezialfälle über die Persona-Matrix
// (phase1-matrix.test.ts) hinaus: Formregeln der Einladung (nur „Ausstehend“,
// nur der Widerrufs-Update-Pfad, Rolle der Einladung), Standort-Deaktivierung,
// Abhängigkeit Verwalten ↔ Ansehen.
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
  invitationData,
  locationData,
  seedPhase1World,
} from "./helpers/fixtures";
import { asUser, createTestEnv, seed } from "./helpers/testEnv";

const invitationsPath = collectionPath("invitations", COMPANY_A);
const locationsPath = collectionPath("locations", COMPANY_A);
const T = "2026-03-01T00:00:00.000Z";

describe("Phase 1: invitations", () => {
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

  const ref = (uid: string, id: string) => doc(asUser(env, uid), invitationsPath, id);
  const withoutField = (data: Record<string, unknown>, field: string) => {
    const copy = { ...data };
    delete copy[field];
    return copy;
  };

  describe("anlegen", () => {
    it("Laborleiter lädt für Prüfer, Custom Role (Baustellenleiter) und HR ein → ALLOW", async () => {
      await assertSucceeds(setDoc(ref(P.laborleiter, "i-1"), invitationData("Ausstehend")));
      await assertSucceeds(
        setDoc(ref(P.laborleiter, "i-2"), invitationData("Ausstehend", { role: "Baustellenleiter", roleId: "baustellenleiter" }))
      );
      await assertSucceeds(setDoc(ref(P.laborleiter, "i-3"), invitationData("Ausstehend", { role: "HR", roleId: HR_ROLE })));
    });

    it("Laborleiter lädt für die Administrator-Rolle ein → DENY", async () => {
      await assertFails(setDoc(ref(P.laborleiter, "i-1"), invitationData("Ausstehend", { role: "Administrator", roleId: "admin" })));
    });

    it("Laborleiter lädt für eine Rolle mit Restricted-Schlüssel ein (Billing, archivierte Rolle mit allen Rechten) → DENY", async () => {
      await assertFails(setDoc(ref(P.laborleiter, "i-1"), invitationData("Ausstehend", { roleId: BILLING_ROLE })));
      await assertFails(setDoc(ref(P.laborleiter, "i-2"), invitationData("Ausstehend", { roleId: ARCHIVED_ROLE })));
    });

    it("Laborleiter lädt für eine unbekannte, leere oder fehlende Rolle ein → DENY (fail-closed)", async () => {
      await assertFails(setDoc(ref(P.laborleiter, "i-1"), invitationData("Ausstehend", { roleId: "ghost-role" })));
      await assertFails(setDoc(ref(P.laborleiter, "i-2"), invitationData("Ausstehend", { roleId: "" })));
      await assertFails(setDoc(ref(P.laborleiter, "i-3"), withoutField(invitationData("Ausstehend"), "roleId")));
    });

    it("Administrator darf für Administrator-/Restricted-Rollen einladen → ALLOW (hat rollen.admin_verwalten)", async () => {
      await assertSucceeds(setDoc(ref(P.admin, "i-1"), invitationData("Ausstehend", { role: "Administrator", roleId: "admin" })));
      await assertSucceeds(setDoc(ref(P.admin, "i-2"), invitationData("Ausstehend", { roleId: BILLING_ROLE })));
    });

    for (const [key, roleId] of Object.entries(PROTECTED_DELETE_ROLES)) {
      it(`Laborleiter lädt für eine Rolle mit ${key} ein → DENY; Administrator → ALLOW`, async () => {
        await assertFails(setDoc(ref(P.laborleiter, "i-1"), invitationData("Ausstehend", { role: roleId, roleId })));
        await assertSucceeds(setDoc(ref(P.admin, "i-1"), invitationData("Ausstehend", { role: roleId, roleId })));
      });
    }

    it("Laborleiter lädt für eine Systemrolle ein, die (nach Admin-Konfiguration) ein Admin-only-Löschrecht enthält → DENY; Administrator → ALLOW", async () => {
      await seed(env, async (firestore) => {
        await setDoc(
          doc(firestore, collectionPath("roles", COMPANY_A), "azubi"),
          { permissions: { "laborbuch.loeschen": true } },
          { merge: true }
        );
      });
      await assertFails(setDoc(ref(P.laborleiter, "i-1"), invitationData("Ausstehend", { role: "Azubi", roleId: "azubi" })));
      await assertSucceeds(setDoc(ref(P.admin, "i-1"), invitationData("Ausstehend", { role: "Azubi", roleId: "azubi" })));
    });

    it("Laborleiter lädt für eine normale Rolle ein (proben.loeschen ist NICHT geschützt) und für Systemrollen ohne geschützte Schlüssel → ALLOW", async () => {
      await assertSucceeds(setDoc(ref(P.laborleiter, "i-1"), invitationData("Ausstehend", { role: "Proben-Löscher", roleId: NORMAL_DELETE_ROLE })));
      for (const roleId of ["pruefer", "azubi", "gast"]) {
        await assertSucceeds(setDoc(ref(P.laborleiter, `i-${roleId}`), invitationData("Ausstehend", { roleId })));
      }
    });

    it("Einladung direkt als Angenommen/Widerrufen oder mit acceptedAt/revokedAt anlegen → DENY, auch für den Administrator", async () => {
      await assertFails(setDoc(ref(P.admin, "i-1"), invitationData("Angenommen")));
      await assertFails(setDoc(ref(P.admin, "i-2"), invitationData("Widerrufen")));
      await assertFails(setDoc(ref(P.admin, "i-3"), invitationData("Ausstehend", { acceptedAt: T })));
      await assertFails(setDoc(ref(P.admin, "i-4"), invitationData("Ausstehend", { revokedAt: T })));
      await assertFails(setDoc(ref(P.admin, "i-5"), withoutField(invitationData("Ausstehend"), "status")));
    });

    it("Custom Role mit mitarbeiter_verwalten (HR) lädt ein → ALLOW; für Administrator → DENY", async () => {
      await assertSucceeds(setDoc(ref(P.hr, "i-1"), invitationData("Ausstehend")));
      await assertFails(setDoc(ref(P.hr, "i-2"), invitationData("Ausstehend", { roleId: "admin" })));
    });

    it("Prüfer, Azubi, Gast, Baustellenleiter legen eine Einladung an → DENY", async () => {
      for (const uid of [P.pruefer, P.azubi, P.gast, P.baustellenleiter]) {
        await assertFails(setDoc(ref(uid, `i-by-${uid}`), invitationData("Ausstehend")));
      }
    });
  });

  describe("widerrufen (einziger Update-Pfad)", () => {
    const revoke = { status: "Widerrufen", revokedAt: T, updatedAt: T };

    it("Laborleiter und Administrator widerrufen eine ausstehende Einladung → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "inv-pending"), revoke));
      await assertSucceeds(updateDoc(ref(P.admin, "inv-of-" + P.admin), revoke));
    });

    it("bereits widerrufene oder angenommene Einladung widerrufen → DENY", async () => {
      await assertFails(updateDoc(ref(P.admin, "inv-revoked"), revoke));
      await assertFails(updateDoc(ref(P.admin, "inv-accepted"), revoke));
    });

    it("Einladung wieder aktivieren (Widerrufen → Ausstehend) oder als Angenommen markieren → DENY", async () => {
      await assertFails(updateDoc(ref(P.admin, "inv-revoked"), { status: "Ausstehend", updatedAt: T }));
      await assertFails(updateDoc(ref(P.admin, "inv-pending"), { status: "Angenommen", acceptedAt: T, updatedAt: T }));
    });

    it("beim Widerruf weitere Felder ändern (E-Mail, Rolle, Ablauf) → DENY", async () => {
      await assertFails(updateDoc(ref(P.admin, "inv-pending"), { ...revoke, email: "anderer@example.de" }));
      await assertFails(updateDoc(ref(P.admin, "inv-pending"), { ...revoke, roleId: "admin" }));
      await assertFails(updateDoc(ref(P.admin, "inv-pending"), { ...revoke, expiresAt: "2100-01-01T00:00:00.000Z" }));
    });

    it("Einladung ohne Statuswechsel umschreiben (E-Mail, Rolle, Nachricht) → DENY", async () => {
      await assertFails(updateDoc(ref(P.admin, "inv-pending"), { email: "anderer@example.de", updatedAt: T }));
      await assertFails(updateDoc(ref(P.laborleiter, "inv-pending"), { roleId: "admin", updatedAt: T }));
      await assertFails(updateDoc(ref(P.admin, "inv-pending"), { message: deleteField(), updatedAt: T }));
    });

    it("Prüfer, Azubi, Gast widerrufen → DENY", async () => {
      for (const uid of [P.pruefer, P.azubi, P.gast]) {
        await assertFails(updateDoc(ref(uid, "inv-pending"), revoke));
      }
    });
  });

  describe("lesen und löschen", () => {
    it("Lesen und Listen nur mit mitarbeiter_verwalten (Laborleiter, Administrator, HR) → ALLOW; Prüfer/Azubi/Gast → DENY", async () => {
      for (const uid of [P.admin, P.laborleiter, P.hr]) {
        await assertSucceeds(getDoc(ref(uid, "inv-pending")));
        await assertSucceeds(getDocs(collection(asUser(env, uid), invitationsPath)));
      }
      for (const uid of [P.pruefer, P.azubi, P.gast]) {
        await assertFails(getDoc(ref(uid, "inv-pending")));
        await assertFails(getDocs(collection(asUser(env, uid), invitationsPath)));
      }
    });

    it("Löschen → DENY für alle (auch Administrator)", async () => {
      for (const uid of [P.admin, P.laborleiter, P.hr, P.pruefer]) {
        await assertFails(deleteDoc(ref(uid, "inv-pending")));
        await assertFails(deleteDoc(ref(uid, "inv-revoked")));
      }
    });
  });
});

describe("Phase 1: locations", () => {
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

  const ref = (uid: string, id: string) => doc(asUser(env, uid), locationsPath, id);

  it("Prüfer und Azubi lesen Standorte (standorte.ansehen), schreiben nicht", async () => {
    for (const uid of [P.pruefer, P.azubi]) {
      await assertSucceeds(getDoc(ref(uid, "loc-1")));
      await assertSucceeds(getDocs(collection(asUser(env, uid), locationsPath)));
      await assertFails(setDoc(ref(uid, `loc-by-${uid}`), locationData()));
      await assertFails(updateDoc(ref(uid, "loc-1"), { phone: "1", updatedAt: T }));
    }
  });

  it("Gast liest Standorte nicht (kein standorte.ansehen in der Matrix) → DENY", async () => {
    await assertFails(getDoc(ref(P.gast, "loc-1")));
    await assertFails(getDocs(collection(asUser(env, P.gast), locationsPath)));
  });

  it("Laborleiter und Administrator legen an, ändern und deaktivieren/reaktivieren → ALLOW", async () => {
    for (const uid of [P.laborleiter, P.admin]) {
      await assertSucceeds(setDoc(ref(uid, `loc-new-${uid}`), locationData({ name: "Neu" })));
      await assertSucceeds(updateDoc(ref(uid, "loc-1"), { name: "Labor Stuttgart Mitte", updatedAt: T }));
      await assertSucceeds(
        updateDoc(ref(uid, "loc-1"), { status: "Inaktiv", history: [{ message: "Deaktiviert", timestamp: "01.03.2026" }], updatedAt: T })
      );
      await assertSucceeds(updateDoc(ref(uid, "loc-1"), { status: "Aktiv", updatedAt: T }));
    }
  });

  it("Löschen → DENY für alle, auch für den Administrator", async () => {
    for (const uid of [P.admin, P.laborleiter, P.pruefer]) {
      await assertFails(deleteDoc(ref(uid, "loc-1")));
    }
  });

  it("Custom Role mit nur standorte_verwalten (ohne ansehen): schreiben ja, lesen nein (Verwalten setzt Ansehen voraus)", async () => {
    await assertSucceeds(setDoc(ref(P.locationManager, "loc-new"), locationData()));
    await assertSucceeds(updateDoc(ref(P.locationManager, "loc-1"), { phone: "1", updatedAt: T }));
    await assertFails(getDoc(ref(P.locationManager, "loc-1")));
    await assertFails(getDocs(collection(asUser(env, P.locationManager), locationsPath)));
  });

  it("Migration: Rolle vor der Migration liest Standorte nicht (standorte.ansehen fehlt), verwaltet sie aber → Lesen DENY, Schreiben ALLOW", async () => {
    await assertFails(getDoc(ref(P.legacyAdmin, "loc-1")));
    await assertSucceeds(updateDoc(ref(P.legacyAdmin, "loc-1"), { phone: "1", updatedAt: T }));
  });
});
