// UI-Gating-Regeln (Komfort/UX, keine Sicherheit): Company-Tabs, Sichtbarkeit
// von Aktionen, geschützte Rechte im Rollen-Editor, Mitarbeiter-Aktionen. Reine
// Unit-Tests gegen die echte Rollenmatrix.
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PROTECTED_ROLE_PERMISSION_KEYS, allPermissionKeys, buildPermissions, roles as configRoles } from "../../src/config/roles";
import {
  filterAssignableRoles,
  getCompanyAccess,
  getEmployeeActionPolicy,
  getVisibleCompanyTabs,
  hasProtectedPermission,
  isProtectedRole,
  pickActiveTab,
  stripProtectedPermissions,
} from "../../src/lib/permissions/gatingRules";
import { emptyPermissions } from "../../src/lib/permissions/permissionRules";

const permissionsOf = (id: string) => {
  const found = configRoles.find((role) => role.id === id);
  assert.ok(found, id);
  return found.permissions;
};
const grant = (...keys: string[]) => buildPermissions(keys);

describe("Company-Zugriff und Tabs je Systemrolle", () => {
  it("Administrator: alles, alle Tabs", () => {
    const access = getCompanyAccess(permissionsOf("admin"));
    assert.deepEqual(getVisibleCompanyTabs(access), ["uebersicht", "standorte", "mitarbeiter", "einladungen", "rollen", "einstellungen"]);
    assert.ok(access.employees.manage && access.employees.changeRole);
    assert.ok(access.invitations.invite);
    assert.ok(access.locations.manage);
    assert.ok(access.roles.manage && access.roles.manageProtected);
  });

  it("Laborleiter: Verwaltungsbereiche ja, Einstellungen und geschützte Rechte nein", () => {
    const access = getCompanyAccess(permissionsOf("laborleiter"));
    assert.deepEqual(getVisibleCompanyTabs(access), ["uebersicht", "standorte", "mitarbeiter", "einladungen", "rollen"]);
    assert.ok(access.employees.manage && access.employees.changeRole);
    assert.ok(access.invitations.invite);
    assert.ok(access.locations.manage);
    assert.ok(access.roles.manage);
    assert.equal(access.roles.manageProtected, false);
    assert.equal(access.tabs.einstellungen, false);
  });

  it("Prüfer und Azubi: nur Übersicht und Standorte, Standorte nur lesend", () => {
    for (const id of ["pruefer", "azubi"]) {
      const access = getCompanyAccess(permissionsOf(id));
      assert.deepEqual(getVisibleCompanyTabs(access), ["uebersicht", "standorte"], id);
      assert.ok(access.locations.view, id);
      assert.equal(access.locations.manage, false, id);
      assert.equal(access.employees.view, false, id);
      assert.equal(access.invitations.view, false, id);
      assert.equal(access.roles.view, false, id);
    }
  });

  it("Gast: kein Company-Tab erlaubt", () => {
    const access = getCompanyAccess(permissionsOf("gast"));
    assert.deepEqual(getVisibleCompanyTabs(access), []);
    assert.equal(pickActiveTab("uebersicht", getVisibleCompanyTabs(access)), null);
  });

  it("keine Rechte (fehlende Rolle): kein Tab, keine Aktion", () => {
    const access = getCompanyAccess(emptyPermissions());
    assert.deepEqual(getVisibleCompanyTabs(access), []);
    assert.equal(access.employees.manage || access.invitations.manage || access.locations.manage || access.roles.manage, false);
  });
});

describe("Lesen und Verwalten sind getrennt (read-only, Abhängigkeiten)", () => {
  it("mitarbeiter.ansehen -> Mitarbeiter-Tab sichtbar, ohne Verwalten read-only", () => {
    const access = getCompanyAccess(grant("mitarbeiter.ansehen"));
    assert.ok(access.tabs.mitarbeiter);
    assert.equal(access.employees.manage, false);
  });

  it("administration.mitarbeiter_verwalten -> Einladungs-Tab und Einladungs-Aktionen", () => {
    const access = getCompanyAccess(grant("administration.mitarbeiter_verwalten"));
    assert.ok(access.tabs.einladungen);
    assert.ok(access.invitations.manage);
    // Ohne mitarbeiter.ansehen gibt es keinen Mitarbeiter-Tab und keine Mitarbeiter-Aktionen.
    assert.equal(access.tabs.mitarbeiter, false);
    assert.equal(access.employees.manage, false);
  });

  it("Einladen verlangt zusätzlich Leserechte für Mitarbeiter, Rollen und Standorte", () => {
    const onlyManage = getCompanyAccess(grant("administration.mitarbeiter_verwalten"));
    assert.equal(onlyManage.invitations.invite, false);
    assert.deepEqual(onlyManage.invitations.inviteMissing, ["Mitarbeiter", "Rollen", "Standorte"]);

    const partial = getCompanyAccess(grant("administration.mitarbeiter_verwalten", "mitarbeiter.ansehen", "rollen.ansehen"));
    assert.equal(partial.invitations.invite, false);
    assert.deepEqual(partial.invitations.inviteMissing, ["Standorte"]);

    const all = getCompanyAccess(grant("administration.mitarbeiter_verwalten", "mitarbeiter.ansehen", "rollen.ansehen", "standorte.ansehen"));
    assert.equal(all.invitations.invite, true);
    assert.deepEqual(all.invitations.inviteMissing, []);

    // Ohne Verwaltungsrecht wird nichts als „fehlend“ gemeldet.
    assert.deepEqual(getCompanyAccess(grant("mitarbeiter.ansehen")).invitations.inviteMissing, []);
  });

  it("standorte.ansehen ohne verwalten -> read-only; verwalten ohne ansehen -> keine Aktionen (kaputter Zustand vermieden)", () => {
    const readOnly = getCompanyAccess(grant("standorte.ansehen"));
    assert.ok(readOnly.locations.view);
    assert.equal(readOnly.locations.manage, false);

    const manageWithoutView = getCompanyAccess(grant("administration.standorte_verwalten"));
    assert.equal(manageWithoutView.locations.view, false);
    assert.equal(manageWithoutView.locations.manage, false);
    assert.equal(manageWithoutView.tabs.standorte, false);
  });

  it("Rollen lesen ohne verwalten -> read-only; verwalten ohne lesen -> keine Aktionen", () => {
    const readOnly = getCompanyAccess(grant("rollen.ansehen"));
    assert.ok(readOnly.tabs.rollen);
    assert.equal(readOnly.roles.manage, false);
    const manageWithoutView = getCompanyAccess(grant("administration.rollen_verwalten"));
    assert.equal(manageWithoutView.roles.manage, false);
    assert.equal(manageWithoutView.tabs.rollen, false);
  });

  it("Rolle ändern verlangt Verwalten UND Rollen lesen", () => {
    assert.equal(getCompanyAccess(grant("mitarbeiter.ansehen", "administration.mitarbeiter_verwalten")).employees.changeRole, false);
    assert.equal(
      getCompanyAccess(grant("mitarbeiter.ansehen", "administration.mitarbeiter_verwalten", "rollen.ansehen")).employees.changeRole,
      true
    );
  });
});

describe("Tab-Fallback", () => {
  it("nicht erlaubter Tab fällt auf den ersten sichtbaren Tab zurück; erlaubter bleibt", () => {
    const visible = getVisibleCompanyTabs(getCompanyAccess(permissionsOf("pruefer")));
    assert.equal(pickActiveTab("rollen", visible), "uebersicht");
    assert.equal(pickActiveTab("banana", visible), "uebersicht");
    assert.equal(pickActiveTab("standorte", visible), "standorte");
  });
});

describe("Geschützte Rechte im Rollen-Editor", () => {
  it("die geschützte Menge kommt aus der Config (7 Schlüssel)", () => {
    assert.equal(PROTECTED_ROLE_PERMISSION_KEYS.length, 7);
  });

  it("Laborleiter darf geschützte Rechte nicht ändern, Administrator schon", () => {
    assert.equal(getCompanyAccess(permissionsOf("laborleiter")).roles.manageProtected, false);
    assert.equal(getCompanyAccess(permissionsOf("admin")).roles.manageProtected, true);
  });

  it("isProtectedRole: Administrator-Rolle und Rollen mit geschütztem Schlüssel (auch Admin-only-Löschrecht)", () => {
    assert.equal(isProtectedRole({ id: "admin", permissions: emptyPermissions() }), true);
    assert.equal(isProtectedRole({ id: "x", permissions: grant("geraete.loeschen") }), true);
    assert.equal(isProtectedRole({ id: "x", permissions: grant("rollen.admin_verwalten") }), true);
    assert.equal(isProtectedRole({ id: "x", permissions: grant("proben.loeschen", "kunden.loeschen") }), false);
    assert.equal(isProtectedRole({ id: "laborleiter", permissions: permissionsOf("laborleiter") }), false);
    assert.equal(hasProtectedPermission(undefined), false);
  });

  it("filterAssignableRoles: ohne rollen.admin_verwalten keine geschützten Rollen, mit alle", () => {
    const roles = configRoles.map((role) => ({ id: role.id, permissions: role.permissions }));
    const withoutAdminKey = filterAssignableRoles(roles, false).map((role) => role.id);
    assert.ok(!withoutAdminKey.includes("admin"));
    assert.ok(withoutAdminKey.includes("laborleiter") && withoutAdminKey.includes("pruefer"));
    assert.equal(filterAssignableRoles(roles, true).length, roles.length);
    const normalDeleteRole = { id: "d", permissions: grant("proben.loeschen") };
    assert.equal(filterAssignableRoles([normalDeleteRole], false).length, 1);
  });

  it("stripProtectedPermissions setzt nur die 7 geschützten Schlüssel auf false", () => {
    const stripped = stripProtectedPermissions(permissionsOf("admin"));
    for (const key of PROTECTED_ROLE_PERMISSION_KEYS) assert.equal(stripped[key], false, key);
    for (const key of allPermissionKeys.filter((candidate) => !PROTECTED_ROLE_PERMISSION_KEYS.includes(candidate))) {
      assert.equal(stripped[key], true, key);
    }
    // Eingabe wird nicht verändert.
    assert.equal(permissionsOf("admin")["rollen.admin_verwalten"], true);
  });
});

describe("Mitarbeiter-Aktionen", () => {
  const roles = configRoles.map((role) => ({ id: role.id, permissions: role.permissions }));
  const policy = (user: string, employee: { id: string; roleId?: string }, extra: { ownEmployeeId?: string | null; rolesAvailable?: boolean } = {}) =>
    getEmployeeActionPolicy({
      access: getCompanyAccess(permissionsOf(user)),
      employee,
      ownEmployeeId: extra.ownEmployeeId ?? null,
      roles,
      rolesAvailable: extra.rolesAvailable ?? true,
    });

  it("Laborleiter verwaltet einen normalen Mitarbeiter vollständig", () => {
    const result = policy("laborleiter", { id: "e1", roleId: "pruefer" });
    assert.ok(result.canChangeRole && result.canChangeLocation && result.canChangeStatus && result.any);
  });

  it("eigener Mitarbeiter: Rolle und Status nie änderbar, Standort schon", () => {
    for (const user of ["laborleiter", "admin"]) {
      const result = policy(user, { id: "me", roleId: user === "admin" ? "admin" : "laborleiter" }, { ownEmployeeId: "me" });
      assert.equal(result.canChangeRole, false, user);
      assert.equal(result.canChangeStatus, false, user);
      assert.equal(result.canChangeLocation, true, user);
    }
  });

  it("Laborleiter: keine Aktionen für Administratoren, Mitarbeiter mit geschützter oder unbekannter/fehlender Rolle", () => {
    const protectedRole = { id: "billing", permissions: grant("administration.abrechnung_verwalten") };
    const deleteRole = { id: "deleter", permissions: grant("berichte.loeschen") };
    const all = [...roles, protectedRole, deleteRole];
    const run = (employee: { id: string; roleId?: string }) =>
      getEmployeeActionPolicy({
        access: getCompanyAccess(permissionsOf("laborleiter")),
        employee,
        ownEmployeeId: null,
        roles: all,
        rolesAvailable: true,
      });
    for (const employee of [
      { id: "a", roleId: "admin" },
      { id: "b", roleId: "billing" },
      { id: "c", roleId: "deleter" },
      { id: "d", roleId: "ghost" },
      { id: "e", roleId: undefined },
    ]) {
      const result = run(employee);
      assert.equal(result.any, false, employee.id);
    }
  });

  it("Administrator darf auch Administratoren und geschützte Rollen verwalten", () => {
    const result = policy("admin", { id: "other-admin", roleId: "admin" }, { ownEmployeeId: "me" });
    assert.ok(result.canChangeRole && result.canChangeStatus && result.canChangeLocation);
  });

  it("ohne geladene Rollen und ohne rollen.admin_verwalten: Zielrolle nicht auflösbar -> fail-closed, keine Verwaltungsaktion", () => {
    const access = getCompanyAccess(
      grant("mitarbeiter.ansehen", "administration.mitarbeiter_verwalten", "standorte.ansehen")
    );
    for (const roleId of ["admin", "pruefer", undefined]) {
      const result = getEmployeeActionPolicy({
        access,
        employee: { id: "x", roleId },
        ownEmployeeId: null,
        roles: [],
        rolesAvailable: false,
      });
      assert.equal(result.canChangeRole, false, String(roleId));
      assert.equal(result.canChangeStatus, false, String(roleId));
      assert.equal(result.canChangeLocation, false, String(roleId));
      assert.equal(result.canResetPassword, false, String(roleId));
      assert.equal(result.canRevokeInvitation, false, String(roleId));
      assert.equal(result.any, false, String(roleId));
    }
  });

  it("mit rollen.admin_verwalten darf ein fremder Mitarbeiter trotz fehlender Rollenliste verwaltet werden", () => {
    const access = getCompanyAccess(
      grant(
        "mitarbeiter.ansehen",
        "administration.mitarbeiter_verwalten",
        "standorte.ansehen",
        "rollen.admin_verwalten"
      )
    );
    const result = getEmployeeActionPolicy({
      access,
      employee: { id: "x", roleId: "admin" },
      ownEmployeeId: null,
      roles: [],
      rolesAvailable: false,
    });
    assert.equal(result.canChangeStatus, true);
    assert.equal(result.canChangeLocation, true);
    assert.equal(result.canResetPassword, true);
    assert.equal(result.canRevokeInvitation, true);
    assert.equal(result.canChangeRole, false); // Rolle ändern verlangt zusätzlich rollen.ansehen
  });

  it("nur Lesen (mitarbeiter.ansehen ohne verwalten): keine Aktion außer Details", () => {
    const result = getEmployeeActionPolicy({
      access: getCompanyAccess(grant("mitarbeiter.ansehen")),
      employee: { id: "x", roleId: "pruefer" },
      ownEmployeeId: null,
      roles,
      rolesAvailable: true,
    });
    assert.equal(result.any, false);
  });

  it("Standort ändern verlangt zusätzlich standorte.ansehen (der Dialog braucht die Standortliste)", () => {
    const input = { employee: { id: "x", roleId: "pruefer" }, ownEmployeeId: null, roles, rolesAvailable: true };
    const without = getEmployeeActionPolicy({
      ...input,
      access: getCompanyAccess(grant("mitarbeiter.ansehen", "administration.mitarbeiter_verwalten")),
    });
    assert.equal(without.canChangeLocation, false);
    const withView = getEmployeeActionPolicy({
      ...input,
      access: getCompanyAccess(grant("mitarbeiter.ansehen", "administration.mitarbeiter_verwalten", "standorte.ansehen")),
    });
    assert.equal(withView.canChangeLocation, true);
  });
});
