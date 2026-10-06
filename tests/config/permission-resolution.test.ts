// Effektive Berechtigungen: dieselbe Kette wie die Firestore Rules
// (Membership.roleId -> Role-Dokument -> permissions[key]). Reine Unit-Tests.
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { allPermissionKeys, roles as configRoles } from "../../src/config/roles";
import {
  demoPermissions,
  emptyPermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  resolveEffectivePermissions,
} from "../../src/lib/permissions/permissionRules";
import type { Role } from "../../src/types/role";
import type { UserMembership } from "../../src/types/userMembership";

const membership = (overrides: Partial<UserMembership> = {}): UserMembership => ({
  uid: "user-1",
  companyId: "company-a",
  roleId: "pruefer",
  status: "Aktiv",
  ...overrides,
});

const role = (id: string): Role => {
  const found = configRoles.find((candidate) => candidate.id === id);
  assert.ok(found, `Rolle ${id} fehlt`);
  return found;
};

const count = (permissions: Record<string, boolean>) => Object.values(permissions).filter(Boolean).length;

describe("resolveEffectivePermissions: Systemrollen", () => {
  it("Administrator -> alle 45 Rechte", () => {
    const result = resolveEffectivePermissions({ membership: membership({ roleId: "admin" }), role: role("admin") });
    assert.equal(result.reason, null);
    assert.equal(allPermissionKeys.length, 45);
    for (const key of allPermissionKeys) assert.equal(result.permissions[key], true, key);
    assert.equal(count(result.permissions), 45);
    assert.equal(result.roleId, "admin");
  });

  it("Laborleiter, Prüfer, Azubi, Gast -> genau die Matrix der Config", () => {
    const expectedCounts: Record<string, number> = { laborleiter: 38, pruefer: 22, azubi: 13, gast: 9 };
    for (const [id, expected] of Object.entries(expectedCounts)) {
      const result = resolveEffectivePermissions({ membership: membership({ roleId: id }), role: role(id) });
      assert.equal(result.reason, null, id);
      assert.equal(count(result.permissions), expected, id);
      for (const key of allPermissionKeys) {
        assert.equal(result.permissions[key], role(id).permissions[key] === true, `${id}: ${key}`);
      }
    }
  });

  it("Laborleiter hat keine geschützten Rechte, der Administrator schon", () => {
    const laborleiter = resolveEffectivePermissions({ membership: membership({ roleId: "laborleiter" }), role: role("laborleiter") });
    assert.equal(hasPermission(laborleiter.permissions, "rollen.admin_verwalten"), false);
    assert.equal(hasPermission(laborleiter.permissions, "geraete.loeschen"), false);
    assert.equal(hasPermission(laborleiter.permissions, "administration.rollen_verwalten"), true);
  });
});

describe("resolveEffectivePermissions: fail-closed", () => {
  const none = (result: ReturnType<typeof resolveEffectivePermissions>) => count(result.permissions) === 0;

  it("fehlende Membership -> keine Rechte", () => {
    const result = resolveEffectivePermissions({ membership: undefined, role: role("admin") });
    assert.ok(none(result));
    assert.equal(result.reason, "membership-missing");
  });

  it("gesperrte oder ungültige Membership -> keine Rechte, auch mit Admin-Rolle", () => {
    const blocked = resolveEffectivePermissions({ membership: membership({ roleId: "admin", status: "Gesperrt" }), role: role("admin") });
    assert.ok(none(blocked));
    assert.equal(blocked.reason, "membership-blocked");
    const invalid = resolveEffectivePermissions({ membership: membership({ roleId: "admin", companyId: "" }), role: role("admin") });
    assert.ok(none(invalid));
    assert.equal(invalid.reason, "membership-invalid");
  });

  it("fehlende, leere oder nicht-String roleId -> keine Rechte (kein Admin-Fallback)", () => {
    for (const roleId of [undefined, "", "   ", 42 as unknown as string]) {
      const result = resolveEffectivePermissions({ membership: membership({ roleId }), role: role("admin") });
      assert.ok(none(result), String(roleId));
      assert.equal(result.reason, "no-role-id", String(roleId));
    }
  });

  it("Rollen-Dokument fehlt -> keine Rechte", () => {
    for (const missing of [undefined, null]) {
      const result = resolveEffectivePermissions({ membership: membership(), role: missing });
      assert.ok(none(result));
      assert.equal(result.reason, "role-missing");
    }
  });

  it("Rollen-Dokument einer anderen roleId -> keine Rechte", () => {
    const result = resolveEffectivePermissions({ membership: membership({ roleId: "pruefer" }), role: role("admin") });
    assert.ok(none(result));
    assert.equal(result.reason, "role-missing");
  });

  it("archivierte Rolle -> keine Rechte (auch wenn alle Schlüssel true sind)", () => {
    const archived: Role = { ...role("admin"), id: "archived", status: "Archiviert" };
    const result = resolveEffectivePermissions({ membership: membership({ roleId: "archived" }), role: archived });
    assert.ok(none(result));
    assert.equal(result.reason, "role-inactive");
    assert.equal(result.role?.id, "archived");
  });

  it("fehlender Schlüssel -> false; Rolle ohne permissions gewährt nichts", () => {
    const partial: Role = { ...role("pruefer"), id: "partial", permissions: { "proben.ansehen": true } };
    const result = resolveEffectivePermissions({ membership: membership({ roleId: "partial" }), role: partial });
    assert.equal(hasPermission(result.permissions, "proben.ansehen"), true);
    assert.equal(hasPermission(result.permissions, "proben.loeschen"), false);
    assert.equal(Object.keys(result.permissions).length, 45);

    const noPermissions = { ...role("pruefer"), id: "np", permissions: undefined } as unknown as Role;
    const empty = resolveEffectivePermissions({ membership: membership({ roleId: "np" }), role: noPermissions });
    assert.equal(empty.reason, null);
    assert.equal(count(empty.permissions), 0);
  });

  it("unbekannte Schlüssel werden ignoriert und nie wirksam", () => {
    const withUnknown: Role = { ...role("gast"), id: "u", permissions: { ...role("gast").permissions, "ghost.recht": true } };
    const result = resolveEffectivePermissions({ membership: membership({ roleId: "u" }), role: withUnknown });
    assert.equal("ghost.recht" in result.permissions, false);
    assert.equal(hasPermission(result.permissions, "ghost.recht"), false);
    assert.equal(count(result.permissions), 9);
  });

  it("nur exakt true gewährt (keine Strings oder Zahlen)", () => {
    const sloppy: Role = {
      ...role("gast"),
      id: "s",
      permissions: { "proben.ansehen": "true", "kunden.ansehen": 1, "projekte.ansehen": true } as unknown as Record<string, boolean>,
    };
    const result = resolveEffectivePermissions({ membership: membership({ roleId: "s" }), role: sloppy });
    assert.equal(result.permissions["proben.ansehen"], false);
    assert.equal(result.permissions["kunden.ansehen"], false);
    assert.equal(result.permissions["projekte.ansehen"], true);
  });
});

describe("Quelle der Rolle", () => {
  it("der Snapshot membership.role und der Rollenname sind ohne Bedeutung; nur roleId zählt", () => {
    const result = resolveEffectivePermissions({
      membership: { ...membership({ roleId: "gast" }), role: "Administrator" },
      role: role("gast"),
    });
    assert.equal(count(result.permissions), 9);
    assert.equal(hasPermission(result.permissions, "rollen.admin_verwalten"), false);
  });

  it("ohne roleId hilft auch der Snapshot membership.role nicht", () => {
    const result = resolveEffectivePermissions({
      membership: { ...membership({ roleId: undefined }), role: "Administrator" },
      role: role("admin"),
    });
    assert.equal(count(result.permissions), 0);
  });
});

describe("Helfer", () => {
  it("hasPermission / hasAnyPermission / hasAllPermissions", () => {
    const permissions = resolveEffectivePermissions({ membership: membership(), role: role("pruefer") }).permissions;
    assert.equal(hasPermission(permissions, "proben.ansehen"), true);
    assert.equal(hasPermission(permissions, "proben.loeschen"), false);
    assert.equal(hasPermission(permissions, "gibt.es.nicht"), false);
    assert.equal(hasAnyPermission(permissions, ["proben.loeschen", "proben.ansehen"]), true);
    assert.equal(hasAnyPermission(permissions, ["proben.loeschen", "kunden.loeschen"]), false);
    assert.equal(hasAnyPermission(permissions, []), false);
    assert.equal(hasAllPermissions(permissions, ["proben.ansehen", "proben.erstellen"]), true);
    assert.equal(hasAllPermissions(permissions, ["proben.ansehen", "proben.loeschen"]), false);
  });

  it("emptyPermissions: 45 Schlüssel, alle false; demoPermissions (nur Mock-Modus): alle true", () => {
    assert.equal(Object.keys(emptyPermissions()).length, 45);
    assert.equal(count(emptyPermissions()), 0);
    assert.equal(count(demoPermissions()), 45);
  });
});
