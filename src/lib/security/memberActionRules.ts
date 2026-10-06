// Autorisierungsregeln für die serverseitigen Mitglieder-Aktionen assignRole und
// setMemberStatus (siehe docs/firebase/member-security-actions.md). Rein
// funktional, ohne React, Firebase und Next.js: Der Server lädt die Daten
// (Actor-Membership, Rolle, Ziel-Mitarbeiter, Ziel-Membership, Zielrolle,
// Administratoren) und lässt sie hier entscheiden; dieselben Funktionen sind ohne
// Emulator testbar.
//
// Die Regeln spiegeln die Firestore Rules Phase 1 (geschützte Rollen, kein
// Selbst-Eingriff) und ergänzen, was Rules nicht können: Letzter-Administrator-
// Schutz, Membership-/Employee-Konsistenz und das atomare Schreiben beider
// Dokumente.
//
// Vertrauen: Nichts davon stammt aus dem Request außer `employeeId`, `roleId`
// bzw. `status`. Die Firma, der Actor, seine Rolle und seine Rechte werden
// ausschließlich aus den serverseitig gelesenen Dokumenten abgeleitet.
import { hasPermission, resolveEffectivePermissions } from "@/lib/permissions/permissionRules";
import { isProtectedRole } from "@/lib/permissions/gatingRules";
import { ADMIN_ROLE_ID } from "@/lib/roles/roleRules";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
import type { MembershipStatus, UserMembership } from "@/types/userMembership";

// --- Fehlercodes --------------------------------------------------------------------

export type MemberActionErrorCode =
  | "unauthenticated"
  | "invalid-request"
  | "membership-missing"
  | "membership-blocked"
  | "membership-invalid"
  | "permission-denied"
  | "employee-not-found"
  | "membership-not-found"
  | "target-role-not-found"
  | "target-role-inactive"
  | "protected-role-denied"
  | "self-change-denied"
  | "last-admin-denied"
  | "membership-employee-mismatch"
  | "server-not-configured"
  | "internal-error";

// Deutsche Meldungen für die UI. Bewusst allgemein: keine Firebase-Details, keine
// Pfade, keine IDs.
export const MEMBER_ACTION_MESSAGES: Record<MemberActionErrorCode, string> = {
  unauthenticated: "Bitte melde dich erneut an.",
  "invalid-request": "Die Anfrage ist ungültig.",
  "membership-missing": "Für dein Konto ist kein Unternehmenszugang eingerichtet.",
  "membership-blocked": "Dein Unternehmenszugang ist gesperrt.",
  "membership-invalid": "Dein Unternehmenszugang ist fehlerhaft eingerichtet.",
  "permission-denied": "Dafür fehlt dir die Berechtigung.",
  "employee-not-found": "Der Mitarbeiter wurde nicht gefunden.",
  "membership-not-found":
    "Für diesen Mitarbeiter ist noch kein Zugang (Membership) eingerichtet. Die Änderung ist nicht möglich.",
  "target-role-not-found": "Die gewählte Rolle wurde nicht gefunden.",
  "target-role-inactive": "Die gewählte Rolle ist archiviert und kann nicht zugewiesen werden.",
  "protected-role-denied": "Rollen und Mitarbeiter mit geschützten Rechten darf nur ein Administrator ändern.",
  "self-change-denied": "Die eigene Rolle und der eigene Status können nicht geändert werden.",
  "last-admin-denied": "Der letzte aktive Administrator kann nicht geändert oder gesperrt werden.",
  "membership-employee-mismatch":
    "Mitarbeiter und Zugang sind nicht eindeutig verknüpft. Bitte wende dich an den Support.",
  "server-not-configured": "Der Sicherheitsdienst ist nicht eingerichtet. Bitte wende dich an den Support.",
  "internal-error": "Die Änderung konnte nicht gespeichert werden. Bitte versuche es erneut.",
};

export const MEMBER_ACTION_HTTP_STATUS: Record<MemberActionErrorCode, number> = {
  unauthenticated: 401,
  "invalid-request": 400,
  "membership-missing": 403,
  "membership-blocked": 403,
  "membership-invalid": 403,
  "permission-denied": 403,
  "employee-not-found": 404,
  "membership-not-found": 409,
  "target-role-not-found": 404,
  "target-role-inactive": 409,
  "protected-role-denied": 403,
  "self-change-denied": 403,
  "last-admin-denied": 409,
  "membership-employee-mismatch": 409,
  "server-not-configured": 503,
  "internal-error": 500,
};

export function isMemberActionErrorCode(value: unknown): value is MemberActionErrorCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MEMBER_ACTION_MESSAGES, value);
}

export class MemberActionError extends Error {
  constructor(public readonly code: MemberActionErrorCode) {
    super(MEMBER_ACTION_MESSAGES[code]);
    this.name = "MemberActionError";
  }
}

// --- Eingaben -----------------------------------------------------------------------

// Firestore-Dokument-IDs aus dem Request: kein Pfad (kein "/"), nicht "." / "..",
// keine reservierte __…__-Form, begrenzte Länge. Verhindert, dass ein Client über
// die ID andere Pfade adressiert.
export function isSafeDocumentId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 200 &&
    !value.includes("/") &&
    value !== "." &&
    value !== ".." &&
    !/^__.*__$/.test(value) &&
    value.trim() === value
  );
}

export type StatusChangeReason = "revoke-access";

export interface AssignRoleRequest {
  employeeId: string;
  roleId: string;
}

export interface SetMemberStatusRequest {
  employeeId: string;
  status: MembershipStatus;
  // Nur für die Historienmeldung ("Zugriff entzogen" statt "temporär gesperrt").
  reason?: StatusChangeReason;
}

export function parseAssignRoleRequest(body: unknown): AssignRoleRequest {
  const data = body as Record<string, unknown> | null;
  if (typeof data !== "object" || data === null) throw new MemberActionError("invalid-request");
  if (!isSafeDocumentId(data.employeeId) || !isSafeDocumentId(data.roleId)) {
    throw new MemberActionError("invalid-request");
  }
  return { employeeId: data.employeeId, roleId: data.roleId };
}

export function parseSetMemberStatusRequest(body: unknown): SetMemberStatusRequest {
  const data = body as Record<string, unknown> | null;
  if (typeof data !== "object" || data === null) throw new MemberActionError("invalid-request");
  if (!isSafeDocumentId(data.employeeId)) throw new MemberActionError("invalid-request");
  if (data.status !== "Aktiv" && data.status !== "Gesperrt") throw new MemberActionError("invalid-request");
  if (data.reason !== undefined && data.reason !== "revoke-access") throw new MemberActionError("invalid-request");
  return {
    employeeId: data.employeeId,
    status: data.status,
    ...(data.reason ? { reason: data.reason as StatusChangeReason } : {}),
  };
}

// --- Actor --------------------------------------------------------------------------

export interface ActorInput {
  uid: string;
  // userMemberships/{uid} (undefined = Dokument fehlt).
  membership: UserMembership | undefined;
  // Rollen-Dokument zu membership.roleId (undefined = fehlt).
  role: Role | undefined;
}

export interface ResolvedActor {
  uid: string;
  companyId: string;
  // membership.employeeId: der eigene Mitarbeiter-Datensatz.
  employeeId: string | undefined;
  permissions: Record<string, boolean>;
  canManageProtected: boolean;
}

// Wirksame Rechte des Aufrufers aus Membership -> Rolle (Kette wie in den Rules;
// archivierte oder fehlende Rolle gewährt nichts). Wirft den passenden Fehler.
export function resolveActor(actor: ActorInput): ResolvedActor {
  const effective = resolveEffectivePermissions({ membership: actor.membership, role: actor.role });
  if (effective.reason === "membership-missing") throw new MemberActionError("membership-missing");
  if (effective.reason === "membership-blocked") throw new MemberActionError("membership-blocked");
  if (effective.reason === "membership-invalid") throw new MemberActionError("membership-invalid");
  if (effective.reason !== null) throw new MemberActionError("permission-denied");

  // evaluateMembership hat companyId bereits als nichtleer bestätigt.
  const membership = actor.membership as UserMembership;
  return {
    uid: actor.uid,
    companyId: membership.companyId,
    employeeId: membership.employeeId,
    permissions: effective.permissions,
    canManageProtected: hasPermission(effective.permissions, "rollen.admin_verwalten"),
  };
}

export function assertCanManageMembers(actor: ResolvedActor): void {
  if (!hasPermission(actor.permissions, "administration.mitarbeiter_verwalten")) {
    throw new MemberActionError("permission-denied");
  }
}

// --- Ziel ---------------------------------------------------------------------------

export interface TargetInput {
  employeeId: string;
  // Mitarbeiter-Dokument der Firma des Actors (undefined = fehlt dort).
  employee: Pick<Employee, "id" | "status" | "roleId"> | undefined;
  // ALLE Memberships der Firma des Actors mit membership.employeeId == employeeId.
  memberships: UserMembership[];
}

export interface ResolvedTarget {
  // Die UID kommt aus der serverseitig gefundenen Membership, nie aus dem Request.
  uid: string;
  membership: UserMembership;
}

// Employee und Membership müssen genau einander zugeordnet sein: eine Membership
// derselben Firma, deren employeeId auf diesen Mitarbeiter zeigt. Alles andere
// (fehlend, mehrdeutig, fremde Firma, offene Einladung) ist fail-closed – ohne
// stille Reparatur.
export function resolveTarget(actor: ResolvedActor, target: TargetInput): ResolvedTarget {
  if (!target.employee || target.employee.id !== target.employeeId) {
    throw new MemberActionError("employee-not-found");
  }
  if (target.memberships.length === 0) throw new MemberActionError("membership-not-found");
  if (target.memberships.length > 1) throw new MemberActionError("membership-employee-mismatch");

  const membership = target.memberships[0];
  if (
    membership.companyId !== actor.companyId ||
    membership.employeeId !== target.employeeId ||
    typeof membership.uid !== "string" ||
    membership.uid === ""
  ) {
    throw new MemberActionError("membership-employee-mismatch");
  }
  // "Ausstehend" = Einladung noch nicht angenommen; ein Zugang dürfte nicht existieren.
  if (target.employee.status === "Ausstehend") throw new MemberActionError("membership-employee-mismatch");

  return { uid: membership.uid, membership };
}

// Der Actor darf weder seine eigene Rolle noch seinen eigenen Status ändern –
// erkannt über membership.employeeId (nie Name/E-Mail) und zusätzlich über die UID.
export function assertNotSelf(actor: ResolvedActor, target: ResolvedTarget, employeeId: string): void {
  if (target.uid === actor.uid || (actor.employeeId !== undefined && actor.employeeId === employeeId)) {
    throw new MemberActionError("self-change-denied");
  }
}

// --- Geschützte Rollen --------------------------------------------------------------

export interface TargetRoles {
  // Rolle zu membership.roleId (maßgeblich: wirksame Rolle). undefined = fehlt.
  membershipRole: Role | undefined;
  // Rolle zu employee.roleId (Verwaltungsdatum). undefined = fehlt/unbekannt.
  employeeRole: Role | undefined;
}

// Ist der Ziel-User heute "geschützt" (Administrator, Rolle mit einem der 7
// geschützten Schlüssel, nicht auflösbare wirksame Rolle)? Maßgeblich ist die
// wirksame Rolle der Membership (fail-closed, wenn sie sich nicht auflösen lässt);
// zusätzlich zählt eine geschützte Employee-Rolle. Gleiche Regel wie
// roleIdIsProtected in den Rules, aber für beide Rollenverweise.
export function isTargetProtected(target: ResolvedTarget, roles: TargetRoles): boolean {
  const roleId = target.membership.roleId;
  if (typeof roleId !== "string" || roleId === "") return true;
  if (!roles.membershipRole || roles.membershipRole.id !== roleId) return true;
  if (isProtectedRole(roles.membershipRole)) return true;
  if (roles.employeeRole && isProtectedRole(roles.employeeRole)) return true;
  return false;
}

// Zuweisbare Zielrolle: existiert (in der Firma des Actors – der Server liest sie
// nur aus companies/{companyId}/roles) und ist aktiv.
export function assertAssignableRole(newRole: Role | undefined, roleId: string): Role {
  if (!newRole || newRole.id !== roleId) throw new MemberActionError("target-role-not-found");
  if (newRole.status !== "Aktiv") throw new MemberActionError("target-role-inactive");
  return newRole;
}

// --- Letzter Administrator ----------------------------------------------------------

// Definition (siehe docs/database/permissions.md: "Mindestens ein aktiver
// Administrator muss bleiben"): aktiver Administrator = Membership mit status
// "Aktiv" UND roleId == "admin" (die Systemrolle Administrator). Custom Roles mit
// rollen.admin_verwalten zählen bewusst NICHT: Nur die Systemrolle ist unveränderlich
// und kann nicht archiviert oder entzogen werden.
export function isActiveAdminMembership(
  membership: Pick<UserMembership, "status" | "roleId"> | undefined
): boolean {
  return membership?.status === "Aktiv" && membership.roleId === ADMIN_ROLE_ID;
}

// activeAdminUids: UIDs ALLER aktiven Administratoren der Firma (inkl. des Ziels).
export function assertNotLastAdmin(target: ResolvedTarget, activeAdminUids: readonly string[]): void {
  if (!isActiveAdminMembership(target.membership)) return;
  const others = activeAdminUids.filter((uid) => uid !== target.uid);
  if (others.length === 0) throw new MemberActionError("last-admin-denied");
}

// --- Gesamtentscheidungen -----------------------------------------------------------

export interface AssignRolePlanInput {
  actor: ActorInput;
  request: AssignRoleRequest;
  target: TargetInput;
  roles: TargetRoles;
  // Zielrolle (aus companies/{companyId}/roles/{request.roleId}), undefined = fehlt.
  newRole: Role | undefined;
  activeAdminUids: readonly string[];
}

export interface AssignRolePlan {
  companyId: string;
  targetUid: string;
  employeeId: string;
  roleId: string;
  roleName: string;
}

// Reihenfolge der Prüfungen (stabil, durch Tests fixiert): Actor/Recht ->
// Mitarbeiter -> Membership/Konsistenz -> Selbst -> Zielrolle -> geschützt ->
// letzter Administrator.
export function planAssignRole(input: AssignRolePlanInput): AssignRolePlan {
  const actor = resolveActor(input.actor);
  assertCanManageMembers(actor);
  const target = resolveTarget(actor, input.target);
  assertNotSelf(actor, target, input.request.employeeId);
  const newRole = assertAssignableRole(input.newRole, input.request.roleId);

  if (!actor.canManageProtected && (isProtectedRole(newRole) || isTargetProtected(target, input.roles))) {
    throw new MemberActionError("protected-role-denied");
  }
  // Der Administrator wird "abgesetzt", wenn die neue Rolle nicht mehr "admin" ist.
  if (newRole.id !== ADMIN_ROLE_ID) assertNotLastAdmin(target, input.activeAdminUids);

  return {
    companyId: actor.companyId,
    targetUid: target.uid,
    employeeId: input.request.employeeId,
    roleId: newRole.id,
    roleName: newRole.name,
  };
}

export interface SetMemberStatusPlanInput {
  actor: ActorInput;
  request: SetMemberStatusRequest;
  target: TargetInput;
  roles: TargetRoles;
  activeAdminUids: readonly string[];
}

export interface SetMemberStatusPlan {
  companyId: string;
  targetUid: string;
  employeeId: string;
  status: MembershipStatus;
}

export function planSetMemberStatus(input: SetMemberStatusPlanInput): SetMemberStatusPlan {
  const actor = resolveActor(input.actor);
  assertCanManageMembers(actor);
  const target = resolveTarget(actor, input.target);
  assertNotSelf(actor, target, input.request.employeeId);

  if (!actor.canManageProtected && isTargetProtected(target, input.roles)) {
    throw new MemberActionError("protected-role-denied");
  }
  if (input.request.status === "Gesperrt") assertNotLastAdmin(target, input.activeAdminUids);

  return {
    companyId: actor.companyId,
    targetUid: target.uid,
    employeeId: input.request.employeeId,
    status: input.request.status,
  };
}

// Historienmeldungen (serverseitig fest; der Client liefert keinen Text).
export function statusHistoryMessage(status: MembershipStatus, reason?: StatusChangeReason): string {
  if (status === "Aktiv") return "Zugriff reaktiviert.";
  return reason === "revoke-access" ? "Zugriff entzogen." : "Zugriff temporär gesperrt.";
}
