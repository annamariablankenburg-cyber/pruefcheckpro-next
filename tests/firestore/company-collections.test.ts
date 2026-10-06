// Smoke-Tests für ALLE Company-Collections. Jede Collection hat in
// firestore.rules einen eigenen match-Block, daher wird jede einzeln geprüft
// (nicht nur ein Beispiel).
//
// IST-Stand: aktive Mitglieder der richtigen Firma dürfen in jeder Collection
// lesen, auflisten, erstellen, ändern und löschen – es gibt noch keine
// rollenbasierte Permission-Durchsetzung. Diese Tests sind die Regressions-
// basis für die schrittweise Härtung: Wenn ein späterer Slice z. B. Löschen
// einschränkt, wird die jeweilige ALLOW-Erwartung hier bewusst angepasst.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

import {
  COMPANY_A,
  COMPANY_B,
  COMPANY_COLLECTIONS,
  EXISTING_DOC_ID,
  USERS,
  collectionPath,
  seedWorld,
} from "./helpers/fixtures";
import { RULES_PATH, asAnonymous, asUser, createTestEnv } from "./helpers/testEnv";

// Wächter: Jeder `match /companies/{companyId}/<name>/{…}`-Block der Rules muss
// in COMPANY_COLLECTIONS stehen (und umgekehrt). Kommt ein neuer Block dazu,
// ohne dass er hier getestet wird, schlägt dieser Test fehl.
describe("Abdeckung der Company-Collections", () => {
  it("die getesteten Collections entsprechen den match-Blöcken in firestore.rules", () => {
    const rules = readFileSync(RULES_PATH, "utf8");
    const inRules = [...rules.matchAll(/match\s+\/companies\/\{companyId\}\/(\w+)\/\{/g)].map((match) => match[1]);
    assert.equal(inRules.length, 12, "firestore.rules enthält nicht genau 12 Company-match-Blöcke");
    assert.deepEqual([...inRules].sort(), [...COMPANY_COLLECTIONS].sort());
  });

  it("jede getestete Collection hat einen eigenen Pfad unter companies/{companyId}", () => {
    for (const name of COMPANY_COLLECTIONS) {
      const path = collectionPath(name, COMPANY_A);
      assert.ok(path.startsWith(`companies/${COMPANY_A}/`), `${name}: ${path}`);
    }
  });
});

describe("Company-Collections: Membership und Tenant-Isolation", () => {
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

  for (const name of COMPANY_COLLECTIONS) {
    describe(name, () => {
      const pathA = collectionPath(name, COMPANY_A);
      const pathB = collectionPath(name, COMPANY_B);

      it("aktives Mitglied der richtigen Firma: lesen, auflisten, erstellen, ändern, löschen → ALLOW (Ist-Stand)", async () => {
        const db = asUser(env, USERS.activeA);
        await assertSucceeds(getDoc(doc(db, pathA, EXISTING_DOC_ID)));
        await assertSucceeds(getDocs(collection(db, pathA)));
        await assertSucceeds(setDoc(doc(db, pathA, "new-doc"), { name: "neu" }));
        await assertSucceeds(updateDoc(doc(db, pathA, EXISTING_DOC_ID), { name: "geändert" }));
        await assertSucceeds(deleteDoc(doc(db, pathA, EXISTING_DOC_ID)));
      });

      it("aktives Mitglied einer ANDEREN Firma: lesen, auflisten, schreiben → DENY", async () => {
        const db = asUser(env, USERS.activeB);
        await assertFails(getDoc(doc(db, pathA, EXISTING_DOC_ID)));
        await assertFails(getDocs(collection(db, pathA)));
        await assertFails(setDoc(doc(db, pathA, "new-doc"), { name: "neu" }));
        await assertFails(updateDoc(doc(db, pathA, EXISTING_DOC_ID), { name: "x" }));
        await assertFails(deleteDoc(doc(db, pathA, EXISTING_DOC_ID)));
      });

      it("Mitglied von company-a greift auf company-b zu → DENY", async () => {
        const db = asUser(env, USERS.activeA);
        await assertFails(getDoc(doc(db, pathB, EXISTING_DOC_ID)));
        await assertFails(setDoc(doc(db, pathB, "new-doc"), { name: "neu" }));
      });

      it("gesperrtes Mitglied: lesen, auflisten, schreiben → DENY", async () => {
        const db = asUser(env, USERS.blockedA);
        await assertFails(getDoc(doc(db, pathA, EXISTING_DOC_ID)));
        await assertFails(getDocs(collection(db, pathA)));
        await assertFails(setDoc(doc(db, pathA, "new-doc"), { name: "neu" }));
        await assertFails(updateDoc(doc(db, pathA, EXISTING_DOC_ID), { name: "x" }));
        await assertFails(deleteDoc(doc(db, pathA, EXISTING_DOC_ID)));
      });

      it("authentifiziert ohne Membership: lesen, auflisten, schreiben → DENY", async () => {
        const db = asUser(env, USERS.noMembership);
        await assertFails(getDoc(doc(db, pathA, EXISTING_DOC_ID)));
        await assertFails(getDocs(collection(db, pathA)));
        await assertFails(setDoc(doc(db, pathA, "new-doc"), { name: "neu" }));
        await assertFails(deleteDoc(doc(db, pathA, EXISTING_DOC_ID)));
      });

      it("nicht authentifiziert: lesen, auflisten, schreiben → DENY", async () => {
        const db = asAnonymous(env);
        await assertFails(getDoc(doc(db, pathA, EXISTING_DOC_ID)));
        await assertFails(getDocs(collection(db, pathA)));
        await assertFails(setDoc(doc(db, pathA, "new-doc"), { name: "neu" }));
        await assertFails(deleteDoc(doc(db, pathA, EXISTING_DOC_ID)));
      });
    });
  }
});
