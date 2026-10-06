// Read-only Prüfung der Verknüpfung Employee <-> Membership einer Firma (rein
// funktional). Grundlage für das Operator-Skript scripts/auditMemberLinks.ts und
// die Migrationsanleitung in docs/firebase/member-security-actions.md.
//
// Die serverseitigen Aktionen (assignRole, setMemberStatus) verknüpfen über
// userMemberships/{uid}.employeeId == employees/{employeeId} (Firma + employeeId,
// genau eine Membership). Bestehende Daten, die das nicht erfüllen, werden von den
// Aktionen fail-closed abgelehnt und nie still repariert – dieses Audit zeigt sie an.
import type { EmployeeStatus } from "@/types/employee";
import type { MembershipStatus } from "@/types/userMembership";

export type MemberLinkFindingCode =
  | "membership-without-employee-id"
  | "membership-employee-missing"
  | "employee-multiple-memberships"
  | "employee-without-membership"
  | "role-divergence"
  | "status-divergence";

// error: Aktionen für diese Person sind blockiert; warning: Daten laufen auseinander
// (die nächste Aktion synchronisiert sie); info: erwartbar/prüfen.
export type MemberLinkSeverity = "error" | "warning" | "info";

export interface MemberLinkFinding {
  code: MemberLinkFindingCode;
  severity: MemberLinkSeverity;
  uid?: string;
  employeeId?: string;
  detail: string;
}

export interface AuditEmployee {
  id: string;
  roleId?: string;
  status?: EmployeeStatus | string;
}

export interface AuditMembership {
  uid: string;
  employeeId?: string;
  roleId?: string;
  status?: MembershipStatus | string;
}

export function auditMemberLinks(input: {
  employees: AuditEmployee[];
  // Nur die Memberships DERSELBEN Firma.
  memberships: AuditMembership[];
}): MemberLinkFinding[] {
  const findings: MemberLinkFinding[] = [];
  const employeesById = new Map(input.employees.map((employee) => [employee.id, employee]));
  const byEmployee = new Map<string, AuditMembership[]>();

  for (const membership of input.memberships) {
    if (typeof membership.employeeId !== "string" || membership.employeeId === "") {
      findings.push({
        code: "membership-without-employee-id",
        severity: "error",
        uid: membership.uid,
        detail: "Membership ohne employeeId: keine Rollen-/Statusaktion für diese Person möglich (manuelles Mapping nötig).",
      });
      continue;
    }
    byEmployee.set(membership.employeeId, [...(byEmployee.get(membership.employeeId) ?? []), membership]);
    if (!employeesById.has(membership.employeeId)) {
      findings.push({
        code: "membership-employee-missing",
        severity: "error",
        uid: membership.uid,
        employeeId: membership.employeeId,
        detail: "employeeId zeigt auf keinen Mitarbeiter dieser Firma.",
      });
    }
  }

  for (const [employeeId, memberships] of byEmployee) {
    if (memberships.length > 1) {
      findings.push({
        code: "employee-multiple-memberships",
        severity: "error",
        employeeId,
        detail: `${memberships.length} Memberships zeigen auf denselben Mitarbeiter (${memberships.map((m) => m.uid).join(", ")}).`,
      });
      continue;
    }
    const employee = employeesById.get(employeeId);
    const membership = memberships[0];
    if (!employee) continue;
    if ((employee.roleId ?? "") !== (membership.roleId ?? "")) {
      findings.push({
        code: "role-divergence",
        severity: "warning",
        uid: membership.uid,
        employeeId,
        detail: `Mitarbeiter-roleId "${employee.roleId ?? ""}" ≠ Membership-roleId "${membership.roleId ?? ""}" (maßgeblich ist die Membership).`,
      });
    }
    if (employee.status !== membership.status) {
      findings.push({
        code: "status-divergence",
        severity: "warning",
        uid: membership.uid,
        employeeId,
        detail: `Mitarbeiter-Status "${employee.status ?? ""}" ≠ Membership-Status "${membership.status ?? ""}".`,
      });
    }
  }

  // Mitarbeiter ohne Zugang: bei "Ausstehend" (Einladung) normal, sonst prüfen.
  for (const employee of input.employees) {
    if (!byEmployee.has(employee.id) && employee.status !== "Ausstehend") {
      findings.push({
        code: "employee-without-membership",
        severity: "info",
        employeeId: employee.id,
        detail: "Kein Zugang (Membership) eingerichtet: Rollen-/Statusaktionen sind für diesen Mitarbeiter nicht möglich.",
      });
    }
  }

  return findings;
}
