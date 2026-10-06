// Phase 2: gezielte Fälle für die acht Fach-Collections (customers, projects, devices,
// samples, testValues, reports, calendarEvents, laborbook). Die vollständige
// Persona × Collection × Operation-Matrix steht in phase2-matrix.test.ts.
//
//  A  Jeder Schlüssel wirkt einzeln (create ≠ update ≠ delete ≠ read)
//  B  Read-only-Rolle
//  C  fehlende, unbekannte und nicht-"true"-Werte gewähren nichts
//  D  die drei geschützten Admin-only-Löschrechte
//  E  Rolle vor der 31→45-Migration
//  F  Berichte: Export-Status verlangt zusätzlich pdf.exportieren
//  G  testValues: sampleId == Dokument-ID, danach unveränderlich
//  H  Tenant-Isolation für alle acht Collections (get, list, create, update, delete)
//  I  Bulk-Operationen (writeBatch): Access-Call-Limit
//  J  Service-Abläufe (Lesen vor/nach dem Schreiben) – Abhängigkeiten, KEINE Rules-Pflicht
//  K  Snapshots (Employee-Rolle, Profilrolle, Membership.role) bestimmen nie Rechte
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, runTransaction, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { ADMIN_ONLY_DELETE_PERMISSION_KEYS, allPermissionKeys } from "../../src/config/roles";
import { COLLECTIONS } from "../../src/lib/firebase/collections";
import {
  COMPANY_A,
  COMPANY_B,
  EXISTING_DOC_ID,
  LEGACY_31_KEYS,
  P,
  PHASE2_COLLECTIONS,
  PHASE2_PERMISSIONS,
  collectionPath,
  customRoleData,
  permissionMap,
  phase2DocData,
  seedPhase2World,
  type Phase2Collection,
  type Phase2Operation,
} from "./helpers/fixtures";
import { asUser, createTestEnv, seed } from "./helpers/testEnv";

const T = "2026-03-01T00:00:00.000Z";
const check = (allowed: boolean, operation: Promise<unknown>) => (allowed ? assertSucceeds(operation) : assertFails(operation));

const OPERATIONS: Phase2Operation[] = ["read", "create", "update", "delete"];

// Eine Rolle pro (Collection, Operation) mit GENAU diesem einen Schlüssel.
const singleKeyUid = (collectionName: Phase2Collection, operation: Phase2Operation) => `u-only-${collectionName}-${operation}`;
const singleKeyRole = (collectionName: Phase2Collection, operation: Phase2Operation) => `only-${collectionName}-${operation}`;

// Weitere Test-Nutzer (alle in company-a, Membership "Aktiv").
const U = {
  readOnly: "u-read-only",
  noKeys: "u-no-keys",
  onlyCustomersRead: "u-only-customers-read",
  unknownKeys: "u-unknown-keys",
  nonTrue: "u-non-true-values",
  deleterAll: "u-deleter-all", // Custom Role mit allen drei geschützten Löschrechten (vom Admin vergeben)
  noDeleter: "u-no-deleter",
  archivedDeleter: "u-archived-deleter",
  reportsEditor: "u-reports-editor", // berichte.ansehen/erstellen/bearbeiten, KEIN pdf.exportieren
  reportsExporter: "u-reports-exporter", // + pdf.exportieren
  pdfOnly: "u-pdf-only", // pdf.exportieren ohne berichte.bearbeiten
  tvWriter: "u-testvalues-writer", // pruefungen.erstellen/bearbeiten
  bulk: "u-bulk", // proben.bearbeiten + proben.loeschen (ohne ansehen)
  onlyCreate: "u-only-create", // proben.erstellen + laborbuch.erstellen
  editOnly: "u-edit-only", // laborbuch.bearbeiten
  editAndRead: "u-edit-and-read", // laborbuch.ansehen + bearbeiten
  splitRole: "u-split-role", // Rolle gleicher ID in A (ohne Rechte) und B (alle Rechte)
} as const;

const TARGETS = [
  ...PHASE2_COLLECTIONS.flatMap((name) => OPERATIONS.map((operation) => singleKeyUid(name, operation))),
  ...Object.values(U),
  P.admin,
  P.laborleiter,
  P.azubi,
  P.legacyAdmin,
  P.pruefer,
];

const BULK_IDS = Array.from({ length: 25 }, (_, index) => `bulk-${index + 1}`);
const BULK_DELETE_IDS = Array.from({ length: 25 }, (_, index) => `bulk-del-${index + 1}`);

describe("Phase 2: gezielte Permission-Fälle", () => {
  let env: RulesTestEnvironment;

  async function addRole(roleId: string, permissions: Record<string, unknown>, extra: Record<string, unknown> = {}, companyId = COMPANY_A) {
    await seed(env, async (firestore) => {
      await setDoc(doc(firestore, collectionPath("roles", companyId), roleId), customRoleData(roleId, permissions as Record<string, boolean>, extra));
    });
  }

  async function addUser(uid: string, roleId: unknown, companyId = COMPANY_A) {
    await seed(env, async (firestore) => {
      await setDoc(doc(firestore, COLLECTIONS.USER_MEMBERSHIPS, uid), {
        companyId,
        employeeId: `emp-${uid}`,
        roleId,
        // Namens-Snapshot ohne Bedeutung: darf nie Rechte geben.
        role: "Administrator",
        status: "Aktiv",
        createdAt: T,
        updatedAt: T,
      });
    });
  }

  const as = (uid: string): Firestore => asUser(env, uid);
  const path = (name: Phase2Collection, companyId = COMPANY_A) => collectionPath(name, companyId);

  // Eine Operation gegen eine Collection (read = get UND list werden getrennt geprüft).
  function attempt(db: Firestore, name: Phase2Collection, operation: Phase2Operation | "list", uid: string) {
    switch (operation) {
      case "read":
        return getDoc(doc(db, path(name), EXISTING_DOC_ID));
      case "list":
        return getDocs(collection(db, path(name)));
      case "create":
        return setDoc(doc(db, path(name), `new-${uid}`), phase2DocData(name, `new-${uid}`));
      case "update":
        return updateDoc(doc(db, path(name), EXISTING_DOC_ID), { notiz: `von ${uid}` });
      case "delete":
        return deleteDoc(doc(db, path(name), `del-${uid}`));
    }
  }

  before(async () => {
    env = await createTestEnv();
    await env.clearFirestore();
    await seedPhase2World(env, TARGETS);

    // A: eine Rolle je (Collection, Operation) mit genau einem Schlüssel
    for (const name of PHASE2_COLLECTIONS) {
      for (const operation of OPERATIONS) {
        await addRole(singleKeyRole(name, operation), permissionMap([PHASE2_PERMISSIONS[name][operation]]));
        await addUser(singleKeyUid(name, operation), singleKeyRole(name, operation));
      }
    }

    // B/C
    await addRole("read-only", permissionMap(PHASE2_COLLECTIONS.map((name) => PHASE2_PERMISSIONS[name].read)));
    await addUser(U.readOnly, "read-only");
    await addRole("no-keys", {});
    await addUser(U.noKeys, "no-keys");
    await addRole("only-customers-read", permissionMap(["kunden.ansehen"]));
    await addUser(U.onlyCustomersRead, "only-customers-read");
    await addRole("unknown-keys", {
      "kunden.superuser": true,
      "*": true,
      "kunden.ansehen ": true, // Leerzeichen
      "KUNDEN.ANSEHEN": true, // Schreibweise
      "kunden.loeschen.": true,
      admin: true,
      "fach.alles": true,
    });
    await addUser(U.unknownKeys, "unknown-keys");
    const nonTrue: Record<string, unknown> = {};
    for (const name of PHASE2_COLLECTIONS) {
      const { read, create, update, delete: del } = PHASE2_PERMISSIONS[name];
      nonTrue[read] = "true";
      nonTrue[create] = 1;
      nonTrue[update] = null;
      nonTrue[del] = {};
    }
    await addRole("non-true", nonTrue);
    await addUser(U.nonTrue, "non-true");

    // D: geschützte Löschrechte (legal im Role-Dokument, wie vom Administrator vergeben)
    await addRole("deleter-all", permissionMap([...ADMIN_ONLY_DELETE_PERMISSION_KEYS]));
    await addUser(U.deleterAll, "deleter-all");
    await addRole("no-deleter", permissionMap(["geraete.erstellen", "geraete.bearbeiten", "laborbuch.erstellen", "berichte.erstellen"]));
    await addUser(U.noDeleter, "no-deleter");
    await addRole("archived-deleter", permissionMap([...ADMIN_ONLY_DELETE_PERMISSION_KEYS]), { status: "Archiviert" });
    await addUser(U.archivedDeleter, "archived-deleter");

    // F: Berichte
    await addRole("reports-editor", permissionMap(["berichte.ansehen", "berichte.erstellen", "berichte.bearbeiten"]));
    await addUser(U.reportsEditor, "reports-editor");
    await addRole("reports-exporter", permissionMap(["berichte.ansehen", "berichte.erstellen", "berichte.bearbeiten", "pdf.exportieren"]));
    await addUser(U.reportsExporter, "reports-exporter");
    await addRole("pdf-only", permissionMap(["pdf.exportieren", "berichte.ansehen"]));
    await addUser(U.pdfOnly, "pdf-only");

    // G: Prüfwerte
    await addRole("tv-writer", permissionMap(["pruefungen.erstellen", "pruefungen.bearbeiten"]));
    await addUser(U.tvWriter, "tv-writer");

    // I: Bulk
    await addRole("bulk-role", permissionMap(["proben.bearbeiten", "proben.loeschen"]));
    await addUser(U.bulk, "bulk-role");

    // J: Service-Abläufe
    await addRole("only-create", permissionMap(["proben.erstellen", "laborbuch.erstellen"]));
    await addUser(U.onlyCreate, "only-create");
    await addRole("edit-only", permissionMap(["laborbuch.bearbeiten"]));
    await addUser(U.editOnly, "edit-only");
    await addRole("edit-and-read", permissionMap(["laborbuch.ansehen", "laborbuch.bearbeiten"]));
    await addUser(U.editAndRead, "edit-and-read");

    // H: gleiche roleId in zwei Firmen – in A ohne Rechte, in B mit allen
    await addRole("split-role", {}, {}, COMPANY_A);
    await addRole("split-role", permissionMap(allPermissionKeys), {}, COMPANY_B);
    await addUser(U.splitRole, "split-role");

    // Zusatzdokumente
    await seed(env, async (firestore) => {
      await setDoc(doc(firestore, path("reports"), "exported-report"), phase2DocData("reports", "exported-report", { status: "PDF exportiert" }));
      await setDoc(doc(firestore, path("testValues"), "tv-existing"), phase2DocData("testValues", "tv-existing"));
      for (const id of [...BULK_IDS, ...BULK_DELETE_IDS]) {
        await setDoc(doc(firestore, path("samples"), id), phase2DocData("samples", id));
      }
      await setDoc(doc(firestore, path("laborbook"), "lb-1"), phase2DocData("laborbook", "lb-1"));
    });
  });
  after(async () => {
    await env.cleanup();
  });

  // ---------------------------------------------------------------------------
  describe("A: jeder Schlüssel wirkt einzeln (genau ein Recht → genau eine Operation)", () => {
    for (const name of PHASE2_COLLECTIONS) {
      for (const operation of OPERATIONS) {
        const key = PHASE2_PERMISSIONS[name][operation];
        it(`${name}: nur ${key} → ${operation === "read" ? "get/list" : operation} ALLOW, alles andere DENY`, async () => {
          const uid = singleKeyUid(name, operation);
          const db = as(uid);
          const all: Array<Phase2Operation | "list"> = ["read", "list", "create", "update", "delete"];
          for (const attempted of all) {
            const allowed = attempted === operation || (operation === "read" && attempted === "list");
            await check(allowed, attempt(db, name, attempted, uid));
          }
        });
      }
    }

    it("das Recht einer ANDEREN Collection hilft nicht (kunden.* gilt nicht für projects)", async () => {
      const uid = singleKeyUid("customers", "delete");
      await assertFails(deleteDoc(doc(as(uid), path("projects"), `del-${uid}`)));
      await assertFails(deleteDoc(doc(as(uid), path("devices"), `del-${uid}`)));
      await assertSucceeds(deleteDoc(doc(as(uid), path("customers"), `del-${uid}`)));
    });
  });

  // ---------------------------------------------------------------------------
  describe("B: Read-only-Rolle", () => {
    for (const name of PHASE2_COLLECTIONS) {
      it(`${name}: get und list ALLOW, create/update/delete DENY`, async () => {
        const db = as(U.readOnly);
        await assertSucceeds(getDoc(doc(db, path(name), EXISTING_DOC_ID)));
        await assertSucceeds(getDocs(collection(db, path(name))));
        await assertFails(attempt(db, name, "create", U.readOnly));
        await assertFails(attempt(db, name, "update", U.readOnly));
        await assertFails(attempt(db, name, "delete", U.readOnly));
      });
    }
  });

  // ---------------------------------------------------------------------------
  describe("C: fehlende, unbekannte und nicht-true-Werte gewähren nichts", () => {
    it("Rolle mit leerer permissions-Map → alle Operationen aller Collections DENY", async () => {
      for (const name of PHASE2_COLLECTIONS) {
        for (const operation of ["read", "list", "create", "update", "delete"] as const) {
          await assertFails(attempt(as(U.noKeys), name, operation, U.noKeys));
        }
      }
    });

    it("Rolle mit nur kunden.ansehen → nur Kunden lesen; andere Schlüssel fehlen (= false)", async () => {
      const db = as(U.onlyCustomersRead);
      await assertSucceeds(getDoc(doc(db, path("customers"), EXISTING_DOC_ID)));
      await assertFails(updateDoc(doc(db, path("customers"), EXISTING_DOC_ID), { notiz: "x" }));
      for (const name of PHASE2_COLLECTIONS.filter((candidate) => candidate !== "customers")) {
        await assertFails(getDoc(doc(db, path(name), EXISTING_DOC_ID)));
        await assertFails(getDocs(collection(db, path(name))));
      }
    });

    it("unbekannte, falsch geschriebene oder zusätzliche Schlüssel (true) geben keinerlei Recht", async () => {
      for (const name of PHASE2_COLLECTIONS) {
        for (const operation of ["read", "list", "create", "update", "delete"] as const) {
          await assertFails(attempt(as(U.unknownKeys), name, operation, U.unknownKeys));
        }
      }
    });

    it("Werte, die nicht exakt true sind (\"true\", 1, null, {}) geben keinerlei Recht", async () => {
      for (const name of PHASE2_COLLECTIONS) {
        for (const operation of ["read", "list", "create", "update", "delete"] as const) {
          await assertFails(attempt(as(U.nonTrue), name, operation, U.nonTrue));
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  describe("D: Admin-only-Löschrechte (geraete.loeschen, laborbuch.loeschen, berichte.loeschen)", () => {
    const PROTECTED: Array<[Phase2Collection, string]> = [
      ["devices", "geraete.loeschen"],
      ["laborbook", "laborbuch.loeschen"],
      ["reports", "berichte.loeschen"],
    ];

    it("die Tabelle der Tests deckt genau die ADMIN_ONLY_DELETE_PERMISSION_KEYS ab", () => {
      assert.deepEqual(PROTECTED.map(([, key]) => key).sort(), [...ADMIN_ONLY_DELETE_PERMISSION_KEYS].sort());
      for (const [name, key] of PROTECTED) assert.equal(PHASE2_PERMISSIONS[name].delete, key);
    });

    for (const [name, key] of PROTECTED) {
      it(`${name} (${key}): Laborleiter → DENY (gemäß aktueller Matrix), Administrator → ALLOW`, async () => {
        await assertFails(deleteDoc(doc(as(P.laborleiter), path(name), `del-${P.laborleiter}`)));
        await assertSucceeds(deleteDoc(doc(as(P.admin), path(name), `del-${P.admin}`)));
      });

      it(`${name} (${key}): Laborleiter darf weiter lesen, anlegen und bearbeiten (nur das Löschen fehlt)`, async () => {
        const db = as(P.laborleiter);
        await assertSucceeds(getDoc(doc(db, path(name), EXISTING_DOC_ID)));
        await assertSucceeds(updateDoc(doc(db, path(name), EXISTING_DOC_ID), { notiz: "Laborleiter" }));
        await assertSucceeds(setDoc(doc(db, path(name), "new-by-laborleiter"), phase2DocData(name, "new-by-laborleiter")));
      });

      it(`${name}: Custom Role ohne ${key} → DENY (auch mit Anlegen/Bearbeiten)`, async () => {
        await assertFails(deleteDoc(doc(as(U.noDeleter), path(name), `del-${U.noDeleter}`)));
      });

      it(`${name}: Custom Role MIT ${key} (legal im Role-Dokument gespeichert) → ALLOW; archivierte Rolle → DENY`, async () => {
        await assertSucceeds(deleteDoc(doc(as(U.deleterAll), path(name), `del-${U.deleterAll}`)));
        await assertFails(deleteDoc(doc(as(U.archivedDeleter), path(name), `del-${U.archivedDeleter}`)));
      });
    }

    it("Löschen von Proben/Prüfungen/Kunden/Projekten/Terminen ist NICHT admin-only (Laborleiter darf)", async () => {
      for (const name of ["samples", "testValues", "customers", "projects", "calendarEvents"] as const) {
        await assertSucceeds(deleteDoc(doc(as(P.laborleiter), path(name), `del-${P.laborleiter}`)));
      }
    });

    it("Azubi und Prüfer dürfen nie löschen (Proben, Prüfungen, Kunden, Projekte, Kalender, Geräte, Laborbuch, Berichte)", async () => {
      for (const name of PHASE2_COLLECTIONS) {
        await assertFails(deleteDoc(doc(as(P.azubi), path(name), `del-${P.azubi}`)));
        await assertFails(deleteDoc(doc(as(P.pruefer), path(name), `del-${P.pruefer}`)));
      }
    });
  });

  // ---------------------------------------------------------------------------
  describe("E: Rolle vor der 31→45-Migration (14 neue Schlüssel fehlen = false)", () => {
    const legacy = new Set<string>(LEGACY_31_KEYS);

    it("alte Schlüssel wirken weiter (Kunden, Projekte, Proben, Prüfungen, Kalender-Termin anlegen)", async () => {
      const db = as(P.legacyAdmin);
      for (const name of ["customers", "projects", "samples", "testValues"] as const) {
        await assertSucceeds(getDoc(doc(db, path(name), EXISTING_DOC_ID)));
        await assertSucceeds(updateDoc(doc(db, path(name), EXISTING_DOC_ID), { notiz: "legacy" }));
        await assertSucceeds(deleteDoc(doc(db, path(name), `del-${P.legacyAdmin}`)));
      }
      await assertSucceeds(setDoc(doc(db, path("calendarEvents"), "legacy-event"), phase2DocData("calendarEvents", "legacy-event")));
    });

    it("neue Schlüssel fehlen: Geräte anlegen/löschen, Laborbuch anlegen/löschen, Kalender bearbeiten/löschen, Berichte (alle Operationen) → DENY", async () => {
      const db = as(P.legacyAdmin);
      const missing: Array<[Phase2Collection, Phase2Operation]> = [
        ["devices", "create"],
        ["devices", "delete"],
        ["laborbook", "create"],
        ["laborbook", "delete"],
        ["calendarEvents", "update"],
        ["calendarEvents", "delete"],
        ["reports", "read"],
        ["reports", "create"],
        ["reports", "update"],
        ["reports", "delete"],
      ];
      for (const [name, operation] of missing) {
        assert.equal(legacy.has(PHASE2_PERMISSIONS[name][operation]), false, `${name}.${operation} gehört zu den neuen Schlüsseln`);
        await assertFails(attempt(db, name, operation, P.legacyAdmin));
      }
    });

    it("keine Kompatibilitätsausnahme: die Legacy-Rolle bekommt NICHTS, was nur ein neuer Schlüssel erlaubt", async () => {
      const db = as(P.legacyAdmin);
      for (const name of PHASE2_COLLECTIONS) {
        for (const operation of OPERATIONS) {
          const key = PHASE2_PERMISSIONS[name][operation];
          if (legacy.has(key)) continue;
          await assertFails(attempt(db, name, operation === "read" ? "read" : operation, P.legacyAdmin));
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  describe("F: Berichte – Export-Status verlangt zusätzlich pdf.exportieren", () => {
    const reports = () => path("reports");
    let counter = 0;
    const freshId = (prefix: string) => `${prefix}-${(counter += 1)}`;

    it("Bearbeiter ohne pdf.exportieren: anlegen als Entwurf, ändern und Status Fertig/Archiviert → ALLOW", async () => {
      const db = as(U.reportsEditor);
      await assertSucceeds(setDoc(doc(db, reports(), freshId("r-entwurf")), phase2DocData("reports", "x")));
      await assertSucceeds(updateDoc(doc(db, reports(), EXISTING_DOC_ID), { notiz: "geändert" }));
      await assertSucceeds(updateDoc(doc(db, reports(), EXISTING_DOC_ID), { status: "Fertig", updatedAt: T }));
      await assertSucceeds(updateDoc(doc(db, reports(), EXISTING_DOC_ID), { status: "Archiviert", updatedAt: T }));
    });

    it("Bearbeiter ohne pdf.exportieren: Wechsel in „PDF exportiert“ oder „Excel exportiert“ → DENY", async () => {
      const db = as(U.reportsEditor);
      await assertFails(updateDoc(doc(db, reports(), EXISTING_DOC_ID), { status: "PDF exportiert", updatedAt: T }));
      await assertFails(updateDoc(doc(db, reports(), EXISTING_DOC_ID), { status: "Excel exportiert", updatedAt: T }));
    });

    it("Bearbeiter ohne pdf.exportieren: Anlegen direkt mit Export-Status → DENY", async () => {
      const db = as(U.reportsEditor);
      await assertFails(setDoc(doc(db, reports(), freshId("r-pdf")), phase2DocData("reports", "x", { status: "PDF exportiert" })));
      await assertFails(setDoc(doc(db, reports(), freshId("r-xls")), phase2DocData("reports", "x", { status: "Excel exportiert" })));
    });

    it("Bearbeiter ohne pdf.exportieren: bereits exportierter Bericht – andere Felder ändern oder Status unverändert mitsenden → ALLOW", async () => {
      const db = as(U.reportsEditor);
      await assertSucceeds(updateDoc(doc(db, reports(), "exported-report"), { notiz: "nachträglich" }));
      await assertSucceeds(updateDoc(doc(db, reports(), "exported-report"), { status: "PDF exportiert", notiz: "gleicher Status" }));
    });

    it("Bearbeiter ohne pdf.exportieren: von „PDF exportiert“ nach „Excel exportiert“ (neuer Export-Status) → DENY; zurück nach „Fertig“ → ALLOW", async () => {
      const db = as(U.reportsEditor);
      await assertFails(updateDoc(doc(db, reports(), "exported-report"), { status: "Excel exportiert" }));
      await assertSucceeds(updateDoc(doc(db, reports(), "exported-report"), { status: "Fertig" }));
      // zurücksetzen für Folgetests
      await seed(env, async (firestore) => {
        await updateDoc(doc(firestore, reports(), "exported-report"), { status: "PDF exportiert" });
      });
    });

    it("Bearbeiter MIT pdf.exportieren: Export-Status setzen und Berichte mit Export-Status anlegen → ALLOW", async () => {
      const db = as(U.reportsExporter);
      await assertSucceeds(updateDoc(doc(db, reports(), EXISTING_DOC_ID), { status: "PDF exportiert", updatedAt: T }));
      await assertSucceeds(updateDoc(doc(db, reports(), EXISTING_DOC_ID), { status: "Excel exportiert", updatedAt: T }));
      await assertSucceeds(setDoc(doc(db, reports(), freshId("r-exp")), phase2DocData("reports", "x", { status: "PDF exportiert" })));
    });

    it("pdf.exportieren ALLEIN genügt nicht: ohne berichte.bearbeiten/erstellen kein Update/Create", async () => {
      const db = as(U.pdfOnly);
      await assertFails(updateDoc(doc(db, reports(), EXISTING_DOC_ID), { status: "PDF exportiert" }));
      await assertFails(setDoc(doc(db, reports(), freshId("r-pdfonly")), phase2DocData("reports", "x", { status: "PDF exportiert" })));
      await assertSucceeds(getDoc(doc(db, reports(), EXISTING_DOC_ID)));
    });

    it("Systemrollen gemäß Matrix: Prüfer (hat beide Rechte) darf exportieren, Administrator ebenso; Azubi/Gast nie", async () => {
      await assertSucceeds(updateDoc(doc(as(P.pruefer), reports(), EXISTING_DOC_ID), { status: "PDF exportiert" }));
      await assertSucceeds(updateDoc(doc(as(P.admin), reports(), EXISTING_DOC_ID), { status: "Excel exportiert" }));
      await assertFails(updateDoc(doc(as(P.azubi), reports(), EXISTING_DOC_ID), { status: "PDF exportiert" }));
      await assertFails(updateDoc(doc(as(P.gast), reports(), EXISTING_DOC_ID), { status: "PDF exportiert" }));
    });
  });

  // ---------------------------------------------------------------------------
  describe("G: testValues – sampleId entspricht der Dokument-ID und ist danach unveränderlich", () => {
    const testValues = () => path("testValues");

    it("anlegen mit sampleId == Dokument-ID → ALLOW", async () => {
      await assertSucceeds(setDoc(doc(as(U.tvWriter), testValues(), "S-100"), phase2DocData("testValues", "S-100", { id: "S-100" })));
    });

    it("anlegen mit abweichender sampleId (fremde Probe eingeschleust) → DENY", async () => {
      await assertFails(setDoc(doc(as(U.tvWriter), testValues(), "S-101"), { ...phase2DocData("testValues", "S-101"), sampleId: "S-999" }));
    });

    it("anlegen ohne sampleId oder mit nicht-String-sampleId → DENY", async () => {
      const withoutSampleId: Record<string, unknown> = { ...phase2DocData("testValues", "S-102") };
      delete withoutSampleId.sampleId;
      await assertFails(setDoc(doc(as(U.tvWriter), testValues(), "S-102"), withoutSampleId));
      await assertFails(setDoc(doc(as(U.tvWriter), testValues(), "S-103"), { ...withoutSampleId, sampleId: 103 }));
    });

    it("sampleId == Dokument-ID reicht allein nicht: ohne pruefungen.erstellen → DENY", async () => {
      await assertFails(setDoc(doc(as(U.readOnly), testValues(), "S-104"), phase2DocData("testValues", "S-104")));
    });

    it("update anderer Felder → ALLOW; sampleId ändern oder entfernen → DENY; sampleId unverändert mitsenden → ALLOW", async () => {
      const db = as(U.tvWriter);
      await assertSucceeds(updateDoc(doc(db, testValues(), "tv-existing"), { notiz: "Messwerte", updatedAt: T }));
      await assertFails(updateDoc(doc(db, testValues(), "tv-existing"), { sampleId: "anderer" }));
      await assertSucceeds(updateDoc(doc(db, testValues(), "tv-existing"), { sampleId: "tv-existing", notiz: "gleiche ID" }));
    });

    it("sampleId lässt sich nicht per update über deleteField entfernen", async () => {
      await assertFails(updateDoc(doc(as(U.tvWriter), testValues(), "tv-existing"), { sampleId: deleteField() }));
    });
  });

  // ---------------------------------------------------------------------------
  describe("H: Tenant-Isolation – ein Administrator aus company-a greift auf company-b zu", () => {
    for (const name of PHASE2_COLLECTIONS) {
      it(`${name}: get, list, create, update, delete in company-b → alles DENY`, async () => {
        const db = as(P.admin); // Membership company-a, Rolle admin mit ALLEN Rechten in company-a
        const pathB = path(name, COMPANY_B);
        await assertFails(getDoc(doc(db, pathB, EXISTING_DOC_ID)));
        await assertFails(getDocs(collection(db, pathB)));
        await assertFails(setDoc(doc(db, pathB, "intruder"), phase2DocData(name, "intruder")));
        await assertFails(updateDoc(doc(db, pathB, EXISTING_DOC_ID), { notiz: "x" }));
        await assertFails(deleteDoc(doc(db, pathB, EXISTING_DOC_ID)));
        // Gegenprobe: dieselben Rechte in der EIGENEN Firma funktionieren (die Rules lehnen nicht pauschal ab).
        await assertSucceeds(getDoc(doc(db, path(name), EXISTING_DOC_ID)));
      });

      it(`${name}: Mitglied von company-b (Administrator dort) greift auf company-a zu → alles DENY`, async () => {
        const db = as(P.wrongCompany);
        await assertFails(getDoc(doc(db, path(name), EXISTING_DOC_ID)));
        await assertFails(getDocs(collection(db, path(name))));
        await assertFails(setDoc(doc(db, path(name), "intruder-b"), phase2DocData(name, "intruder-b")));
        await assertFails(updateDoc(doc(db, path(name), EXISTING_DOC_ID), { notiz: "x" }));
        await assertFails(deleteDoc(doc(db, path(name), EXISTING_DOC_ID)));
      });
    }

    it("die Rolle wird in der Firma des Pfads gesucht: gleiche roleId in company-b mit allen Rechten nützt einem Mitglied von company-a nicht", async () => {
      const db = as(U.splitRole);
      for (const name of PHASE2_COLLECTIONS) {
        await assertFails(getDoc(doc(db, path(name), EXISTING_DOC_ID))); // A: Rolle ohne Rechte
        await assertFails(getDoc(doc(db, path(name, COMPANY_B), EXISTING_DOC_ID))); // B: falsche Membership-Firma
      }
    });
  });

  // ---------------------------------------------------------------------------
  describe("I: Bulk-Operationen (writeBatch) – Access-Call-Limit", () => {
    it("25 Updates in einem Batch (Archivieren) mit proben.bearbeiten → ALLOW", async () => {
      const db = as(U.bulk);
      const batch = writeBatch(db);
      for (const id of BULK_IDS) batch.update(doc(db, path("samples"), id), { status: "Archiviert", updatedAt: T });
      await assertSucceeds(batch.commit());
    });

    it("25 Deletes in einem Batch mit proben.loeschen → ALLOW", async () => {
      const db = as(U.bulk);
      const batch = writeBatch(db);
      for (const id of BULK_DELETE_IDS) batch.delete(doc(db, path("samples"), id));
      await assertSucceeds(batch.commit());
    });

    it("Batch ohne das Recht → komplett DENY (atomar: nichts wird geschrieben)", async () => {
      const db = as(U.readOnly);
      const batch = writeBatch(db);
      for (const id of BULK_IDS.slice(0, 5)) batch.update(doc(db, path("samples"), id), { status: "Offen" });
      await assertFails(batch.commit());
      const snapshot = await assertSucceeds(getDoc(doc(db, path("samples"), BULK_IDS[0])));
      assert.equal(snapshot.data()?.status, "Archiviert", "der abgelehnte Batch darf nichts geändert haben");
    });

    it("gemischter Batch: ein nicht erlaubter Eintrag (Kunde ändern) lässt den ganzen Batch scheitern", async () => {
      const db = as(U.bulk);
      const batch = writeBatch(db);
      batch.update(doc(db, path("samples"), BULK_IDS[1]), { status: "Offen" });
      batch.update(doc(db, path("customers"), EXISTING_DOC_ID), { notiz: "x" });
      await assertFails(batch.commit());
    });
  });

  // ---------------------------------------------------------------------------
  describe("J: Service-Abläufe – Lesen vor/nach dem Schreiben (Abhängigkeit des Clients, KEINE Rules-Pflicht)", () => {
    it("die Rules verlangen für Schreibvorgänge kein *.ansehen: nur proben.erstellen → setDoc ALLOW", async () => {
      await assertSucceeds(setDoc(doc(as(U.onlyCreate), path("samples"), "created-without-read"), phase2DocData("samples", "created-without-read")));
    });

    it("createSample liest vorher per getDoc (Probennummer eindeutig?) → ohne proben.ansehen DENY", async () => {
      await assertFails(getDoc(doc(as(U.onlyCreate), path("samples"), "does-not-exist")));
    });

    it("updateSample liest nachher zurück: ohne *.ansehen ist das Schreiben erlaubt, das Zurücklesen DENY", async () => {
      const uid = singleKeyUid("samples", "update");
      await assertSucceeds(updateDoc(doc(as(uid), path("samples"), EXISTING_DOC_ID), { notiz: "x" }));
      await assertFails(getDoc(doc(as(uid), path("samples"), EXISTING_DOC_ID)));
    });

    it("removeX löscht ohne vorheriges Lesen: nur *.loeschen genügt", async () => {
      const uid = singleKeyUid("customers", "delete");
      await assertSucceeds(deleteDoc(doc(as(uid), path("customers"), `del-${uid}`)));
    });

    it("Laborbuch-Update läuft in einer Transaktion (transaction.get): nur laborbuch.bearbeiten → DENY, mit laborbuch.ansehen → ALLOW", async () => {
      const update = (uid: string) => {
        const db = as(uid);
        return runTransaction(db, async (transaction) => {
          const ref = doc(db, path("laborbook"), "lb-1");
          await transaction.get(ref);
          transaction.update(ref, { notiz: `Transaktion von ${uid}` });
        });
      };
      await assertFails(update(U.editOnly));
      await assertSucceeds(update(U.editAndRead));
    });

    it("Auflisten ist ein eigener Vorgang: list verlangt ebenfalls *.ansehen (z. B. Dialoge, die Kunden/Projekte/Geräte laden)", async () => {
      const uid = singleKeyUid("customers", "create");
      await assertFails(getDocs(collection(as(uid), path("customers"))));
    });
  });

  // ---------------------------------------------------------------------------
  describe("K: Snapshots bestimmen nie Rechte (nur Membership.roleId → Role.permissions)", () => {
    it("Azubi bleibt Azubi, auch wenn Employee.roleId/role, users.role und Membership.role „admin“/„Administrator“ sagen", async () => {
      await seed(env, async (firestore) => {
        await updateDoc(doc(firestore, collectionPath("employees", COMPANY_A), "emp-azubi"), { roleId: "admin", role: "Administrator" });
        await setDoc(doc(firestore, COLLECTIONS.USERS, P.azubi), {
          id: P.azubi,
          email: "azubi@example.de",
          firstName: "A",
          lastName: "Z",
          role: "admin",
          plan: "azubi",
          language: "de",
          theme: "light",
        });
      });
      const db = as(P.azubi);
      // Die Membership des Seeds trägt role: "Administrator" als Namens-Snapshot, roleId bleibt "azubi".
      await assertSucceeds(getDoc(doc(db, path("samples"), EXISTING_DOC_ID))); // proben.ansehen (azubi)
      await assertFails(deleteDoc(doc(db, path("devices"), `del-${P.azubi}`)));
      await assertFails(setDoc(doc(db, path("customers"), "azubi-customer"), phase2DocData("customers", "azubi-customer")));
      await assertFails(updateDoc(doc(db, path("projects"), EXISTING_DOC_ID), { notiz: "x" }));
      await assertFails(deleteDoc(doc(db, path("samples"), `del-${P.azubi}`)));
    });

    it("umgekehrt: Administrator bleibt Administrator, auch wenn Employee/Profil „gast“ sagen", async () => {
      await seed(env, async (firestore) => {
        await updateDoc(doc(firestore, collectionPath("employees", COMPANY_A), "emp-admin"), { roleId: "gast", role: "Gast" });
      });
      await assertSucceeds(setDoc(doc(as(P.admin), path("devices"), "snapshot-check"), phase2DocData("devices", "snapshot-check")));
      await assertSucceeds(updateDoc(doc(as(P.admin), path("projects"), EXISTING_DOC_ID), { notiz: "admin" }));
    });
  });
});
