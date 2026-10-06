// Konfigurations-Invarianten der Berechtigungs-Taxonomie und der
// Systemrollen-Matrix (src/config/roles.ts). Reine Unit-Tests ohne Firestore und
// ohne Emulator: sie prüfen die Konfiguration, NICHT eine Durchsetzung.
// Policy: docs/database/permissions.md.
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ADMIN_ONLY_DELETE_PERMISSION_KEYS,
  DESTRUCTIVE_PERMISSION_KEYS,
  PROTECTED_ROLE_PERMISSION_KEYS,
  RESTRICTED_PERMISSION_KEYS,
  SYSTEM_ROLE_IDS,
  allPermissionKeys,
  buildPermissions,
  permissionCategories,
  roles,
} from "../../src/config/roles";
import {
  ADMIN_ROLE_ID,
  countGrantedPermissions,
  normalizePermissions,
  normalizeRole,
} from "../../src/lib/roles/roleRules";

// Die 31 Schlüssel vor dem Taxonomie-Slice. Sie dürfen nie verschwinden oder
// umbenannt werden, sonst verlieren gespeicherte Rollen-Dokumente Rechte.
const LEGACY_KEYS = [
  "dashboard.anzeigen",
  "proben.ansehen",
  "proben.erstellen",
  "proben.bearbeiten",
  "proben.loeschen",
  "pruefungen.ansehen",
  "pruefungen.erstellen",
  "pruefungen.bearbeiten",
  "pruefungen.loeschen",
  "kunden.ansehen",
  "kunden.erstellen",
  "kunden.bearbeiten",
  "kunden.loeschen",
  "projekte.ansehen",
  "projekte.erstellen",
  "projekte.bearbeiten",
  "projekte.loeschen",
  "geraete.ansehen",
  "geraete.bearbeiten",
  "laborbuch.ansehen",
  "laborbuch.bearbeiten",
  "kalender.ansehen",
  "kalender.termine_erstellen",
  "pdf.exportieren",
  "ki.verwenden",
  "administration.mitarbeiter_verwalten",
  "administration.rollen_verwalten",
  "administration.standorte_verwalten",
  "administration.branding_aendern",
  "administration.abrechnung_verwalten",
  "administration.systemeinstellungen_aendern",
];

// Die 14 in diesem Slice ergänzten Schlüssel.
const NEW_KEYS = [
  "geraete.erstellen",
  "geraete.loeschen",
  "kalender.bearbeiten",
  "kalender.loeschen",
  "laborbuch.erstellen",
  "laborbuch.loeschen",
  "berichte.ansehen",
  "berichte.erstellen",
  "berichte.bearbeiten",
  "berichte.loeschen",
  "standorte.ansehen",
  "mitarbeiter.ansehen",
  "rollen.ansehen",
  "rollen.admin_verwalten",
];

const ADMIN_SUPERUSER_KEY = "rollen.admin_verwalten";

function role(id: string) {
  const found = roles.find((candidate) => candidate.id === id);
  assert.ok(found, `Rolle ${id} fehlt in der Config`);
  return found;
}

function granted(id: string): string[] {
  return Object.entries(role(id).permissions)
    .filter(([, value]) => value)
    .map(([key]) => key);
}

// Lesende Berechtigungen: `<modul>.ansehen` und `dashboard.anzeigen`.
const isReadKey = (key: string) => key.endsWith(".ansehen") || key === "dashboard.anzeigen";

describe("Permission-Taxonomie", () => {
  it("enthält 45 Schlüssel (31 bestehende + 14 neue)", () => {
    assert.equal(allPermissionKeys.length, 45);
    assert.equal(LEGACY_KEYS.length, 31);
    assert.equal(NEW_KEYS.length, 14);
  });

  it("Schlüssel sind eindeutig", () => {
    assert.equal(new Set(allPermissionKeys).size, allPermissionKeys.length);
  });

  it("alle bisherigen 31 Schlüssel sind unverändert vorhanden (kein Schlüssel entfernt/umbenannt)", () => {
    for (const key of LEGACY_KEYS) assert.ok(allPermissionKeys.includes(key), `${key} fehlt`);
  });

  it("die 14 neuen Schlüssel sind vorhanden und es gibt keine weiteren", () => {
    for (const key of NEW_KEYS) assert.ok(allPermissionKeys.includes(key), `${key} fehlt`);
    const extras = allPermissionKeys.filter((key) => !LEGACY_KEYS.includes(key) && !NEW_KEYS.includes(key));
    assert.deepEqual(extras, []);
  });

  it("jede Kategorie hat Schlüssel; jeder Schlüssel hat ein Label; Format <bereich>.<aktion>", () => {
    for (const category of permissionCategories) {
      assert.ok(category.permissions.length > 0, `Kategorie ${category.key} ist leer`);
      for (const permission of category.permissions) {
        assert.ok(permission.label.trim().length > 0, `${permission.key} ohne Label`);
        assert.match(permission.key, /^[a-z]+\.[a-z_]+$/, permission.key);
      }
    }
  });

  it("jedes Modul mit CRUD-Systematik hat ansehen/erstellen/bearbeiten/loeschen", () => {
    const crud = ["proben", "pruefungen", "kunden", "projekte", "geraete", "laborbuch", "berichte"];
    for (const area of crud) {
      for (const action of ["ansehen", "erstellen", "bearbeiten", "loeschen"]) {
        assert.ok(allPermissionKeys.includes(`${area}.${action}`), `${area}.${action} fehlt`);
      }
    }
    // Kalender: Legacy-Schlüssel `termine_erstellen` ist das „erstellen“.
    for (const key of ["kalender.ansehen", "kalender.termine_erstellen", "kalender.bearbeiten", "kalender.loeschen"]) {
      assert.ok(allPermissionKeys.includes(key), `${key} fehlt`);
    }
  });

  it("Lese-Rechte für Standorte, Mitarbeiter und Rollen sind eigene Schlüssel", () => {
    for (const key of ["standorte.ansehen", "mitarbeiter.ansehen", "rollen.ansehen"]) {
      assert.ok(allPermissionKeys.includes(key), `${key} fehlt`);
    }
  });

  it("Risikoklassen: restricted = 4 Superuser-Schlüssel, destructive = alle *.loeschen", () => {
    assert.deepEqual([...RESTRICTED_PERMISSION_KEYS].sort(), [
      "administration.abrechnung_verwalten",
      "administration.branding_aendern",
      "administration.systemeinstellungen_aendern",
      "rollen.admin_verwalten",
    ]);
    assert.deepEqual(
      [...DESTRUCTIVE_PERMISSION_KEYS].sort(),
      allPermissionKeys.filter((key) => key.endsWith(".loeschen")).sort()
    );
    assert.equal(DESTRUCTIVE_PERMISSION_KEYS.length, 8);
  });

  it("buildPermissions liefert genau die bekannten Schlüssel; Unbekanntes wird ignoriert", () => {
    const built = buildPermissions(["proben.ansehen", "gibt.es.nicht"]);
    assert.deepEqual(Object.keys(built).sort(), [...allPermissionKeys].sort());
    assert.equal(built["proben.ansehen"], true);
    assert.equal("gibt.es.nicht" in built, false);
  });
});

describe("Systemrollen-Matrix", () => {
  it("enthält alle fünf Systemrollen mit type System (und die Config nichts anderes als System)", () => {
    assert.deepEqual([...SYSTEM_ROLE_IDS], ["admin", "laborleiter", "pruefer", "azubi", "gast"]);
    for (const id of SYSTEM_ROLE_IDS) assert.equal(role(id).type, "System");
    assert.equal(roles.filter((candidate) => candidate.type === "System").length, 5);
  });

  it("jede Rolle der Config hat genau die bekannten Schlüssel (keine unbekannten, keine fehlenden)", () => {
    for (const candidate of roles) {
      assert.deepEqual(
        Object.keys(candidate.permissions).sort(),
        [...allPermissionKeys].sort(),
        `Rolle ${candidate.id}`
      );
    }
  });

  it("Rollen-IDs und -Namen sind eindeutig", () => {
    assert.equal(new Set(roles.map((candidate) => candidate.id)).size, roles.length);
    assert.equal(new Set(roles.map((candidate) => candidate.name.toLowerCase())).size, roles.length);
  });

  it("Administrator hat alle bekannten Permissions (true)", () => {
    assert.equal(ADMIN_ROLE_ID, "admin");
    for (const key of allPermissionKeys) assert.equal(role("admin").permissions[key], true, key);
    assert.equal(countGrantedPermissions(role("admin").permissions), 45);
  });

  it("Superuser-Schlüssel (restricted) liegen nur beim Administrator – bei keiner anderen Rolle", () => {
    for (const key of RESTRICTED_PERMISSION_KEYS) {
      const holders = roles.filter((candidate) => candidate.permissions[key]).map((candidate) => candidate.id);
      assert.deepEqual(holders, ["admin"], key);
    }
    const holders = roles.filter((candidate) => candidate.permissions[ADMIN_SUPERUSER_KEY]).map((c) => c.id);
    assert.deepEqual(holders, ["admin"]);
  });

  it("geschützte Rollen-Permissions: 4 Restricted + 3 Admin-only-Löschrechte; Risikoklasse der Löschrechte bleibt destructive", () => {
    assert.deepEqual([...ADMIN_ONLY_DELETE_PERMISSION_KEYS].sort(), ["berichte.loeschen", "geraete.loeschen", "laborbuch.loeschen"]);
    assert.deepEqual(
      [...PROTECTED_ROLE_PERMISSION_KEYS].sort(),
      [...RESTRICTED_PERMISSION_KEYS, ...ADMIN_ONLY_DELETE_PERMISSION_KEYS].sort()
    );
    for (const key of ADMIN_ONLY_DELETE_PERMISSION_KEYS) {
      assert.ok(DESTRUCTIVE_PERMISSION_KEYS.includes(key), `${key} muss destructive bleiben`);
      assert.ok(!RESTRICTED_PERMISSION_KEYS.includes(key), `${key} ist nicht restricted`);
    }
  });

  it("alle geschützten Rollen-Permissions liegen nur beim Administrator (Matrix entspricht der geschützten Menge)", () => {
    for (const key of PROTECTED_ROLE_PERMISSION_KEYS) {
      const holders = roles.filter((candidate) => candidate.permissions[key]).map((candidate) => candidate.id);
      assert.deepEqual(holders, ["admin"], key);
    }
  });

  it("normale Löschrechte (proben, pruefungen, kunden, projekte, kalender) sind NICHT geschützt und beim Laborleiter vorhanden", () => {
    for (const key of ["proben.loeschen", "pruefungen.loeschen", "kunden.loeschen", "projekte.loeschen", "kalender.loeschen"]) {
      assert.ok(!PROTECTED_ROLE_PERMISSION_KEYS.includes(key), key);
      assert.equal(role("laborleiter").permissions[key], true, key);
    }
  });

  it("Laborleiter: Verwaltung ja, Administratorrechte nein", () => {
    const laborleiter = granted("laborleiter");
    for (const key of [
      "administration.mitarbeiter_verwalten",
      "administration.standorte_verwalten",
      "administration.rollen_verwalten",
      "mitarbeiter.ansehen",
      "standorte.ansehen",
      "rollen.ansehen",
    ]) {
      assert.ok(laborleiter.includes(key), `${key} fehlt beim Laborleiter`);
    }
    for (const key of RESTRICTED_PERMISSION_KEYS) assert.ok(!laborleiter.includes(key), `${key} darf er nicht haben`);
    assert.equal(laborleiter.length, 38);
  });

  it("Löschen: nur Administrator und Laborleiter; Geräte/Laborbuch/Berichte nur Administrator", () => {
    for (const id of ["pruefer", "azubi", "gast"]) {
      const forbidden = granted(id).filter((key) => DESTRUCTIVE_PERMISSION_KEYS.includes(key));
      assert.deepEqual(forbidden, [], `${id} darf nicht endgültig löschen`);
    }
    for (const key of ["geraete.loeschen", "laborbuch.loeschen", "berichte.loeschen"]) {
      const holders = roles.filter((candidate) => candidate.permissions[key]).map((candidate) => candidate.id);
      assert.deepEqual(holders, ["admin"], key);
    }
  });

  it("Azubi darf keine Proben löschen (Sprint-Regel) und hat keine Verwaltungsrechte", () => {
    assert.equal(role("azubi").permissions["proben.loeschen"], false);
    const azubi = granted("azubi");
    assert.deepEqual(azubi.filter((key) => key.startsWith("administration.") || key === ADMIN_SUPERUSER_KEY), []);
    assert.deepEqual(azubi.filter((key) => key === "mitarbeiter.ansehen" || key === "rollen.ansehen"), []);
  });

  it("Prüfer: keine Rollen-/Mitarbeiter-/Standort-Administration", () => {
    const pruefer = granted("pruefer");
    assert.deepEqual(pruefer.filter((key) => key.startsWith("administration.") || key === ADMIN_SUPERUSER_KEY), []);
    assert.deepEqual(pruefer.filter((key) => key === "mitarbeiter.ansehen" || key === "rollen.ansehen"), []);
  });

  it("Gast hat nur Lese-Rechte und keine Write-/Admin-Permissions", () => {
    const gast = granted("gast");
    assert.ok(gast.length > 0);
    assert.deepEqual(
      gast.filter((key) => !isReadKey(key)),
      []
    );
    assert.deepEqual(
      gast.filter((key) => key.startsWith("administration.") || key === ADMIN_SUPERUSER_KEY),
      []
    );
    for (const key of ["pdf.exportieren", "ki.verwenden", "mitarbeiter.ansehen", "rollen.ansehen"]) {
      assert.equal(role("gast").permissions[key], false, key);
    }
  });

  it("Rechte nehmen von Administrator bis Gast monoton ab (Laborleiter ⊇ Prüfer ⊇ Azubi ⊇ Gast)", () => {
    const sets = ["laborleiter", "pruefer", "azubi", "gast"].map((id) => new Set(granted(id)));
    for (let index = 0; index < sets.length - 1; index += 1) {
      for (const key of sets[index + 1]) {
        assert.ok(sets[index].has(key), `${key} ist in einer niedrigeren Rolle, aber nicht in der höheren`);
      }
    }
  });

  it("Anzahl gewährter Rechte je Systemrolle", () => {
    const counts = Object.fromEntries(SYSTEM_ROLE_IDS.map((id) => [id, granted(id).length]));
    assert.deepEqual(counts, { admin: 45, laborleiter: 38, pruefer: 22, azubi: 13, gast: 9 });
  });

  it("Custom Roles der Config enthalten keine Superuser-Schlüssel", () => {
    for (const candidate of roles.filter((entry) => entry.type === "Benutzerdefiniert")) {
      for (const key of RESTRICTED_PERMISSION_KEYS) assert.equal(candidate.permissions[key], false, `${candidate.id}: ${key}`);
    }
  });

  it("Abhängigkeiten: wer Erstellen/Bearbeiten darf, kann auch ansehen", () => {
    const modules = ["proben", "pruefungen", "kunden", "projekte", "geraete", "laborbuch", "kalender", "berichte"];
    for (const candidate of roles) {
      for (const area of modules) {
        const writes = allPermissionKeys.filter((key) => key.startsWith(`${area}.`) && !key.endsWith(".ansehen"));
        if (writes.some((key) => candidate.permissions[key])) {
          assert.equal(candidate.permissions[`${area}.ansehen`], true, `${candidate.id}: ${area}.ansehen fehlt`);
        }
      }
    }
  });
});

describe("normalizePermissions / Legacy-Verhalten", () => {
  it("ein gespeichertes Rollen-Dokument mit nur den 31 alten Schlüsseln: neue Schlüssel gelten als false, alte bleiben", () => {
    const legacy: Record<string, boolean> = {};
    for (const key of LEGACY_KEYS) legacy[key] = true;
    const normalized = normalizePermissions(legacy);
    assert.equal(Object.keys(normalized).length, 45);
    for (const key of LEGACY_KEYS) assert.equal(normalized[key], true, key);
    for (const key of NEW_KEYS) assert.equal(normalized[key], false, key);
  });

  it("unbekannte Schlüssel fallen weg, fehlende gelten als false", () => {
    const normalized = normalizePermissions({ "proben.ansehen": true, "alt.entfernt": true } as Record<string, boolean>);
    assert.equal("alt.entfernt" in normalized, false);
    assert.equal(normalized["proben.ansehen"], true);
    assert.equal(normalized["proben.loeschen"], false);
  });

  it("normalizeRole beschneidet unbekannte Schlüssel einer Rolle", () => {
    const normalized = normalizeRole({ ...role("gast"), permissions: { "proben.ansehen": true, "x.y": true } as Record<string, boolean> });
    assert.equal(Object.keys(normalized.permissions).length, 45);
    assert.equal("x.y" in normalized.permissions, false);
  });
});
