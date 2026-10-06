// Rules-Tests für das Login-Profil users/{uid} (siehe src/lib/firebase/users.ts).
// Das Profil ist KEINE Sicherheitsquelle (Company/Rolle kommen aus
// userMemberships), aber role/plan/companyId dürfen vom Client nicht frei
// gesetzt werden. Der Client braucht genau zwei Schreibvorgänge:
//   1. createUserProfile(): einmaliges Basisprofil bei der Registrierung
//   2. updateLastLogin(): nur lastLogin beim Login (setDoc mit merge)
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { COLLECTIONS } from "../../src/lib/firebase/collections";
import { asAnonymous, asUser, createTestEnv, seed } from "./helpers/testEnv";

const U = COLLECTIONS.USERS;
const ALICE = "user-alice";
const BOB = "user-bob";

// Exakt das Dokument, das createUserProfile() schreibt (Feldnamen und feste
// Werte). createdAt/lastLogin sind Server-Timestamps (== request.time).
function validProfile(uid: string): Record<string, unknown> {
  return {
    id: uid,
    firstName: "Alice",
    lastName: "Test",
    email: "alice@example.de",
    role: "azubi",
    plan: "azubi",
    language: "de",
    theme: "system",
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  };
}

// Bestehendes Profil für Lese-/Update-/Delete-Tests (mit deaktivierten Rules).
async function seedProfile(env: RulesTestEnvironment, uid: string) {
  await seed(env, async (firestore) => {
    await setDoc(doc(firestore, U, uid), {
      id: uid,
      firstName: "Alice",
      lastName: "Test",
      email: "alice@example.de",
      role: "azubi",
      plan: "azubi",
      language: "de",
      theme: "system",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastLogin: "2026-01-02T00:00:00.000Z",
    });
  });
}

describe("users/{uid} (Login-Profil)", () => {
  let env: RulesTestEnvironment;

  before(async () => {
    env = await createTestEnv();
  });
  after(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
  });

  describe("lesen", () => {
    beforeEach(async () => {
      await seedProfile(env, ALICE);
      await seedProfile(env, BOB);
    });

    it("eigenes Profil lesen → ALLOW", async () => {
      const snapshot = await assertSucceeds(getDoc(doc(asUser(env, ALICE), U, ALICE)));
      assert.equal(snapshot.data()?.email, "alice@example.de");
    });

    it("eigenes Profil lesen, obwohl es fehlt → ALLOW (leeres Ergebnis)", async () => {
      const snapshot = await assertSucceeds(getDoc(doc(asUser(env, "user-without-profile"), U, "user-without-profile")));
      assert.equal(snapshot.exists(), false);
    });

    it("fremdes Profil lesen → DENY", async () => {
      await assertFails(getDoc(doc(asUser(env, ALICE), U, BOB)));
    });

    it("ohne Anmeldung lesen → DENY", async () => {
      await assertFails(getDoc(doc(asAnonymous(env), U, ALICE)));
    });

    it("Collection auflisten → DENY", async () => {
      await assertFails(getDocs(collection(asUser(env, ALICE), U)));
    });
  });

  describe("erstellen", () => {
    it("gültiges Basisprofil (wie createUserProfile) → ALLOW", async () => {
      await assertSucceeds(setDoc(doc(asUser(env, ALICE), U, ALICE), validProfile(ALICE)));
    });

    it("gültig mit language \"en\" und theme \"dark\" → ALLOW", async () => {
      await assertSucceeds(
        setDoc(doc(asUser(env, ALICE), U, ALICE), { ...validProfile(ALICE), language: "en", theme: "dark" })
      );
    });

    it("ohne Anmeldung → DENY", async () => {
      await assertFails(setDoc(doc(asAnonymous(env), U, ALICE), validProfile(ALICE)));
    });

    it("für eine fremde UID → DENY", async () => {
      await assertFails(setDoc(doc(asUser(env, ALICE), U, BOB), validProfile(BOB)));
    });

    it("eigene UID, aber id-Feld einer anderen UID → DENY", async () => {
      await assertFails(setDoc(doc(asUser(env, ALICE), U, ALICE), { ...validProfile(ALICE), id: BOB }));
    });

    const invalid: Array<[string, Record<string, unknown>]> = [
      ["role: \"admin\"", { role: "admin" }],
      ["role: \"laborleiter\"", { role: "laborleiter" }],
      ["plan: \"enterprise\"", { plan: "enterprise" }],
      ["plan: \"professional\"", { plan: "professional" }],
      ["zusätzliches Feld companyId", { companyId: "company-a" }],
      ["zusätzliches Feld laboratoryId", { laboratoryId: "lab-1" }],
      ["zusätzliches unbekanntes Feld", { isAdmin: true }],
      ["language: \"fr\"", { language: "fr" }],
      ["theme: \"neon\"", { theme: "neon" }],
      ["firstName ist kein String", { firstName: 42 }],
      ["email ist kein String", { email: 42 }],
      ["createdAt vom Client (kein Server-Timestamp)", { createdAt: new Date() }],
      ["lastLogin vom Client (kein Server-Timestamp)", { lastLogin: new Date() }],
    ];

    for (const [label, override] of invalid) {
      it(`${label} → DENY`, async () => {
        await assertFails(setDoc(doc(asUser(env, ALICE), U, ALICE), { ...validProfile(ALICE), ...override }));
      });
    }

    const required = ["id", "firstName", "lastName", "email", "role", "plan", "language", "theme", "createdAt", "lastLogin"];
    for (const field of required) {
      it(`Pflichtfeld ${field} fehlt → DENY`, async () => {
        const data = validProfile(ALICE);
        delete data[field];
        await assertFails(setDoc(doc(asUser(env, ALICE), U, ALICE), data));
      });
    }
  });

  describe("ändern", () => {
    beforeEach(async () => {
      await seedProfile(env, ALICE);
      await seedProfile(env, BOB);
    });

    it("nur lastLogin per updateDoc (Server-Timestamp) → ALLOW", async () => {
      await assertSucceeds(updateDoc(doc(asUser(env, ALICE), U, ALICE), { lastLogin: serverTimestamp() }));
    });

    it("updateLastLogin()-Muster: setDoc({ lastLogin }, { merge: true }) auf bestehendes Profil → ALLOW", async () => {
      await assertSucceeds(
        setDoc(doc(asUser(env, ALICE), U, ALICE), { lastLogin: serverTimestamp() }, { merge: true })
      );
    });

    it("Randfall: setDoc-merge auf ein NICHT vorhandenes Profil (wäre ein Anlegen mit nur lastLogin) → DENY", async () => {
      await assertFails(
        setDoc(doc(asUser(env, "user-without-profile"), U, "user-without-profile"), { lastLogin: serverTimestamp() }, { merge: true })
      );
    });

    it("lastLogin mit Client-Zeit statt Server-Zeit → DENY", async () => {
      await assertFails(updateDoc(doc(asUser(env, ALICE), U, ALICE), { lastLogin: new Date() }));
    });

    const forbidden: Array<[string, Record<string, unknown>]> = [
      ["role", { role: "admin" }],
      ["plan", { plan: "enterprise" }],
      ["companyId (neues Feld)", { companyId: "company-a" }],
      ["laboratoryId (neues Feld)", { laboratoryId: "lab-1" }],
      ["email", { email: "other@example.de" }],
      ["firstName", { firstName: "Mallory" }],
      ["lastName", { lastName: "Mallory" }],
      ["language", { language: "en" }],
      ["theme", { theme: "dark" }],
      ["id", { id: "somebody-else" }],
      ["createdAt", { createdAt: "2020-01-01T00:00:00.000Z" }],
    ];

    for (const [label, change] of forbidden) {
      it(`${label} ändern → DENY`, async () => {
        await assertFails(updateDoc(doc(asUser(env, ALICE), U, ALICE), change));
      });

      it(`${label} zusammen mit lastLogin ändern → DENY`, async () => {
        await assertFails(updateDoc(doc(asUser(env, ALICE), U, ALICE), { ...change, lastLogin: serverTimestamp() }));
      });
    }

    it("fremdes Profil ändern → DENY", async () => {
      await assertFails(updateDoc(doc(asUser(env, ALICE), U, BOB), { lastLogin: serverTimestamp() }));
    });

    it("ohne Anmeldung ändern → DENY", async () => {
      await assertFails(updateDoc(doc(asAnonymous(env), U, ALICE), { lastLogin: serverTimestamp() }));
    });
  });

  describe("löschen", () => {
    beforeEach(async () => {
      await seedProfile(env, ALICE);
    });

    it("eigenes Profil löschen → DENY", async () => {
      await assertFails(deleteDoc(doc(asUser(env, ALICE), U, ALICE)));
    });

    it("fremdes Profil löschen → DENY", async () => {
      await assertFails(deleteDoc(doc(asUser(env, BOB), U, ALICE)));
    });

    it("ohne Anmeldung löschen → DENY", async () => {
      await assertFails(deleteDoc(doc(asAnonymous(env), U, ALICE)));
    });
  });
});
