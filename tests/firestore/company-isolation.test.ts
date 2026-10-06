// Tenant-Isolation und Membership-Auswertung (belongsToCompany) am Beispiel
// companies/{companyId}/customers sowie defensive Fälle mit kaputten
// Membership-Dokumenten. Die Abdeckung ALLER Company-Collections steht in
// company-collections.test.ts.
//
// Wichtig: Der Test bildet den IST-Stand ab. Aktive Mitglieder der richtigen
// Firma dürfen heute ALLES (read + write) – es gibt noch keine
// rollenbasierte Durchsetzung. Wenn spätere Slices Rechte einschränken, müssen
// die ALLOW-Erwartungen dort bewusst angepasst werden.
import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

import {
  COMPANY_A,
  COMPANY_B,
  EXISTING_DOC_ID,
  USERS,
  collectionPath,
  membershipData,
  seedMembership,
  seedWorld,
} from "./helpers/fixtures";
import { asAnonymous, asUser, createTestEnv } from "./helpers/testEnv";

const customers = (companyId: string) => collectionPath("customers", companyId);

describe("Tenant-Isolation (companies/{companyId}/customers)", () => {
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

  describe("richtige Firma, aktive Membership", () => {
    it("lesen → ALLOW", async () => {
      await assertSucceeds(getDoc(doc(asUser(env, USERS.activeA), customers(COMPANY_A), EXISTING_DOC_ID)));
    });

    it("auflisten → ALLOW", async () => {
      await assertSucceeds(getDocs(collection(asUser(env, USERS.activeA), customers(COMPANY_A))));
    });

    it("erstellen / ändern / löschen → ALLOW (Ist-Stand: noch keine rollenbasierte Einschränkung)", async () => {
      const db = asUser(env, USERS.activeA);
      await assertSucceeds(setDoc(doc(db, customers(COMPANY_A), "new-customer"), { name: "Neu" }));
      await assertSucceeds(updateDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID), { name: "Geändert" }));
      await assertSucceeds(deleteDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID)));
    });
  });

  describe("falsche Firma", () => {
    it("Mitglied von company-a liest company-b → DENY", async () => {
      await assertFails(getDoc(doc(asUser(env, USERS.activeA), customers(COMPANY_B), EXISTING_DOC_ID)));
    });

    it("Mitglied von company-a listet company-b → DENY", async () => {
      await assertFails(getDocs(collection(asUser(env, USERS.activeA), customers(COMPANY_B))));
    });

    it("Mitglied von company-a schreibt in company-b → DENY", async () => {
      const db = asUser(env, USERS.activeA);
      await assertFails(setDoc(doc(db, customers(COMPANY_B), "intruder"), { name: "x" }));
      await assertFails(updateDoc(doc(db, customers(COMPANY_B), EXISTING_DOC_ID), { name: "x" }));
      await assertFails(deleteDoc(doc(db, customers(COMPANY_B), EXISTING_DOC_ID)));
    });

    it("umgekehrt: Mitglied von company-b liest company-a → DENY", async () => {
      await assertFails(getDoc(doc(asUser(env, USERS.activeB), customers(COMPANY_A), EXISTING_DOC_ID)));
    });
  });

  describe("gesperrte Membership", () => {
    it("lesen, auflisten → DENY", async () => {
      const db = asUser(env, USERS.blockedA);
      await assertFails(getDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID)));
      await assertFails(getDocs(collection(db, customers(COMPANY_A))));
    });

    it("schreiben → DENY", async () => {
      const db = asUser(env, USERS.blockedA);
      await assertFails(setDoc(doc(db, customers(COMPANY_A), "new-customer"), { name: "x" }));
      await assertFails(updateDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID), { name: "x" }));
      await assertFails(deleteDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID)));
    });
  });

  describe("authentifiziert ohne Membership", () => {
    it("lesen, auflisten, schreiben → DENY", async () => {
      const db = asUser(env, USERS.noMembership);
      await assertFails(getDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID)));
      await assertFails(getDocs(collection(db, customers(COMPANY_A))));
      await assertFails(setDoc(doc(db, customers(COMPANY_A), "new-customer"), { name: "x" }));
      await assertFails(deleteDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID)));
    });
  });

  describe("nicht authentifiziert", () => {
    it("lesen, auflisten, schreiben → DENY", async () => {
      const db = asAnonymous(env);
      await assertFails(getDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID)));
      await assertFails(getDocs(collection(db, customers(COMPANY_A))));
      await assertFails(setDoc(doc(db, customers(COMPANY_A), "new-customer"), { name: "x" }));
      await assertFails(deleteDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID)));
    });
  });
});

// Kaputte oder unerwartete Membership-Dokumente dürfen nie Zugriff geben. Die
// Rules lesen Felder defensiv (`.get(key, default)`), damit ein fehlendes Feld
// zu „kein Zugriff“ führt und nicht zu einem Auswertungsfehler mit Fallback.
describe("defekte Membership-Dokumente → immer DENY", () => {
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

  const base = membershipData(COMPANY_A, "Aktiv");
  const withoutKey = (key: "companyId" | "status") => {
    const copy: Record<string, unknown> = { ...base };
    delete copy[key];
    return copy;
  };

  const broken: Array<[string, Record<string, unknown>]> = [
    ["ohne companyId", withoutKey("companyId")],
    ["companyId leer (\"\")", { ...base, companyId: "" }],
    ["companyId nur Leerzeichen", { ...base, companyId: " " }],
    ["companyId kein String (Zahl)", { ...base, companyId: 1 }],
    ["companyId in anderer Schreibweise (Company-A)", { ...base, companyId: "Company-A" }],
    ["ohne status", withoutKey("status")],
    ["status leer (\"\")", { ...base, status: "" }],
    ["unbekannter status (\"Pending\")", { ...base, status: "Pending" }],
    ["status in Kleinschreibung (\"aktiv\")", { ...base, status: "aktiv" }],
    ["status mit Leerzeichen (\"Aktiv \")", { ...base, status: "Aktiv " }],
    ["status kein String (true)", { ...base, status: true }],
    ["leeres Dokument", {}],
  ];

  for (const [label, data] of broken) {
    it(`Membership ${label}: Zugriff auf company-a → DENY`, async () => {
      await seedMembership(env, "user-broken", data);
      const db = asUser(env, "user-broken");
      await assertFails(getDoc(doc(db, customers(COMPANY_A), EXISTING_DOC_ID)));
      await assertFails(getDocs(collection(db, customers(COMPANY_A))));
      await assertFails(setDoc(doc(db, customers(COMPANY_A), "new-customer"), { name: "x" }));
    });
  }

  it("Kontrolle: dieselbe Membership, korrekt ausgefüllt → ALLOW (die Tests oben scheitern nicht an der Testumgebung)", async () => {
    await seedMembership(env, "user-ok", base);
    await assertSucceeds(getDoc(doc(asUser(env, "user-ok"), customers(COMPANY_A), EXISTING_DOC_ID)));
  });
});

// Alles, was kein eigener match-Block abdeckt, fällt auf den Deny-Fallback.
describe("nicht freigegebene Pfade → DENY (Fallback)", () => {
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

  const paths = [
    `companies/${COMPANY_A}`, // Firmen-Stammdokument (kein Service, keine Rules)
    `companies/${COMPANY_A}/integrations/x`,
    `companies/${COMPANY_A}/webhooks/x`,
    `companies/${COMPANY_A}/auditLog/x`,
    `users/${USERS.activeA}/aiChats/chat-1`,
    "unbekannt/dokument",
  ];

  for (const path of paths) {
    it(`aktives Mitglied: ${path} lesen und schreiben → DENY`, async () => {
      const db = asUser(env, USERS.activeA);
      await assertFails(getDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, path), { x: 1 }));
    });
  }
});
