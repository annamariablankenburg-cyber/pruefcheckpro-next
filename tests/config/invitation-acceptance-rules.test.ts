// Einladung annehmen: reine Regeln (ohne Firebase). Die Integration (Transaktion, Rollback,
// Parallelität, HTTP) läuft gegen den Emulator (tests/firestore/invitation-acceptance.test.ts).
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { roles as configRoles } from "../../src/config/roles";
import { safeNextPath, withNext } from "../../src/lib/auth/postLoginTarget";
import { normalizeEmail } from "../../src/lib/invitations/invitationRules";
import {
  INVITATION_ACTION_HTTP_STATUS,
  INVITATION_ACTION_MESSAGES,
  InvitationActionError,
  employeeIdForInvitation,
  invitationMatchesIdentity,
  isInvitationActionErrorCode,
  parseAcceptInvitationRequest,
  planAcceptInvitation,
  requireVerifiedUser,
  type AcceptInvitationPlanInput,
  type InvitationActionErrorCode,
  type StoredInvitation,
} from "../../src/lib/security/invitationAcceptanceRules";
import { auditMemberLinks } from "../../src/lib/security/memberLinkAudit";
import type { NewInvitationInput } from "../../src/lib/interfaces/IInvitationService";
import type { Role } from "../../src/types/role";
import type { UserMembership } from "../../src/types/userMembership";

const NOW = new Date("2026-03-01T10:00:00.000Z");
const FUTURE = "2026-03-08T10:00:00.000Z";
const PAST = "2026-02-01T10:00:00.000Z";

const role = (id: string, extra: Partial<Role> = {}): Role & { id: string } => ({
  ...(configRoles.find((candidate) => candidate.id === id) as Role),
  id,
  ...extra,
});

const invitation = (extra: StoredInvitation = {}): StoredInvitation => ({
  name: "Neue Person",
  email: "neu@example.de",
  role: "Prüfer",
  roleId: "pruefer",
  location: "Labor Stuttgart",
  locationId: "loc-1",
  status: "Ausstehend",
  expiresAt: FUTURE,
  ...extra,
});

function input(overrides: Partial<AcceptInvitationPlanInput> = {}): AcceptInvitationPlanInput {
  return {
    principal: { uid: "u-new", email: "neu@example.de", emailVerified: true },
    request: { companyId: "c1", invitationId: "inv-1" },
    now: NOW,
    invitation: invitation(),
    role: role("pruefer"),
    membership: undefined,
    employee: undefined,
    sameEmailEmployeeIds: [],
    ...overrides,
  };
}

function expectCode(fn: () => unknown, code: InvitationActionErrorCode) {
  assert.throws(fn, (error: unknown) => {
    assert.ok(error instanceof InvitationActionError, String(error));
    assert.equal(error.code, code);
    return true;
  });
}

const membership = (extra: Partial<UserMembership> = {}): UserMembership => ({
  uid: "u-new",
  companyId: "c1",
  employeeId: "emp-inv-1",
  roleId: "pruefer",
  role: "Prüfer",
  status: "Aktiv",
  ...extra,
});

describe("Fehlercodes", () => {
  it("jeder Code hat eine deutsche Meldung ohne Interna und einen HTTP-Status", () => {
    const codes = Object.keys(INVITATION_ACTION_MESSAGES) as InvitationActionErrorCode[];
    assert.ok(codes.length >= 15);
    for (const code of codes) {
      assert.ok(isInvitationActionErrorCode(code));
      assert.ok(INVITATION_ACTION_MESSAGES[code].length > 10, code);
      assert.ok(Number.isInteger(INVITATION_ACTION_HTTP_STATUS[code]), code);
      assert.doesNotMatch(INVITATION_ACTION_MESSAGES[code], /firebase|firestore|permission-denied|stack|uid|token\b/i, code);
    }
    assert.equal(isInvitationActionErrorCode("toString"), false);
  });
});

describe("Request-Parser", () => {
  it("nur companyId und invitationId; alles andere wird verworfen", () => {
    const parsed = parseAcceptInvitationRequest({
      companyId: "c1",
      invitationId: "inv-1",
      uid: "x",
      email: "x@example.de",
      employeeId: "emp-x",
      roleId: "admin",
      role: "Administrator",
      status: "Aktiv",
      isAdmin: true,
      permissions: { "rollen.admin_verwalten": true },
      actorRole: "admin",
    });
    assert.deepEqual(parsed, { companyId: "c1", invitationId: "inv-1" });
  });

  it("fehlende, unsichere oder falsch typisierte IDs → invalid-request", () => {
    for (const body of [
      null,
      "x",
      {},
      { companyId: "c1" },
      { invitationId: "i" },
      { companyId: "a/b", invitationId: "i" },
      { companyId: "c1", invitationId: ".." },
      { companyId: "c1", invitationId: "__x__" },
      { companyId: 1, invitationId: "i" },
      { companyId: "c1", invitationId: "a".repeat(201) },
    ]) {
      expectCode(() => parseAcceptInvitationRequest(body), "invalid-request");
    }
  });
});

describe("Identität: verifizierte E-Mail", () => {
  it("nur mit emailVerified === true und vorhandener E-Mail; E-Mail wird normalisiert", () => {
    assert.deepEqual(requireVerifiedUser({ uid: "u", email: "  Neu@Example.DE ", emailVerified: true }), {
      uid: "u",
      email: "neu@example.de",
    });
    expectCode(() => requireVerifiedUser({ uid: "u", email: "neu@example.de", emailVerified: false }), "email-not-verified");
    expectCode(() => requireVerifiedUser({ uid: "u", emailVerified: true }), "email-not-verified");
    expectCode(() => requireVerifiedUser({ uid: "u", email: "  ", emailVerified: true }), "email-not-verified");
    expectCode(() => requireVerifiedUser({ uid: "", email: "a@b.de", emailVerified: true }), "unauthenticated");
    // nur exakt true zählt
    expectCode(
      () => requireVerifiedUser({ uid: "u", email: "a@b.de", emailVerified: "true" as unknown as boolean }),
      "email-not-verified"
    );
  });

  it("Einladungs-E-Mail und Konto-E-Mail werden über dieselbe Normalisierung verglichen", () => {
    assert.equal(invitationMatchesIdentity("Neu@Example.de", "neu@example.de"), true);
    assert.equal(invitationMatchesIdentity(" neu@example.de ", "NEU@EXAMPLE.DE"), true);
    assert.equal(invitationMatchesIdentity("neu@example.de", "anders@example.de"), false);
    assert.equal(invitationMatchesIdentity("neu@example.de", "neu@example.de.evil.de"), false);
    assert.equal(invitationMatchesIdentity(undefined, "neu@example.de"), false);
    assert.equal(invitationMatchesIdentity("", ""), false);
    assert.equal(invitationMatchesIdentity(42, "42"), false);
    assert.equal(normalizeEmail("  A@B.de "), "a@b.de");
  });
});

describe("planAcceptInvitation: Annahme", () => {
  it("gültige Einladung → Provisioning-Plan aus Einladung, Rolle und Token (nicht aus dem Request)", () => {
    const plan = planAcceptInvitation(input({ invitation: invitation({ role: "Falscher Snapshot" }) }));
    assert.equal(plan.kind, "provision");
    if (plan.kind !== "provision") return;
    assert.deepEqual(
      { ...plan },
      {
        kind: "provision",
        companyId: "c1",
        invitationId: "inv-1",
        uid: "u-new",
        email: "neu@example.de",
        employeeId: "emp-inv-1",
        roleId: "pruefer",
        roleName: "Prüfer", // aus dem Rollen-Dokument, nicht aus dem Snapshot der Einladung
        name: "Neue Person",
        initials: "NP",
        location: "Labor Stuttgart",
        locationId: "loc-1",
      }
    );
    assert.equal(employeeIdForInvitation("inv-1"), "emp-inv-1");
  });

  it("geschützte Rollen (Administrator, Restricted) sind annehmbar – der Invitee braucht kein rollen.admin_verwalten", () => {
    for (const id of ["admin", "laborleiter"]) {
      const plan = planAcceptInvitation(input({ invitation: invitation({ roleId: id }), role: role(id) }));
      assert.equal(plan.kind === "provision" && plan.roleId, id);
    }
  });

  it("Reihenfolge: fremdes Konto erfährt nichts über den Status (nicht gefunden statt widerrufen/abgelaufen)", () => {
    const stranger = { uid: "u-x", email: "fremd@example.de", emailVerified: true };
    for (const status of ["Widerrufen", "Angenommen", "Ausstehend"]) {
      expectCode(() => planAcceptInvitation(input({ principal: stranger, invitation: invitation({ status }) })), "invitation-not-found");
    }
    expectCode(() => planAcceptInvitation(input({ principal: stranger, invitation: invitation({ expiresAt: PAST }) })), "invitation-not-found");
  });

  it("nicht verifiziert → email-not-verified (vor allem anderen)", () => {
    expectCode(
      () => planAcceptInvitation(input({ principal: { uid: "u", email: "neu@example.de", emailVerified: false }, invitation: undefined })),
      "email-not-verified"
    );
  });

  it("Einladung fehlt → invitation-not-found", () => {
    expectCode(() => planAcceptInvitation(input({ invitation: undefined })), "invitation-not-found");
  });

  it("widerrufen → invitation-revoked (auch wenn E-Mail, Rolle und alles andere passt)", () => {
    expectCode(() => planAcceptInvitation(input({ invitation: invitation({ status: "Widerrufen" }) })), "invitation-revoked");
  });

  it("Ablauf: abgelaufen → invitation-expired; knapp gültig ok; ungültiges oder fehlendes expiresAt → invitation-invalid", () => {
    expectCode(() => planAcceptInvitation(input({ invitation: invitation({ expiresAt: PAST }) })), "invitation-expired");
    assert.equal(planAcceptInvitation(input({ invitation: invitation({ expiresAt: NOW.toISOString() }) })).kind, "provision");
    expectCode(() => planAcceptInvitation(input({ invitation: invitation({ expiresAt: "kein datum" }) })), "invitation-invalid");
    expectCode(() => planAcceptInvitation(input({ invitation: invitation({ expiresAt: undefined }) })), "invitation-invalid");
  });

  it("unbekannter Status → invitation-invalid", () => {
    expectCode(() => planAcceptInvitation(input({ invitation: invitation({ status: "Abgelaufen" }) })), "invitation-invalid");
    expectCode(() => planAcceptInvitation(input({ invitation: invitation({ status: undefined }) })), "invitation-invalid");
  });

  it("roleId fehlt, leer, kein String oder unsicher → invitation-invalid (kein Fallback auf den Rollennamen)", () => {
    for (const roleId of [undefined, "", 5, "a/b"]) {
      expectCode(() => planAcceptInvitation(input({ invitation: invitation({ roleId }) })), "invitation-invalid");
    }
    expectCode(() => planAcceptInvitation(input({ invitation: invitation({ name: "" }) })), "invitation-invalid");
  });

  it("Rolle fehlt → role-not-found; archiviert → role-inactive; Rollen-Dokument einer anderen ID → role-not-found", () => {
    expectCode(() => planAcceptInvitation(input({ role: undefined })), "role-not-found");
    expectCode(() => planAcceptInvitation(input({ role: role("pruefer", { status: "Archiviert" }) })), "role-inactive");
    expectCode(() => planAcceptInvitation(input({ role: role("azubi") })), "role-not-found");
  });
});

describe("planAcceptInvitation: bestehende Membership und Mitarbeiter", () => {
  it("keine Membership überschreiben: andere Firma → already-member, dieselbe Firma → membership-conflict", () => {
    expectCode(() => planAcceptInvitation(input({ membership: membership({ companyId: "c2" }) })), "already-member");
    expectCode(() => planAcceptInvitation(input({ membership: membership() })), "membership-conflict");
    expectCode(() => planAcceptInvitation(input({ membership: membership({ status: "Gesperrt" }) })), "membership-conflict");
    expectCode(() => planAcceptInvitation(input({ membership: membership({ employeeId: "emp-andere" }) })), "membership-conflict");
  });

  it("bestehender Mitarbeiter (geplante ID oder gleiche E-Mail, auch gesperrt) → employee-invalid", () => {
    expectCode(() => planAcceptInvitation(input({ employee: { id: "emp-inv-1", status: "Gesperrt" } })), "employee-invalid");
    expectCode(() => planAcceptInvitation(input({ sameEmailEmployeeIds: ["emp-alt"] })), "employee-invalid");
  });
});

describe("planAcceptInvitation: Idempotenz", () => {
  const accepted = (extra: StoredInvitation = {}) =>
    invitation({ status: "Angenommen", acceptedByUid: "u-new", employeeId: "emp-inv-1", ...extra });
  const consistent = (overrides: Partial<AcceptInvitationPlanInput> = {}) =>
    input({
      invitation: accepted(),
      membership: membership(),
      employee: { id: "emp-inv-1", status: "Aktiv", roleId: "pruefer" },
      ...overrides,
    });

  it("dieselbe UID, alles konsistent und aktiv → idempotenter Erfolg ohne Schreibplan", () => {
    assert.deepEqual(planAcceptInvitation(consistent()), { kind: "already-accepted", companyId: "c1", employeeId: "emp-inv-1" });
  });

  it("anderes Konto hat angenommen → invitation-already-accepted", () => {
    expectCode(() => planAcceptInvitation(consistent({ invitation: accepted({ acceptedByUid: "u-anderer" }) })), "invitation-already-accepted");
  });

  it("angenommen, aber keine Membership → invitation-already-accepted (nie neu provisionieren)", () => {
    expectCode(() => planAcceptInvitation(consistent({ membership: undefined })), "invitation-already-accepted");
  });

  it("Membership einer anderen Firma → already-member", () => {
    expectCode(() => planAcceptInvitation(consistent({ membership: membership({ companyId: "c2" }) })), "already-member");
  });

  it("jede Abweichung (Mitarbeiter, Rolle, Status, fehlender/gesperrter Mitarbeiter) → membership-conflict", () => {
    const cases: Array<Partial<AcceptInvitationPlanInput>> = [
      { membership: membership({ employeeId: "emp-x" }) },
      { membership: membership({ roleId: "azubi" }) },
      { membership: membership({ status: "Gesperrt" }) },
      { employee: undefined },
      { employee: { id: "emp-inv-1", status: "Gesperrt", roleId: "pruefer" } },
      { employee: { id: "emp-inv-1", status: "Aktiv", roleId: "azubi" } },
      { invitation: accepted({ employeeId: undefined }) },
    ];
    for (const overrides of cases) {
      expectCode(() => planAcceptInvitation(consistent(overrides)), "membership-conflict");
    }
  });
});

describe("Employee ↔ Membership nach der Annahme (Audit)", () => {
  it("der von der Annahme erzeugte Zustand ist für auditMemberLinks sauber", () => {
    const findings = auditMemberLinks({
      employees: [{ id: "emp-inv-1", roleId: "pruefer", status: "Aktiv" }],
      memberships: [{ uid: "u-new", employeeId: "emp-inv-1", roleId: "pruefer", status: "Aktiv" }],
    });
    assert.deepEqual(findings, []);
  });
});

describe("Ziel nach Login/Registrierung (next)", () => {
  it("nur der Einladungspfad ist erlaubt, alles andere → Dashboard (kein Open Redirect)", () => {
    assert.equal(safeNextPath("/einladung?c=c1&i=inv-1"), "/einladung?c=c1&i=inv-1");
    assert.equal(safeNextPath("/einladung"), "/einladung");
    for (const bad of [
      null,
      undefined,
      "",
      "https://evil.example/einladung",
      "//evil.example",
      "/dashboard",
      "/company",
      "/einladung/../company",
      "/einladungX",
      "/einladung?x=<script>",
      "/einladung?c=a b",
      "javascript:alert(1)",
    ]) {
      assert.equal(safeNextPath(bad as string | null | undefined), "/dashboard", String(bad));
    }
  });

  it("withNext hängt nur geprüfte Ziele an", () => {
    assert.equal(withNext("/login", "/einladung?c=c1&i=i1"), "/login?next=%2Feinladung%3Fc%3Dc1%26i%3Di1");
    assert.equal(withNext("/login", "https://evil.example"), "/login");
    assert.equal(withNext("/registrieren", null), "/registrieren");
  });
});

describe("Server-only-Felder der Einladung", () => {
  it("NewInvitationInput schließt acceptedAt/acceptedByUid/employeeId/revokedAt/status zur Compile-Zeit aus", () => {
    const base: NewInvitationInput = {
      name: "A",
      email: "a@example.de",
      role: "Prüfer",
      roleId: "pruefer",
      location: "L",
      expiresAt: FUTURE,
      activateImmediately: false,
    };
    // Die Prüfung läuft in tsc (@ts-expect-error schlägt fehl, wenn das Feld doch erlaubt wäre).
    // @ts-expect-error acceptedByUid ist ein Server-Feld
    const a: NewInvitationInput = { ...base, acceptedByUid: "u" };
    // @ts-expect-error employeeId ist ein Server-Feld
    const b: NewInvitationInput = { ...base, employeeId: "emp" };
    // @ts-expect-error acceptedAt ist ein Server-Feld
    const c: NewInvitationInput = { ...base, acceptedAt: FUTURE };
    // @ts-expect-error revokedAt ist ein Server-Feld
    const d: NewInvitationInput = { ...base, revokedAt: FUTURE };
    assert.equal([a, b, c, d].length, 4);
  });
});
