// Rules-Tests für userMemberships/{uid}: die einzige sicherheitsrelevante
// Firmenzuordnung. Erwartung: der eigene User darf SEIN Dokument lesen (get),
// sonst nichts – kein list, kein create/update/delete durch Clients.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

import { COLLECTIONS } from "../../src/lib/firebase/collections";
import { COMPANY_A, COMPANY_B, USERS, membershipData, seedWorld } from "./helpers/fixtures";
import { asAnonymous, asUser, createTestEnv, seed } from "./helpers/testEnv";

const M = COLLECTIONS.USER_MEMBERSHIPS;

describe("userMemberships/{uid}", () => {
  let env: RulesTestEnvironment;

  before(async () => {
    env = await createTestEnv();
  });
  after(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await seedWorld(env);
  });

  describe("lesen", () => {
    it("eigene Membership lesen → ALLOW", async () => {
      const snapshot = await assertSucceeds(getDoc(doc(asUser(env, USERS.activeA), M, USERS.activeA)));
      assert.equal(snapshot.data()?.companyId, COMPANY_A);
    });

    it("eigene Membership lesen, obwohl sie fehlt → ALLOW (leeres Ergebnis; so erkennt die App „kein Unternehmenszugang“)", async () => {
      const snapshot = await assertSucceeds(getDoc(doc(asUser(env, USERS.noMembership), M, USERS.noMembership)));
      assert.equal(snapshot.exists(), false);
    });

    it("gesperrte eigene Membership lesen → ALLOW (so erkennt die App „gesperrt“)", async () => {
      const snapshot = await assertSucceeds(getDoc(doc(asUser(env, USERS.blockedA), M, USERS.blockedA)));
      assert.equal(snapshot.data()?.status, "Gesperrt");
    });

    it("fremde Membership lesen → DENY", async () => {
      await assertFails(getDoc(doc(asUser(env, USERS.activeA), M, USERS.activeB)));
    });

    it("Membership ohne Anmeldung lesen → DENY", async () => {
      await assertFails(getDoc(doc(asAnonymous(env), M, USERS.activeA)));
    });

    it("Collection auflisten → DENY", async () => {
      await assertFails(getDocs(collection(asUser(env, USERS.activeA), M)));
    });

    it("gefilterte Query auf die eigene Firma (list) → DENY", async () => {
      await assertFails(
        getDocs(query(collection(asUser(env, USERS.activeA), M), where("companyId", "==", COMPANY_A)))
      );
    });
  });

  describe("erstellen", () => {
    it("User ohne Membership legt sich selbst eine an (Selbst-Zuweisung) → DENY", async () => {
      await assertFails(
        setDoc(doc(asUser(env, USERS.noMembership), M, USERS.noMembership), membershipData(COMPANY_A, "Aktiv"))
      );
    });

    it("Membership für eine fremde UID anlegen → DENY", async () => {
      await assertFails(setDoc(doc(asUser(env, USERS.activeA), M, "someone-else"), membershipData(COMPANY_A, "Aktiv")));
    });

    it("ohne Anmeldung anlegen → DENY", async () => {
      await assertFails(setDoc(doc(asAnonymous(env), M, "anon"), membershipData(COMPANY_A, "Aktiv")));
    });
  });

  describe("verändern", () => {
    it("eigene companyId ändern (andere Firma übernehmen) → DENY", async () => {
      await assertFails(updateDoc(doc(asUser(env, USERS.activeA), M, USERS.activeA), { companyId: COMPANY_B }));
    });

    it("eigene roleId ändern (Selbst-Beförderung) → DENY", async () => {
      await assertFails(updateDoc(doc(asUser(env, USERS.activeA), M, USERS.activeA), { roleId: "admin" }));
    });

    it("eigenen role-Snapshot ändern → DENY", async () => {
      await assertFails(updateDoc(doc(asUser(env, USERS.activeA), M, USERS.activeA), { role: "Administrator" }));
    });

    it("eigenen status ändern → DENY", async () => {
      await assertFails(updateDoc(doc(asUser(env, USERS.activeA), M, USERS.activeA), { status: "Gesperrt" }));
    });

    it("gesperrter User entsperrt sich selbst → DENY", async () => {
      await assertFails(updateDoc(doc(asUser(env, USERS.blockedA), M, USERS.blockedA), { status: "Aktiv" }));
    });

    it("Dokument komplett überschreiben (setDoc) → DENY", async () => {
      await assertFails(setDoc(doc(asUser(env, USERS.activeA), M, USERS.activeA), membershipData(COMPANY_B, "Aktiv")));
    });

    it("fremde Membership verändern → DENY", async () => {
      await assertFails(updateDoc(doc(asUser(env, USERS.activeA), M, USERS.activeB), { status: "Gesperrt" }));
    });

    it("abgelehnte Schreibversuche lassen das Dokument unverändert", async () => {
      await assertFails(updateDoc(doc(asUser(env, USERS.activeA), M, USERS.activeA), { companyId: COMPANY_B }));
      await seed(env, async (firestore) => {
        const snapshot = await getDoc(doc(firestore, M, USERS.activeA));
        assert.equal(snapshot.data()?.companyId, COMPANY_A);
        assert.equal(snapshot.data()?.status, "Aktiv");
      });
    });
  });

  describe("löschen", () => {
    it("eigene Membership löschen → DENY", async () => {
      await assertFails(deleteDoc(doc(asUser(env, USERS.activeA), M, USERS.activeA)));
    });

    it("fremde Membership löschen → DENY", async () => {
      await assertFails(deleteDoc(doc(asUser(env, USERS.activeA), M, USERS.activeB)));
    });

    it("ohne Anmeldung löschen → DENY", async () => {
      await assertFails(deleteDoc(doc(asAnonymous(env), M, USERS.activeA)));
    });
  });
});
