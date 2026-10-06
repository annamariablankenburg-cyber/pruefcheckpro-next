// Client für die serverseitigen Mitglieder-Aktionen (Route Handler unter
// /api/member-actions, siehe docs/firebase/member-security-actions.md). Sendet das
// Firebase-ID-Token des eingeloggten Users; Firma, Rolle und Rechte ermittelt der
// Server selbst. Rollen- und Statusänderungen laufen NUR hierüber – die Firestore
// Rules verbieten sie dem Client.
import { auth } from "@/lib/firebase/firebase";
import {
  MEMBER_ACTION_MESSAGES,
  isMemberActionErrorCode,
  type MemberActionErrorCode,
  type StatusChangeReason,
} from "@/lib/security/memberActionRules";
import type { Employee } from "@/types/employee";
import type { MembershipStatus } from "@/types/userMembership";

// "network": Server nicht erreichbar bzw. unerwartete Antwort.
export type MemberActionClientErrorCode = MemberActionErrorCode | "network";

export class MemberActionClientError extends Error {
  constructor(
    public readonly code: MemberActionClientErrorCode,
    message?: string
  ) {
    super(message ?? (code === "network" ? "Der Server ist nicht erreichbar." : MEMBER_ACTION_MESSAGES[code]));
    this.name = "MemberActionClientError";
  }
}

// Verständliche Meldung für die UI (nur bei MemberActionClientError mit Servertext).
export function memberActionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof MemberActionClientError ? error.message : fallback;
}

interface MemberActionResponse {
  employee: Employee;
}

async function callMemberAction(path: string, body: Record<string, unknown>): Promise<Employee> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new MemberActionClientError("unauthenticated");

  let idToken: string;
  try {
    idToken = await user.getIdToken();
  } catch {
    throw new MemberActionClientError("unauthenticated");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new MemberActionClientError("network");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MemberActionClientError(response.ok ? "network" : "internal-error");
  }

  const data = payload as { ok?: boolean; code?: unknown } & Partial<MemberActionResponse>;
  if (response.ok && data.ok === true && data.employee) return data.employee;
  // Bekannte Codes mit der festen Client-Meldung; alles andere als allgemeiner Fehler.
  throw new MemberActionClientError(isMemberActionErrorCode(data.code) ? data.code : "internal-error");
}

export const memberActionsClient = {
  // Rolle von Employee UND Membership atomar ändern. Der Rollenname kommt vom Server.
  assignRole(employeeId: string, roleId: string): Promise<Employee> {
    return callMemberAction("/api/member-actions/assign-role", { employeeId, roleId });
  },

  // Status von Employee UND Membership atomar ändern (sperren, reaktivieren, Zugriff entziehen).
  setMemberStatus(employeeId: string, status: MembershipStatus, reason?: StatusChangeReason): Promise<Employee> {
    return callMemberAction("/api/member-actions/set-status", { employeeId, status, ...(reason ? { reason } : {}) });
  },
};
