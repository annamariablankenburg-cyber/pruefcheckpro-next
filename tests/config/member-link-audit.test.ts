import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { auditMemberLinks } from "../../src/lib/security/memberLinkAudit";

describe("auditMemberLinks (Employee <-> Membership)", () => {
  it("saubere Daten → keine Befunde (Einladungen ohne Membership sind normal)", () => {
    const findings = auditMemberLinks({
      employees: [
        { id: "e1", roleId: "admin", status: "Aktiv" },
        { id: "e2", roleId: "pruefer", status: "Ausstehend" },
      ],
      memberships: [{ uid: "u1", employeeId: "e1", roleId: "admin", status: "Aktiv" }],
    });
    assert.deepEqual(findings, []);
  });

  it("Membership ohne employeeId / mit unbekanntem Mitarbeiter → error", () => {
    const findings = auditMemberLinks({
      employees: [{ id: "e1", roleId: "pruefer", status: "Aktiv" }],
      memberships: [
        { uid: "u-no-link", roleId: "pruefer", status: "Aktiv" },
        { uid: "u-empty", employeeId: "", roleId: "pruefer", status: "Aktiv" },
        { uid: "u-ghost", employeeId: "ghost", roleId: "pruefer", status: "Aktiv" },
      ],
    });
    assert.deepEqual(
      findings.map((f) => [f.code, f.severity, f.uid]),
      [
        ["membership-without-employee-id", "error", "u-no-link"],
        ["membership-without-employee-id", "error", "u-empty"],
        ["membership-employee-missing", "error", "u-ghost"],
        ["employee-without-membership", "info", undefined],
      ]
    );
  });

  it("mehrere Memberships für einen Mitarbeiter → error (keine weitere Divergenzprüfung)", () => {
    const findings = auditMemberLinks({
      employees: [{ id: "e1", roleId: "pruefer", status: "Aktiv" }],
      memberships: [
        { uid: "u1", employeeId: "e1", roleId: "azubi", status: "Gesperrt" },
        { uid: "u2", employeeId: "e1", roleId: "pruefer", status: "Aktiv" },
      ],
    });
    assert.deepEqual(findings.map((f) => f.code), ["employee-multiple-memberships"]);
    assert.match(findings[0].detail, /u1, u2/);
  });

  it("Rollen- und Statusdivergenz → warning", () => {
    const findings = auditMemberLinks({
      employees: [{ id: "e1", roleId: "laborleiter", status: "Gesperrt" }],
      memberships: [{ uid: "u1", employeeId: "e1", roleId: "pruefer", status: "Aktiv" }],
    });
    assert.deepEqual(findings.map((f) => [f.code, f.severity]), [
      ["role-divergence", "warning"],
      ["status-divergence", "warning"],
    ]);
  });

  it("Mitarbeiter ohne roleId und Membership ohne roleId gelten als gleich", () => {
    assert.deepEqual(
      auditMemberLinks({
        employees: [{ id: "e1", status: "Aktiv" }],
        memberships: [{ uid: "u1", employeeId: "e1", status: "Aktiv" }],
      }),
      []
    );
  });
});
