// Autorisierungsregeln der serverseitigen Mitglieder-Aktionen (rein, ohne Firebase).
// Die Integration mit Transaktionen läuft gegen den Emulator
// (tests/firestore/member-actions.test.ts).
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { roles as configRoles } from "../../src/config/roles";
import {
  MEMBER_ACTION_HTTP_STATUS,
  MEMBER_ACTION_MESSAGES,
  MemberActionError,
  assertNotLastAdmin,
  isActiveAdminMembership,
  isMemberActionErrorCode,
  isSafeDocumentId,
  isTargetProtected,
  parseAssignRoleRequest,
  parseSetMemberStatusRequest,
  planAssignRole,
  planSetMemberStatus,
  resolveActor,
  statusHistoryMessage,
  type MemberActionErrorCode,
  type ResolvedTarget,
} from "../../src/lib/security/memberActionRules";
import { buildPermissions } from "../../src/config/roles";
import type { Role } from "../../src/types/role";
import type { UserMembership } from "../../src/types/userMembership";

const role = (id: string) => {
  const found = configRoles.find((candidate) => candidate.id === id);
  assert.ok(found, id);
  return found;
};
const custom = (id: string, grant: string[], extra: Partial<Role> = {}): Role => ({
  id,
  name: id,
  description: "",
  type: "Benutzerdefiniert",
  color: "neutral",
  status: "Aktiv",
  permissions: buildPermissions(grant),
  ...extra,
});
const membership = (uid: string, roleId: string | undefined, extra: Partial<UserMembership> = {}): UserMembership => ({
  uid,
  companyId: "c1",
  employeeId: `emp-${uid}`,
  roleId,
  status: "Aktiv",
  ...extra,
});

function expectCode(fn: () => unknown, code: MemberActionErrorCode) {
  assert.throws(fn, (error: unknown) => {
    assert.ok(error instanceof MemberActionError, String(error));
    assert.equal(error.code, code);
    return true;
  });
}

// Szenario: Actor + Ziel (Prüfer) + Zielrolle, alles in Firma c1.
function assignInput(overrides: {
  actorRole?: string;
  actorMembership?: UserMembership | undefined;
  newRole?: Role | undefined;
  targetRoleId?: string;
  admins?: string[];
  targetMemberships?: UserMembership[];
  employeeId?: string;
}) {
  const actorRoleId = overrides.actorRole ?? "laborleiter";
  const targetRoleId = overrides.targetRoleId ?? "pruefer";
  const target = membership("target", targetRoleId);
  return {
    actor: {
      uid: "actor",
      membership: "actorMembership" in overrides ? overrides.actorMembership : membership("actor", actorRoleId),
      role: role(actorRoleId),
    },
    request: { employeeId: overrides.employeeId ?? "emp-target", roleId: (overrides.newRole ?? role("azubi")).id },
    target: {
      employeeId: overrides.employeeId ?? "emp-target",
      employee: { id: overrides.employeeId ?? "emp-target", status: "Aktiv" as const, roleId: targetRoleId },
      memberships: overrides.targetMemberships ?? [target],
    },
    roles: { membershipRole: role(targetRoleId), employeeRole: role(targetRoleId) },
    newRole: "newRole" in overrides ? overrides.newRole : role("azubi"),
    activeAdminUids: overrides.admins ?? ["a1", "a2"],
  };
}

describe("Fehlercodes", () => {
  it("jeder Code hat eine deutsche Meldung und einen HTTP-Status; keine Firebase-Interna", () => {
    const codes = Object.keys(MEMBER_ACTION_MESSAGES) as MemberActionErrorCode[];
    assert.ok(codes.length >= 16);
    for (const code of codes) {
      assert.ok(isMemberActionErrorCode(code));
      assert.ok(MEMBER_ACTION_MESSAGES[code].length > 10, code);
      assert.ok(Number.isInteger(MEMBER_ACTION_HTTP_STATUS[code]), code);
      assert.doesNotMatch(MEMBER_ACTION_MESSAGES[code], /firebase|firestore|permission-denied|stack|uid/i, code);
    }
    assert.equal(isMemberActionErrorCode("toString"), false);
    assert.equal(isMemberActionErrorCode(undefined), false);
  });
});

describe("Request-Validierung", () => {
  it("isSafeDocumentId: nur einfache IDs, keine Pfade", () => {
    for (const ok of ["emp-1", "abc_DEF-9", "role-geraete-loeschen"]) assert.equal(isSafeDocumentId(ok), true, ok);
    for (const bad of ["", "a/b", "..", ".", "__x__", " x", "x ", "a".repeat(201), 5, null, undefined, {}]) {
      assert.equal(isSafeDocumentId(bad), false, String(bad));
    }
  });

  it("assign-role: nur employeeId und roleId; alles Weitere (companyId, actorRole, isAdmin) wird verworfen", () => {
    const parsed = parseAssignRoleRequest({
      employeeId: "e1",
      roleId: "r1",
      companyId: "other",
      actorRole: "admin",
      isAdmin: true,
      uid: "x",
    });
    assert.deepEqual(parsed, { employeeId: "e1", roleId: "r1" });
    expectCode(() => parseAssignRoleRequest({ employeeId: "e1" }), "invalid-request");
    expectCode(() => parseAssignRoleRequest(null), "invalid-request");
    expectCode(() => parseAssignRoleRequest("x"), "invalid-request");
    expectCode(() => parseAssignRoleRequest({ employeeId: "a/b", roleId: "r" }), "invalid-request");
  });

  it("set-status: nur Aktiv/Gesperrt, reason nur „revoke-access“", () => {
    assert.deepEqual(parseSetMemberStatusRequest({ employeeId: "e", status: "Gesperrt", reason: "revoke-access", x: 1 }), {
      employeeId: "e",
      status: "Gesperrt",
      reason: "revoke-access",
    });
    assert.deepEqual(parseSetMemberStatusRequest({ employeeId: "e", status: "Aktiv" }), { employeeId: "e", status: "Aktiv" });
    expectCode(() => parseSetMemberStatusRequest({ employeeId: "e", status: "Ausstehend" }), "invalid-request");
    expectCode(() => parseSetMemberStatusRequest({ employeeId: "e", status: "Aktiv", reason: "anderes" }), "invalid-request");
    expectCode(() => parseSetMemberStatusRequest({ status: "Aktiv" }), "invalid-request");
  });

  it("Historientexte kommen vom Server", () => {
    assert.equal(statusHistoryMessage("Aktiv"), "Zugriff reaktiviert.");
    assert.equal(statusHistoryMessage("Gesperrt"), "Zugriff temporär gesperrt.");
    assert.equal(statusHistoryMessage("Gesperrt", "revoke-access"), "Zugriff entzogen.");
  });
});

describe("resolveActor (Membership -> Rolle -> Rechte)", () => {
  const base = { uid: "u", membership: membership("u", "laborleiter"), role: role("laborleiter") };

  it("aktive Membership + aktive Rolle → Rechte und Firma aus der Membership", () => {
    const actor = resolveActor(base);
    assert.equal(actor.companyId, "c1");
    assert.equal(actor.employeeId, "emp-u");
    assert.equal(actor.permissions["administration.mitarbeiter_verwalten"], true);
    assert.equal(actor.canManageProtected, false);
    assert.equal(resolveActor({ uid: "a", membership: membership("a", "admin"), role: role("admin") }).canManageProtected, true);
  });

  it("fehlende/gesperrte/ungültige Membership und defekte Rollenkette → passende Codes", () => {
    expectCode(() => resolveActor({ ...base, membership: undefined }), "membership-missing");
    expectCode(() => resolveActor({ ...base, membership: membership("u", "laborleiter", { status: "Gesperrt" }) }), "membership-blocked");
    expectCode(() => resolveActor({ ...base, membership: membership("u", "laborleiter", { companyId: "" }) }), "membership-invalid");
    expectCode(() => resolveActor({ ...base, membership: membership("u", undefined) }), "permission-denied");
    expectCode(() => resolveActor({ ...base, role: undefined }), "permission-denied");
    expectCode(() => resolveActor({ ...base, role: { ...role("laborleiter"), status: "Archiviert" } }), "permission-denied");
    // Rolle gehört nicht zur roleId der Membership
    expectCode(() => resolveActor({ ...base, role: role("admin") }), "permission-denied");
  });
});

describe("planAssignRole", () => {
  it("Laborleiter weist eine normale Rolle zu → Plan mit Namen aus dem Rollen-Dokument", () => {
    const plan = planAssignRole(assignInput({}));
    assert.deepEqual(plan, { companyId: "c1", targetUid: "target", employeeId: "emp-target", roleId: "azubi", roleName: "Azubi" });
  });

  it("Rangfolge der Fehler: Recht → Ziel → Selbst → Rolle → geschützt → letzter Admin", () => {
    // Prüfer darf nicht verwalten – noch bevor irgendetwas anderes geprüft wird.
    expectCode(() => planAssignRole(assignInput({ actorRole: "pruefer", newRole: undefined })), "permission-denied");
    expectCode(() => planAssignRole(assignInput({ targetMemberships: [] })), "membership-not-found");
    expectCode(() => planAssignRole(assignInput({ newRole: undefined })), "target-role-not-found");
    expectCode(() => planAssignRole(assignInput({ newRole: { ...role("azubi"), status: "Archiviert" } })), "target-role-inactive");
  });

  it("Mitarbeiter fehlt / Memberships mehrdeutig / Firma oder employeeId der Membership passt nicht", () => {
    const input = assignInput({});
    expectCode(() => planAssignRole({ ...input, target: { ...input.target, employee: undefined } }), "employee-not-found");
    expectCode(
      () => planAssignRole({ ...input, target: { ...input.target, employee: { id: "anderer", status: "Aktiv", roleId: "pruefer" } } }),
      "employee-not-found"
    );
    expectCode(
      () => planAssignRole({ ...input, target: { ...input.target, memberships: [membership("t1", "pruefer", { employeeId: "emp-target" }), membership("t2", "pruefer", { employeeId: "emp-target" })] } }),
      "membership-employee-mismatch"
    );
    expectCode(
      () => planAssignRole({ ...input, target: { ...input.target, memberships: [membership("target", "pruefer", { employeeId: "emp-anderer" })] } }),
      "membership-employee-mismatch"
    );
    expectCode(
      () => planAssignRole({ ...input, target: { ...input.target, memberships: [membership("target", "pruefer", { employeeId: "emp-target", companyId: "c2" })] } }),
      "membership-employee-mismatch"
    );
    expectCode(
      () => planAssignRole({ ...input, target: { ...input.target, employee: { id: "emp-target", status: "Ausstehend", roleId: "pruefer" } } }),
      "membership-employee-mismatch"
    );
  });

  it("Selbst: erkannt über membership.employeeId UND über die UID – Administrator ebenso", () => {
    expectCode(() => planAssignRole(assignInput({ employeeId: "emp-actor" , targetMemberships: [membership("target", "pruefer", { employeeId: "emp-actor" })] })), "self-change-denied");
    expectCode(() => planAssignRole(assignInput({ actorRole: "admin", employeeId: "emp-actor", targetMemberships: [membership("target", "pruefer", { employeeId: "emp-actor" })] })), "self-change-denied");
    // Ziel-UID == Actor-UID (andere employeeId): ebenfalls verboten.
    expectCode(() => planAssignRole(assignInput({ targetMemberships: [membership("actor", "pruefer", { employeeId: "emp-target" })] })), "self-change-denied");
  });

  it("geschützte Zielrolle (Admin/Restricted/Admin-only-Löschrecht): nur mit rollen.admin_verwalten", () => {
    const protectedRoles = [
      role("admin"),
      custom("billing", ["administration.abrechnung_verwalten"]),
      custom("geraete-loescher", ["geraete.loeschen"]),
      custom("laborbuch-loescher", ["laborbuch.loeschen"]),
      custom("berichte-loescher", ["berichte.loeschen"]),
      custom("branding", ["administration.branding_aendern"]),
      custom("system", ["administration.systemeinstellungen_aendern"]),
      custom("rollen-admin", ["rollen.admin_verwalten"]),
    ];
    for (const newRole of protectedRoles) {
      expectCode(() => planAssignRole(assignInput({ newRole })), "protected-role-denied");
      assert.equal(planAssignRole(assignInput({ actorRole: "admin", newRole })).roleId, newRole.id, newRole.id);
    }
    // normale Löschrechte sind nicht geschützt
    assert.equal(planAssignRole(assignInput({ newRole: custom("proben-loescher", ["proben.loeschen"]) })).roleId, "proben-loescher");
  });

  it("geschützter Ziel-User (wirksame oder Employee-Rolle geschützt oder unauflösbar) → nur mit Adminrecht", () => {
    expectCode(() => planAssignRole(assignInput({ targetRoleId: "admin" })), "protected-role-denied");
    const input = assignInput({});
    expectCode(() => planAssignRole({ ...input, roles: { membershipRole: undefined, employeeRole: undefined } }), "protected-role-denied");
    expectCode(
      () => planAssignRole({ ...input, roles: { membershipRole: role("pruefer"), employeeRole: custom("billing", ["administration.abrechnung_verwalten"]) } }),
      "protected-role-denied"
    );
    // Employee-Rolle unbekannt (undefined) ist unkritisch, solange die Membership-Rolle normal ist.
    assert.ok(planAssignRole({ ...input, roles: { membershipRole: role("pruefer"), employeeRole: undefined } }));
    const adminInput = assignInput({ actorRole: "admin" });
    assert.ok(planAssignRole({ ...adminInput, roles: { membershipRole: undefined, employeeRole: undefined } }));
  });

  it("letzter Administrator: 2 Admins → ALLOW, 1 Admin → DENY; Rolle „admin“ behalten ist erlaubt", () => {
    const adminTarget = { targetRoleId: "admin", actorRole: "admin" as const };
    const targetAdmin = membership("a1", "admin", { employeeId: "emp-target" });
    // Actor ist ein zweiter Administrator (andere UID, andere employeeId)
    assert.ok(planAssignRole(assignInput({ ...adminTarget, targetMemberships: [targetAdmin], admins: ["a1", "a2"] })));
    expectCode(
      () => planAssignRole(assignInput({ ...adminTarget, targetMemberships: [targetAdmin], admins: ["a1"] })),
      "last-admin-denied"
    );
    expectCode(
      () => planAssignRole(assignInput({ ...adminTarget, targetMemberships: [targetAdmin], admins: [] })),
      "last-admin-denied"
    );
    assert.ok(planAssignRole(assignInput({ ...adminTarget, targetMemberships: [targetAdmin], admins: ["a1"], newRole: role("admin") })));
  });
});

describe("planSetMemberStatus", () => {
  const statusInput = (overrides: Partial<{ actorRole: string; status: "Aktiv" | "Gesperrt"; targetRoleId: string; admins: string[]; employeeId: string; target: UserMembership }>) => {
    const targetRoleId = overrides.targetRoleId ?? "pruefer";
    const employeeId = overrides.employeeId ?? "emp-target";
    const actorRoleId = overrides.actorRole ?? "laborleiter";
    return {
      actor: { uid: "actor", membership: membership("actor", actorRoleId), role: role(actorRoleId) },
      request: { employeeId, status: overrides.status ?? "Gesperrt" },
      target: {
        employeeId,
        employee: { id: employeeId, status: "Aktiv" as const, roleId: targetRoleId },
        memberships: [overrides.target ?? membership("target", targetRoleId, { employeeId })],
      },
      roles: { membershipRole: role(targetRoleId), employeeRole: role(targetRoleId) },
      activeAdminUids: overrides.admins ?? ["a1", "a2"],
    };
  };

  it("Laborleiter sperrt/reaktiviert einen normalen Mitarbeiter → ALLOW", () => {
    assert.equal(planSetMemberStatus(statusInput({ status: "Gesperrt" })).status, "Gesperrt");
    assert.equal(planSetMemberStatus(statusInput({ status: "Aktiv", target: membership("target", "pruefer", { employeeId: "emp-target", status: "Gesperrt" }) })).status, "Aktiv");
  });

  it("eigener Status → DENY; Prüfer ohne Recht → DENY; geschützter Ziel-User ohne Adminrecht → DENY", () => {
    expectCode(() => planSetMemberStatus(statusInput({ employeeId: "emp-actor", target: membership("target", "pruefer", { employeeId: "emp-actor" }) })), "self-change-denied");
    expectCode(() => planSetMemberStatus(statusInput({ actorRole: "pruefer" })), "permission-denied");
    expectCode(() => planSetMemberStatus(statusInput({ targetRoleId: "admin" })), "protected-role-denied");
    assert.equal(planSetMemberStatus(statusInput({ targetRoleId: "admin", actorRole: "admin" })).status, "Gesperrt");
  });

  it("letzter Administrator: Sperren DENY, Reaktivieren nie blockiert", () => {
    const lastAdmin = { targetRoleId: "admin", actorRole: "admin", admins: ["target"] };
    expectCode(() => planSetMemberStatus(statusInput({ ...lastAdmin })), "last-admin-denied");
    assert.ok(planSetMemberStatus(statusInput({ ...lastAdmin, admins: ["target", "zweiter"] })));
    assert.ok(planSetMemberStatus(statusInput({ ...lastAdmin, status: "Aktiv" })));
  });
});

describe("Hilfsfunktionen", () => {
  it("isActiveAdminMembership: nur Aktiv + roleId admin (Custom Roles zählen nicht)", () => {
    assert.equal(isActiveAdminMembership({ status: "Aktiv", roleId: "admin" }), true);
    assert.equal(isActiveAdminMembership({ status: "Gesperrt", roleId: "admin" }), false);
    assert.equal(isActiveAdminMembership({ status: "Aktiv", roleId: "laborleiter" }), false);
    assert.equal(isActiveAdminMembership({ status: "Aktiv", roleId: "rollen-admin-custom" }), false);
    assert.equal(isActiveAdminMembership(undefined), false);
  });

  it("assertNotLastAdmin: kein Admin-Ziel → nie ein Problem; Admin-Ziel braucht einen weiteren aktiven Admin", () => {
    const normal: ResolvedTarget = { uid: "n", membership: membership("n", "pruefer") };
    const admin: ResolvedTarget = { uid: "a", membership: membership("a", "admin") };
    assert.doesNotThrow(() => assertNotLastAdmin(normal, []));
    expectCode(() => assertNotLastAdmin(admin, ["a"]), "last-admin-denied");
    assert.doesNotThrow(() => assertNotLastAdmin(admin, ["a", "b"]));
  });

  it("isTargetProtected: fail-closed bei fehlender roleId oder nicht auflösbarer Rolle", () => {
    const target = (roleId: string | undefined): ResolvedTarget => ({ uid: "t", membership: membership("t", roleId) });
    assert.equal(isTargetProtected(target(undefined), { membershipRole: role("pruefer"), employeeRole: undefined }), true);
    assert.equal(isTargetProtected(target("pruefer"), { membershipRole: undefined, employeeRole: undefined }), true);
    assert.equal(isTargetProtected(target("pruefer"), { membershipRole: role("azubi"), employeeRole: undefined }), true); // andere roleId
    assert.equal(isTargetProtected(target("pruefer"), { membershipRole: role("pruefer"), employeeRole: undefined }), false);
    assert.equal(isTargetProtected(target("admin"), { membershipRole: role("admin"), employeeRole: undefined }), true);
  });
});
