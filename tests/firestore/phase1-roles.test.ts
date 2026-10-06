// Phase 1: roles – der sensibelste Bereich. Lesen (eigene Rolle immer),
// Anlegen/Ändern nur mit rollen_verwalten, Restricted-Schlüssel nur mit
// rollen.admin_verwalten, Administrator-Rolle unveränderlich, kein Löschen.
import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

import {
  PROTECTED_ROLE_PERMISSION_KEYS,
  ADMIN_ONLY_DELETE_PERMISSION_KEYS,
  RESTRICTED_PERMISSION_KEYS,
  SYSTEM_ROLE_IDS,
  roles as configRoles,
} from "../../src/config/roles";
import {
  ARCHIVED_ROLE,
  BILLING_ROLE,
  COMPANY_A,
  DELETER_ROLE,
  LEGACY_31_KEYS,
  LEGACY_ADMIN_ROLE,
  P,
  collectionPath,
  legacyPermissionMap,
  newCustomRole,
  permissionMap,
  seedPhase1World,
} from "./helpers/fixtures";
import { asUser, createTestEnv, seed } from "./helpers/testEnv";

const rolesPath = collectionPath("roles", COMPANY_A);
const T = "2026-03-01T00:00:00.000Z";

// Aktuelle Permission-Map einer Config-Rolle (Basis für „nur ein Schlüssel ändert sich“).
function basePermissions(id: string): Record<string, boolean> {
  const role = configRoles.find((candidate) => candidate.id === id);
  if (!role) throw new Error(`Rolle ${id} fehlt`);
  return { ...role.permissions };
}

describe("Phase 1: roles", () => {
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

  const ref = (uid: string, id: string) => doc(asUser(env, uid), rolesPath, id);

  describe("lesen", () => {
    it("Administrator und Laborleiter lesen und listen alle Rollen (rollen.ansehen) → ALLOW", async () => {
      await assertSucceeds(getDocs(collection(asUser(env, P.admin), rolesPath)));
      await assertSucceeds(getDocs(collection(asUser(env, P.laborleiter), rolesPath)));
      await assertSucceeds(getDoc(ref(P.laborleiter, "admin")));
    });

    it("Prüfer, Azubi, Gast und Custom Role lesen ihre EIGENE Rolle (ohne rollen.ansehen) → ALLOW", async () => {
      await assertSucceeds(getDoc(ref(P.pruefer, "pruefer")));
      await assertSucceeds(getDoc(ref(P.azubi, "azubi")));
      await assertSucceeds(getDoc(ref(P.gast, "gast")));
      await assertSucceeds(getDoc(ref(P.baustellenleiter, "baustellenleiter")));
    });

    it("fremde Rollen ohne rollen.ansehen → DENY", async () => {
      await assertFails(getDoc(ref(P.pruefer, "admin")));
      await assertFails(getDoc(ref(P.azubi, "pruefer")));
      await assertFails(getDoc(ref(P.gast, "laborleiter")));
      await assertFails(getDoc(ref(P.baustellenleiter, "qualitaetsmanager")));
    });

    it("alle Rollen auflisten ohne rollen.ansehen → DENY (eigene Rolle gilt nur für get)", async () => {
      await assertFails(getDocs(collection(asUser(env, P.pruefer), rolesPath)));
      await assertFails(getDocs(collection(asUser(env, P.gast), rolesPath)));
    });

    it("Custom Role mit rollen.ansehen (HR) liest fremde Rollen → ALLOW", async () => {
      await assertSucceeds(getDoc(ref(P.hr, "admin")));
    });

    it("eigene Rolle lesen trotz archivierter Rolle → ALLOW (dokumentiertes Verhalten: nur Lesen, kein Recht)", async () => {
      await assertSucceeds(getDoc(ref(P.archivedRole, ARCHIVED_ROLE)));
      await assertFails(getDoc(ref(P.archivedRole, "pruefer")));
    });

    it("gesperrte Membership liest nicht einmal ihre eigene Rolle → DENY", async () => {
      await assertFails(getDoc(ref(P.blocked, "admin")));
    });

    it("Membership ohne roleId und Mitglied einer anderen Firma lesen keine Rolle → DENY", async () => {
      await assertFails(getDoc(ref(P.noRoleId, "pruefer")));
      await assertFails(getDoc(ref(P.wrongCompany, "admin")));
    });
  });

  describe("anlegen", () => {
    it("Laborleiter legt eine Custom Role ohne Restricted-Rechte an → ALLOW", async () => {
      await assertSucceeds(setDoc(ref(P.laborleiter, "r-new"), newCustomRole(permissionMap(["proben.ansehen", "kunden.ansehen"]))));
    });

    it("Laborleiter darf einer neuen Rolle rollen_verwalten/mitarbeiter_verwalten geben (nicht restricted) → ALLOW", async () => {
      await assertSucceeds(
        setDoc(
          ref(P.laborleiter, "r-new"),
          newCustomRole(permissionMap(["administration.rollen_verwalten", "administration.mitarbeiter_verwalten"]))
        )
      );
    });

    for (const key of RESTRICTED_PERMISSION_KEYS) {
      it(`Laborleiter legt eine Rolle mit ${key} an → DENY`, async () => {
        await assertFails(setDoc(ref(P.laborleiter, "r-new"), newCustomRole(permissionMap([key]))));
      });
    }

    it("Administrator legt eine Rolle mit allen Restricted-Rechten an → ALLOW", async () => {
      await assertSucceeds(setDoc(ref(P.admin, "r-new"), newCustomRole(permissionMap([...RESTRICTED_PERMISSION_KEYS]))));
    });

    it("Rolle als Systemrolle (type System) anlegen → DENY, auch für den Administrator", async () => {
      await assertFails(setDoc(ref(P.admin, "r-new"), newCustomRole(permissionMap([]), { type: "System" })));
    });

    it("Rolle mit der ID einer Systemrolle anlegen → DENY (Create-Pfad: das Systemrollen-Dokument existiert nicht)", async () => {
      for (const id of SYSTEM_ROLE_IDS) {
        // Frische Welt je ID (die vorherige Iteration hat ein Systemrollen-Dokument entfernt).
        await env.clearFirestore();
        await seedPhase1World(env);
        // Systemrollen-Dokument vorher (mit deaktivierten Rules) entfernen, damit setDoc ein ANLEGEN ist.
        await seed(env, async (firestore) => {
          await deleteDoc(doc(firestore, rolesPath, id));
        });
        // Handelnde Person: der Administrator; für die ID "admin" der Laborleiter, weil dem
        // Administrator nach dem Entfernen seiner Rolle jede Berechtigung fehlen würde. So
        // scheitert der Versuch ausschließlich an der Systemrollen-ID.
        const actor = id === "admin" ? P.laborleiter : P.admin;
        await assertFails(setDoc(ref(actor, id), newCustomRole(permissionMap([]))));
      }
    });

    it("Rolle mit status Archiviert anlegen → DENY", async () => {
      await assertFails(setDoc(ref(P.laborleiter, "r-new"), newCustomRole(permissionMap([]), { status: "Archiviert" })));
    });

    it("Rolle ohne permissions oder mit nicht-Map permissions → DENY", async () => {
      const withoutPermissions = newCustomRole(permissionMap([]));
      delete withoutPermissions.permissions;
      await assertFails(setDoc(ref(P.laborleiter, "r-1"), withoutPermissions));
      await assertFails(setDoc(ref(P.laborleiter, "r-2"), newCustomRole(permissionMap([]), { permissions: "alles" })));
    });

    it("Rolle ohne type → DENY", async () => {
      const noType = newCustomRole(permissionMap([]));
      delete noType.type;
      await assertFails(setDoc(ref(P.laborleiter, "r-new"), noType));
    });

    it("Prüfer, Azubi, Gast, Custom Role ohne rollen_verwalten legen eine Rolle an → DENY", async () => {
      for (const uid of [P.pruefer, P.azubi, P.gast, P.baustellenleiter, P.hr]) {
        await assertFails(setDoc(ref(uid, `r-by-${uid}`), newCustomRole(permissionMap(["proben.ansehen"]))));
      }
    });
  });

  describe("ändern: Custom Roles", () => {
    const customUpdate = (uid: string, changes: Record<string, unknown>, id = "baustellenleiter") =>
      updateDoc(ref(uid, id), { ...changes, updatedAt: T });

    it("Laborleiter ändert Name, Beschreibung und Farbe einer Custom Role → ALLOW", async () => {
      await assertSucceeds(customUpdate(P.laborleiter, { name: "Neuer Name" }));
      await assertSucceeds(customUpdate(P.laborleiter, { description: "Neu" }));
      await assertSucceeds(customUpdate(P.laborleiter, { color: "danger" }));
    });

    it("Laborleiter ändert Berechtigungen einer Custom Role (ohne Restricted) → ALLOW", async () => {
      await assertSucceeds(customUpdate(P.laborleiter, { permissions: { ...basePermissions("baustellenleiter"), "kunden.bearbeiten": true } }));
    });

    it("Laborleiter archiviert eine Custom Role → ALLOW; ungültiger Status → DENY", async () => {
      await assertSucceeds(customUpdate(P.laborleiter, { status: "Archiviert" }));
      await assertFails(customUpdate(P.laborleiter, { status: "Gelöscht" }));
    });

    for (const key of RESTRICTED_PERMISSION_KEYS) {
      it(`Laborleiter vergibt ${key} an eine Custom Role → DENY`, async () => {
        await assertFails(customUpdate(P.laborleiter, { permissions: { ...basePermissions("baustellenleiter"), [key]: true } }));
      });
    }

    it("Laborleiter entzieht einer Rolle einen Restricted-Schlüssel (Billing) → DENY; der Administrator → ALLOW", async () => {
      const withoutBilling = { ...permissionMap(["rollen.ansehen"]) };
      await assertFails(customUpdate(P.laborleiter, { permissions: withoutBilling }, BILLING_ROLE));
      await assertSucceeds(customUpdate(P.admin, { permissions: withoutBilling }, BILLING_ROLE));
    });

    it("Laborleiter ändert die Beschreibung einer Rolle MIT Restricted-Schlüssel (Schlüssel unverändert) → ALLOW", async () => {
      await assertSucceeds(customUpdate(P.laborleiter, { description: "nur Text" }, BILLING_ROLE));
    });

    it("Administrator vergibt Restricted-Schlüssel an eine Custom Role → ALLOW", async () => {
      await assertSucceeds(
        customUpdate(P.admin, { permissions: { ...basePermissions("baustellenleiter"), "rollen.admin_verwalten": true } })
      );
    });

    it("Wirksamer Wert zählt, nicht das Vorhandensein: Rolle vor der Migration, Laborleiter schreibt die volle 45-Schlüssel-Map mit unveränderten Restricted-Werten → ALLOW", async () => {
      await assertSucceeds(customUpdate(P.laborleiter, { permissions: legacyPermissionMap() }, LEGACY_ADMIN_ROLE));
    });

    it("type, createdAt oder unbekannte Felder ändern → DENY", async () => {
      await assertFails(customUpdate(P.admin, { type: "System" }));
      await assertFails(customUpdate(P.admin, { createdAt: "2030-01-01T00:00:00.000Z" }));
      await assertFails(customUpdate(P.admin, { isAdmin: true }));
    });

    it("Prüfer, Azubi, Gast, Custom Role ohne rollen_verwalten ändern eine Rolle → DENY", async () => {
      for (const uid of [P.pruefer, P.azubi, P.gast, P.baustellenleiter, P.hr]) {
        await assertFails(customUpdate(uid, { description: "x" }));
      }
    });
  });

  describe("ändern: Systemrollen und Administrator-Rolle", () => {
    const sysUpdate = (uid: string, id: string, changes: Record<string, unknown>) =>
      updateDoc(ref(uid, id), { ...changes, updatedAt: T });

    it("Laborleiter ändert Berechtigungen einer Systemrolle (nicht Admin, ohne Restricted) → ALLOW", async () => {
      await assertSucceeds(sysUpdate(P.laborleiter, "pruefer", { permissions: { ...basePermissions("pruefer"), "kunden.erstellen": true } }));
    });

    for (const key of RESTRICTED_PERMISSION_KEYS) {
      it(`Laborleiter vergibt ${key} an die Systemrolle Prüfer → DENY`, async () => {
        await assertFails(sysUpdate(P.laborleiter, "pruefer", { permissions: { ...basePermissions("pruefer"), [key]: true } }));
      });
    }

    it("Systemrolle umbenennen, Beschreibung/Farbe ändern, archivieren, type ändern → DENY (auch für den Administrator)", async () => {
      for (const uid of [P.laborleiter, P.admin]) {
        await assertFails(sysUpdate(uid, "pruefer", { name: "Prüferlein" }));
        await assertFails(sysUpdate(uid, "pruefer", { description: "x" }));
        await assertFails(sysUpdate(uid, "pruefer", { color: "danger" }));
        await assertFails(sysUpdate(uid, "pruefer", { status: "Archiviert" }));
        await assertFails(sysUpdate(uid, "pruefer", { type: "Benutzerdefiniert" }));
      }
    });

    it("Administrator-Rolle ist für ALLE unveränderlich (Berechtigungen, Beschreibung, nur updatedAt) → DENY", async () => {
      for (const uid of [P.admin, P.admin2, P.laborleiter]) {
        await assertFails(sysUpdate(uid, "admin", { permissions: { ...basePermissions("admin"), "berichte.loeschen": false } }));
        await assertFails(sysUpdate(uid, "admin", { description: "x" }));
        await assertFails(updateDoc(ref(uid, "admin"), { updatedAt: T }));
        await assertFails(sysUpdate(uid, "admin", { status: "Archiviert" }));
      }
    });

    it("Laborleiter entzieht der Administrator-Rolle einen Restricted-Schlüssel → DENY", async () => {
      await assertFails(sysUpdate(P.laborleiter, "admin", { permissions: { ...basePermissions("admin"), "rollen.admin_verwalten": false } }));
    });
  });

  // Policy: geraete./laborbuch./berichte.loeschen hält nur der Administrator. Sie sind
  // "destructive", aber – wie die Restricted-Schlüssel – beim Anlegen/Ändern einer Rolle nur
  // mit rollen.admin_verwalten vergeb- und entziehbar. Normale Löschrechte bleiben frei vergebbar.
  describe("geschützte Admin-only-Löschrechte (geraete., laborbuch., berichte.loeschen)", () => {
    const update = (uid: string, id: string, permissions: Record<string, boolean>) =>
      updateDoc(ref(uid, id), { permissions, updatedAt: T });

    for (const key of ADMIN_ONLY_DELETE_PERMISSION_KEYS) {
      it(`Laborleiter legt eine Custom Role mit ${key}=true an → DENY`, async () => {
        await assertFails(setDoc(ref(P.laborleiter, "r-new"), newCustomRole(permissionMap([key]))));
      });

      it(`Laborleiter setzt ${key} bei einer bestehenden Custom Role von false auf true → DENY`, async () => {
        await assertFails(update(P.laborleiter, "baustellenleiter", { ...basePermissions("baustellenleiter"), [key]: true }));
      });

      it(`Laborleiter entzieht ${key} einer bestehenden Rolle (true → false) → DENY`, async () => {
        await assertFails(update(P.laborleiter, DELETER_ROLE, { ...permissionMap(["proben.ansehen", "proben.loeschen", ...ADMIN_ONLY_DELETE_PERMISSION_KEYS]), [key]: false }));
      });

      it(`Laborleiter vergibt ${key} an eine Systemrolle (Prüfer) → DENY`, async () => {
        await assertFails(update(P.laborleiter, "pruefer", { ...basePermissions("pruefer"), [key]: true }));
      });

      it(`Administrator legt eine Rolle mit ${key}=true an und ändert/entzieht es → ALLOW`, async () => {
        await assertSucceeds(setDoc(ref(P.admin, "r-new"), newCustomRole(permissionMap([key]))));
        await assertSucceeds(update(P.admin, "baustellenleiter", { ...basePermissions("baustellenleiter"), [key]: true }));
        await assertSucceeds(
          update(P.admin, DELETER_ROLE, { ...permissionMap(["proben.ansehen", "proben.loeschen", ...ADMIN_ONLY_DELETE_PERMISSION_KEYS]), [key]: false })
        );
      });
    }

    it("Laborleiter legt eine Rolle mit allen drei Admin-only-Löschrechten an → DENY; Administrator → ALLOW", async () => {
      await assertFails(setDoc(ref(P.laborleiter, "r-1"), newCustomRole(permissionMap(ADMIN_ONLY_DELETE_PERMISSION_KEYS))));
      await assertSucceeds(setDoc(ref(P.admin, "r-1"), newCustomRole(permissionMap(ADMIN_ONLY_DELETE_PERMISSION_KEYS))));
    });

    it("Laborleiter ändert eine Rolle, die die Löschrechte BEREITS hat, ohne diese zu berühren (Beschreibung, proben.loeschen entziehen) → ALLOW", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, DELETER_ROLE), { description: "nur Text", updatedAt: T }));
      await assertSucceeds(
        update(P.laborleiter, DELETER_ROLE, permissionMap(["proben.ansehen", ...ADMIN_ONLY_DELETE_PERMISSION_KEYS]))
      );
    });

    it("normale Löschrechte (proben., pruefungen., kunden., projekte., kalender.loeschen) darf der Laborleiter weiterhin vergeben und entziehen → ALLOW", async () => {
      const normalDeletes = ["proben.loeschen", "pruefungen.loeschen", "kunden.loeschen", "projekte.loeschen", "kalender.loeschen"];
      await assertSucceeds(setDoc(ref(P.laborleiter, "r-new"), newCustomRole(permissionMap(["proben.ansehen", ...normalDeletes]))));
      await assertSucceeds(
        update(P.laborleiter, "baustellenleiter", { ...basePermissions("baustellenleiter"), "proben.loeschen": true, "kunden.loeschen": true })
      );
      await assertSucceeds(
        update(P.laborleiter, DELETER_ROLE, permissionMap(["proben.ansehen", ...ADMIN_ONLY_DELETE_PERMISSION_KEYS]))
      );
    });

    it("Administrator-Rolle bleibt für alle unveränderlich (auch beim Löschrecht-Schlüssel)", async () => {
      await assertFails(update(P.admin, "admin", { ...basePermissions("admin"), "geraete.loeschen": false }));
      await assertFails(update(P.laborleiter, "admin", { ...basePermissions("admin"), "berichte.loeschen": false }));
    });
  });

  // Future-Privilege-Risk: ein heute gespeicherter unbekannter Schlüssel mit true könnte in
  // einem späteren Release eine echte Berechtigung werden. Erlaubt sind nur die 45 bekannten
  // Schlüssel; fehlende bekannte Schlüssel gelten als false.
  describe("nur bekannte Permission-Schlüssel", () => {
    const unknown = "ghost.recht";
    const update = (uid: string, id: string, permissions: Record<string, unknown>) =>
      updateDoc(ref(uid, id), { permissions, updatedAt: T });

    it("Laborleiter und Administrator legen eine Rolle mit unbekanntem Schlüssel an (true oder false) → DENY", async () => {
      for (const uid of [P.laborleiter, P.admin]) {
        await assertFails(setDoc(ref(uid, `r-true-${uid}`), newCustomRole({ ...permissionMap(["proben.ansehen"]), [unknown]: true })));
        await assertFails(setDoc(ref(uid, `r-false-${uid}`), newCustomRole({ ...permissionMap(["proben.ansehen"]), [unknown]: false })));
      }
    });

    it("ein Tippfehler-Schlüssel (z. B. 'proben.loschen') wird nicht still akzeptiert → DENY", async () => {
      await assertFails(setDoc(ref(P.admin, "r-typo"), newCustomRole({ ...permissionMap([]), "proben.loschen": true })));
    });

    it("Laborleiter und Administrator ergänzen einen unbekannten Schlüssel bei einer bestehenden Custom Role → DENY", async () => {
      for (const uid of [P.laborleiter, P.admin]) {
        await assertFails(update(uid, "baustellenleiter", { ...basePermissions("baustellenleiter"), [unknown]: true }));
      }
    });

    it("unbekannter Schlüssel bei einer Systemrolle (Prüfer) → DENY", async () => {
      await assertFails(update(P.laborleiter, "pruefer", { ...basePermissions("pruefer"), [unknown]: true }));
      await assertFails(update(P.admin, "pruefer", { ...basePermissions("pruefer"), [unknown]: true }));
    });

    it("der unbekannte Schlüssel verhindert auch Änderungen anderer Felder nicht erst nach dem Speichern: neue Map ohne Fremdschlüssel → ALLOW", async () => {
      await assertSucceeds(update(P.laborleiter, "baustellenleiter", { ...basePermissions("baustellenleiter"), "kunden.bearbeiten": true }));
    });

    it("Legacy-Rolle mit nur den 31 alten Schlüsseln (physisch nur diese) bleibt gültig → ALLOW (Administrator, da sie geschützte Schlüssel enthält)", async () => {
      const legacy31 = Object.fromEntries(LEGACY_31_KEYS.map((key) => [key, true]));
      await assertSucceeds(setDoc(ref(P.admin, "r-legacy"), newCustomRole(legacy31)));
    });

    it("Legacy-Map ohne geschützte Schlüssel (nur 31er-Schlüssel, physisch nur diese) legt der Laborleiter an → ALLOW", async () => {
      const legacyPlain = Object.fromEntries(
        LEGACY_31_KEYS.filter((key) => !PROTECTED_ROLE_PERMISSION_KEYS.includes(key)).map((key) => [key, true])
      );
      await assertSucceeds(setDoc(ref(P.laborleiter, "r-legacy-plain"), newCustomRole(legacyPlain)));
    });

    it("Laborleiter schreibt die physische 31-Schlüssel-Map einer bestehenden Legacy-Rolle zurück (Werte unverändert) → ALLOW", async () => {
      const legacy31 = Object.fromEntries(LEGACY_31_KEYS.map((key) => [key, true]));
      await assertSucceeds(update(P.laborleiter, LEGACY_ADMIN_ROLE, legacy31));
    });

    it("normale Teilmenge bekannter Schlüssel (nur ein Schlüssel, leere Map) bleibt erlaubt → ALLOW", async () => {
      await assertSucceeds(setDoc(ref(P.laborleiter, "r-one"), newCustomRole({ "proben.ansehen": true })));
      await assertSucceeds(setDoc(ref(P.laborleiter, "r-empty"), newCustomRole({})));
      await assertSucceeds(update(P.laborleiter, "baustellenleiter", { "proben.ansehen": true, "kunden.ansehen": true }));
    });

    it("Rolle ohne permissions-Feld bleibt bei Updates anderer Felder möglich (nichts zu prüfen), Anlegen verlangt die Map weiterhin", async () => {
      await assertSucceeds(updateDoc(ref(P.laborleiter, "no-permissions-role"), { description: "x", updatedAt: T }));
    });
  });

  describe("löschen", () => {
    it("Rollen löschen → DENY für Administrator und Laborleiter (Custom, System, Administrator)", async () => {
      for (const uid of [P.admin, P.laborleiter]) {
        await assertFails(deleteDoc(ref(uid, "baustellenleiter")));
        await assertFails(deleteDoc(ref(uid, "pruefer")));
        await assertFails(deleteDoc(ref(uid, "admin")));
        await assertFails(deleteDoc(ref(uid, BILLING_ROLE)));
      }
    });

    it("Rollen löschen → DENY für Prüfer, Azubi, Gast", async () => {
      for (const uid of [P.pruefer, P.azubi, P.gast]) await assertFails(deleteDoc(ref(uid, "qualitaetsmanager")));
    });
  });

  describe("Migration: Rolle vor der Migration (nur 31 Schlüssel)", () => {
    it("Legacy-Administrator verliert Lesezugriff auf Rollen (rollen.ansehen fehlt), behält die Verwaltung", async () => {
      await assertFails(getDocs(collection(asUser(env, P.legacyAdmin), rolesPath)));
      await assertFails(getDoc(ref(P.legacyAdmin, "pruefer")));
      // eigene Rolle bleibt lesbar
      await assertSucceeds(getDoc(ref(P.legacyAdmin, LEGACY_ADMIN_ROLE)));
      // rollen_verwalten existiert als Legacy-Schlüssel -> Anlegen funktioniert
      await assertSucceeds(setDoc(ref(P.legacyAdmin, "r-new"), newCustomRole(permissionMap(["proben.ansehen"]))));
    });
  });
});
