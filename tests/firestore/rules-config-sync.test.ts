// Konsistenz zwischen firestore.rules und der TypeScript-Konfiguration
// (src/config/roles.ts). Rules können keine TypeScript-Konstanten importieren;
// die Listen sind deshalb in den Rules gespiegelt und werden hier abgesichert.
// KEIN Emulator nötig (liest nur die Rules-Datei als Text).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  ADMIN_ONLY_DELETE_PERMISSION_KEYS,
  PROTECTED_ROLE_PERMISSION_KEYS,
  RESTRICTED_PERMISSION_KEYS,
  SYSTEM_ROLE_IDS,
  allPermissionKeys,
  roles as configRoles,
} from "../../src/config/roles";
import { LEGACY_COLLECTIONS, PHASE1_COLLECTIONS } from "./helpers/fixtures";
import { RULES_PATH } from "./helpers/testEnv";

const rules = readFileSync(RULES_PATH, "utf8").replace(/\r\n/g, "\n");

// Entfernt //-Kommentare, damit Beispiele in Kommentaren nichts verfälschen.
const code = rules.replace(/\/\/[^\n]*/g, "");

// Rumpf einer Funktion `function name(...) { ... }` (bis zur schließenden Klammer auf Einrückung 4).
function functionBody(name: string): string {
  const match = code.match(new RegExp(`    function ${name}\\([^)]*\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
  assert.ok(match, `Funktion ${name} nicht gefunden`);
  return match[1];
}

function matchBlock(collection: string): string {
  const match = code.match(
    new RegExp(`    match /companies/\\{companyId\\}/${collection}/\\{[A-Za-z]+\\} \\{\\n([\\s\\S]*?)\\n    \\}\\n`)
  );
  assert.ok(match, `match-Block ${collection} nicht gefunden`);
  return match[1];
}

// Erlaubt auch leere Strings (""), sonst gerät die Anführungszeichen-Paarung durcheinander.
const stringLiterals = (text: string) => [...text.matchAll(/"([^"\n]*)"/g)].map((m) => m[1]);

describe("firestore.rules ↔ src/config/roles.ts", () => {
  it("die Restricted-Schlüssel in roleHasRestrictedKey entsprechen RESTRICTED_PERMISSION_KEYS", () => {
    const inRules = stringLiterals(functionBody("roleHasRestrictedKey")).sort();
    assert.deepEqual(inRules, [...RESTRICTED_PERMISSION_KEYS].sort());
  });

  it("die Restricted-Schlüssel in restrictedKeyChanged entsprechen RESTRICTED_PERMISSION_KEYS", () => {
    const inRules = [...new Set(stringLiterals(functionBody("restrictedKeyChanged")))].sort();
    assert.deepEqual(inRules, [...RESTRICTED_PERMISSION_KEYS].sort());
  });

  it("die Admin-only-Löschrechte in roleHasAdminOnlyDeleteKey und adminOnlyDeleteKeyChanged entsprechen ADMIN_ONLY_DELETE_PERMISSION_KEYS", () => {
    assert.deepEqual(
      stringLiterals(functionBody("roleHasAdminOnlyDeleteKey")).sort(),
      [...ADMIN_ONLY_DELETE_PERMISSION_KEYS].sort()
    );
    assert.deepEqual(
      [...new Set(stringLiterals(functionBody("adminOnlyDeleteKeyChanged")))].sort(),
      [...ADMIN_ONLY_DELETE_PERMISSION_KEYS].sort()
    );
  });

  it("die geschützten Rollen-Permissions (Restricted + Admin-only-Löschrechte) sind in den Rules vollständig und passen zur Config", () => {
    // Die Rules-Funktionen setzen die geschützte Menge aus beiden Teillisten zusammen.
    assert.match(functionBody("roleHasProtectedKey"), /roleHasRestrictedKey(roleData)s*||s*roleHasAdminOnlyDeleteKey(roleData)/);
    assert.match(functionBody("protectedKeyChanged"), /restrictedKeyChanged(newRole, oldRole)s*||s*adminOnlyDeleteKeyChanged(newRole, oldRole)/);
    const inRules = [
      ...stringLiterals(functionBody("roleHasRestrictedKey")),
      ...stringLiterals(functionBody("roleHasAdminOnlyDeleteKey")),
    ].sort();
    assert.deepEqual(inRules, [...PROTECTED_ROLE_PERMISSION_KEYS].sort());
    assert.equal(PROTECTED_ROLE_PERMISSION_KEYS.length, 7);
  });

  it("Rollen anlegen/ändern UND die Zuweisung (Mitarbeiter/Einladung) nutzen die komplette geschützte 7er-Menge", () => {
    const roles = matchBlock("roles");
    assert.ok(roles.includes("roleHasProtectedKey(request.resource.data)"), "roles create: geschützte Menge fehlt");
    assert.ok(roles.includes("protectedKeyChanged(request.resource.data, resource.data)"), "roles update: geschützte Menge fehlt");
    assert.ok(!roles.includes("roleHasRestrictedKey(") && !roles.includes("restrictedKeyChanged("), "roles: nur die geschützte Menge verwenden");
    // Zuweisung: roleIdIsProtected prüft die geschützte Menge (nicht nur die 4 Restricted-Keys),
    // bleibt fail-closed (nicht auflösbar) und schützt die Administrator-Rolle.
    const assignment = functionBody("roleIdIsProtected");
    assert.ok(assignment.includes("roleHasProtectedKey(get(rolePath(companyId, roleId)).data)"), "Zuweisung: geschützte Menge fehlt");
    assert.ok(!assignment.includes("roleHasRestrictedKey("), "Zuweisung darf nicht nur die Restricted-Menge prüfen");
    for (const part of ['!(roleId is string)', 'roleId == ""', 'roleId == "admin"', "!exists(rolePath(companyId, roleId))"]) {
      assert.ok(assignment.includes(part), `roleIdIsProtected: ${part} fehlt (fail-closed)`);
    }
    assert.ok(!/roleIdIsRestricted/.test(code), "veralteter Funktionsname roleIdIsRestricted");
    // Mitarbeiter und Einladungen verwenden diese Prüfung für aktuelle UND neue Rolle bzw. die eingeladene Rolle.
    const employees = matchBlock("employees");
    assert.ok(employees.includes('roleIdIsProtected(companyId, resource.data.get("roleId", ""))'));
    assert.ok(employees.includes('roleIdIsProtected(companyId, request.resource.data.get("roleId", ""))'));
    assert.ok(matchBlock("invitations").includes('roleIdIsProtected(companyId, request.resource.data.get("roleId", ""))'));
    // Die geschützte Menge, die roleHasProtectedKey tatsächlich abdeckt, ist genau die Config-Menge.
    const covered = [
      ...stringLiterals(functionBody("roleHasRestrictedKey")),
      ...stringLiterals(functionBody("roleHasAdminOnlyDeleteKey")),
    ].sort();
    assert.deepEqual(covered, [...PROTECTED_ROLE_PERMISSION_KEYS].sort());
  });

  it("die 45 bekannten Schlüssel in hasOnlyKnownPermissionKeys entsprechen exakt allPermissionKeys", () => {
    // Das Literal "permissions" (Feldname) ist kein Schlüssel; Permission-Schlüssel haben die Form <bereich>.<aktion>.
    const inRules = stringLiterals(functionBody("hasOnlyKnownPermissionKeys")).filter((literal) => literal.includes("."));
    assert.equal(inRules.length, 45, "die Rules-Liste hat nicht genau 45 Einträge");
    assert.equal(new Set(inRules).size, 45, "doppelte Schlüssel in der Rules-Liste");
    assert.deepEqual([...inRules].sort(), [...allPermissionKeys].sort());
    assert.equal(allPermissionKeys.length, 45);
  });

  it("Rollen anlegen UND ändern verlangen hasOnlyKnownPermissionKeys", () => {
    const roles = matchBlock("roles");
    const create = roles.slice(roles.indexOf("allow create"), roles.indexOf("allow update"));
    const update = roles.slice(roles.indexOf("allow update"), roles.indexOf("allow delete"));
    assert.ok(create.includes("hasOnlyKnownPermissionKeys(request.resource.data)"), "create: Prüfung auf bekannte Schlüssel fehlt");
    assert.ok(update.includes("hasOnlyKnownPermissionKeys(request.resource.data)"), "update: Prüfung auf bekannte Schlüssel fehlt");
  });

  it("hasOnlyKnownPermissionKeys erlaubt fehlende Schlüssel (nur hasOnly, kein hasAll) und die Rolle ohne permissions", () => {
    const body = functionBody("hasOnlyKnownPermissionKeys");
    assert.ok(body.includes("permissions.keys().hasOnly("), "hasOnly fehlt");
    assert.ok(!body.includes("hasAll("), "hasAll würde alle 45 Schlüssel erzwingen");
    assert.ok(body.includes('!("permissions" in roleData)'));
    assert.ok(body.includes("roleData.permissions is map"));
  });

  it("die Systemrollen-IDs in isSystemRoleId entsprechen SYSTEM_ROLE_IDS", () => {
    assert.deepEqual(stringLiterals(functionBody("isSystemRoleId")).sort(), [...SYSTEM_ROLE_IDS].sort());
  });

  it("jeder in den Rules verwendete Permission-Schlüssel existiert in der Taxonomie (kein Tippfehler)", () => {
    const keyLike = /^[a-z]+\.[a-z_]+$/;
    const used = new Set(stringLiterals(code).filter((literal) => keyLike.test(literal)));
    assert.ok(used.size > 0);
    for (const key of used) assert.ok(allPermissionKeys.includes(key), `${key} ist kein bekannter Permission-Schlüssel`);
  });

  it("die vier Phase-1-Collections nutzen hasPermission und NICHT mehr belongsToCompany", () => {
    for (const name of PHASE1_COLLECTIONS) {
      const block = matchBlock(name);
      assert.ok(block.includes("hasPermission("), `${name}: hasPermission fehlt`);
      assert.ok(!block.includes("belongsToCompany("), `${name}: darf nicht mehr nur belongsToCompany nutzen`);
    }
  });

  it("die acht übrigen Company-Collections prüfen unverändert nur belongsToCompany (kein hasPermission)", () => {
    assert.equal(LEGACY_COLLECTIONS.length, 8);
    for (const name of LEGACY_COLLECTIONS) {
      const block = matchBlock(name);
      assert.ok(block.includes("belongsToCompany(companyId)"), `${name}: belongsToCompany fehlt`);
      assert.ok(!block.includes("hasPermission("), `${name}: gehört noch nicht zu Phase 1`);
    }
  });

  it("Löschen ist in allen vier Phase-1-Collections verboten", () => {
    for (const name of PHASE1_COLLECTIONS) {
      assert.match(matchBlock(name), /allow delete: if false;/, name);
    }
  });

  it("hasPermission verlangt aktive Membership, nichtleere roleId, vorhandene aktive Rolle und liest Schlüssel mit Default", () => {
    const body = functionBody("hasPermission");
    for (const part of [
      "hasActiveMembership(companyId)",
      "currentRoleId() is string",
      'currentRoleId() != ""',
      "exists(rolePath(companyId, currentRoleId()))",
      '.get("status", "") == "Aktiv"',
      "roleGrants(",
    ]) {
      assert.ok(body.includes(part), `hasPermission: ${part} fehlt`);
    }
    // Nur exakt `true` gewährt, fehlende Schlüssel/Maps gelten als false.
    const grants = functionBody("roleGrants");
    assert.ok(grants.includes('"permissions" in roleData'));
    assert.ok(grants.includes(".get(permissionKey, false) == true"));
  });

  it("Rollen werden NICHT über den Snapshot membership.role oder users/{uid} aufgelöst", () => {
    assert.ok(!/get\("role"/.test(code), "membership.role darf nicht ausgewertet werden");
    assert.ok(!/documents\/users\//.test(code), "users/{uid} darf nicht zur Autorisierung gelesen werden");
  });

  it("die Konfigurations-Rollen enthalten alle bekannten Schlüssel (Test-Seed nutzt die echte Matrix)", () => {
    for (const role of configRoles) {
      for (const key of allPermissionKeys) assert.ok(key in role.permissions, `${role.id}: ${key} fehlt`);
    }
  });
});
