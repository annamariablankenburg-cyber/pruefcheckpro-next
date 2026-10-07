// Regeln für "Einladung annehmen" (rein funktional, ohne React, Firebase und Next.js; siehe
// docs/firebase/invitation-acceptance.md). Der Server (Admin SDK) liest Einladung, Rolle, Membership
// und Mitarbeiter in EINER Transaktion und lässt sie hier entscheiden; dieselben Funktionen sind ohne
// Emulator testbar.
//
// Vertrauen: Aus dem Request werden NUR companyId und invitationId gelesen – sie lokalisieren das
// Einladungsdokument und sind niemals eine Autorisierung. Identität (uid, E-Mail, Verifizierung) kommt
// ausschließlich aus dem geprüften Firebase-ID-Token; Rolle, Name, Standort aus dem Einladungs- und dem
// Rollen-Dokument. Die Firma der entstehenden Membership ist exakt die Firma, unter der die validierte
// Einladung liegt.
import { normalizeEmail, initialsOf } from "@/lib/invitations/invitationRules";
import { isSafeDocumentId } from "@/lib/security/memberActionRules";
import type { Role } from "@/types/role";
import type { UserMembership } from "@/types/userMembership";

// --- Fehlercodes --------------------------------------------------------------------

export type InvitationActionErrorCode =
  | "unauthenticated"
  | "server-not-configured"
  | "invalid-request"
  | "email-not-verified"
  // Einladung fehlt ODER gehört nicht zu diesem Konto (bewusst ein gemeinsamer Code: kein
  // Rückschluss, ob eine Einladungs-ID existiert).
  | "invitation-not-found"
  | "invitation-invalid"
  | "invitation-revoked"
  | "invitation-expired"
  | "invitation-already-accepted"
  | "already-member"
  | "employee-invalid"
  | "role-not-found"
  | "role-inactive"
  | "membership-conflict"
  | "internal-error";

// Deutsche Meldungen für die UI. Keine Firebase-Details, Pfade, IDs, Tokens oder E-Mail-Adressen.
export const INVITATION_ACTION_MESSAGES: Record<InvitationActionErrorCode, string> = {
  unauthenticated: "Bitte melde dich erneut an.",
  "server-not-configured": "Der Einladungsdienst ist nicht eingerichtet. Bitte wende dich an den Support.",
  "invalid-request": "Der Einladungslink ist ungültig.",
  "email-not-verified":
    "Bitte bestätige zuerst deine E-Mail-Adresse. Erst danach kann die Einladung angenommen werden.",
  "invitation-not-found":
    "Die Einladung wurde nicht gefunden oder ist für dieses Konto nicht bestimmt. Melde dich mit der eingeladenen E-Mail-Adresse an.",
  "invitation-invalid": "Die Einladung ist ungültig.",
  "invitation-revoked": "Die Einladung wurde widerrufen.",
  "invitation-expired": "Die Einladung ist abgelaufen. Bitte fordere eine neue Einladung an.",
  "invitation-already-accepted": "Die Einladung wurde bereits angenommen.",
  "already-member": "Dein Konto ist bereits einem Unternehmen zugeordnet.",
  "employee-invalid":
    "Für diese E-Mail-Adresse existiert bereits ein Mitarbeiter im Unternehmen. Bitte wende dich an die Administration.",
  "role-not-found": "Die in der Einladung vorgesehene Rolle existiert nicht mehr. Bitte fordere eine neue Einladung an.",
  "role-inactive": "Die in der Einladung vorgesehene Rolle ist archiviert. Bitte fordere eine neue Einladung an.",
  "membership-conflict":
    "Dein Konto ist bereits mit diesem Unternehmen verknüpft, aber nicht passend zu dieser Einladung. Bitte wende dich an die Administration.",
  "internal-error": "Die Einladung konnte nicht angenommen werden. Bitte versuche es erneut.",
};

export const INVITATION_ACTION_HTTP_STATUS: Record<InvitationActionErrorCode, number> = {
  unauthenticated: 401,
  "server-not-configured": 503,
  "invalid-request": 400,
  "email-not-verified": 403,
  "invitation-not-found": 404,
  "invitation-invalid": 409,
  "invitation-revoked": 409,
  "invitation-expired": 409,
  "invitation-already-accepted": 409,
  "already-member": 409,
  "employee-invalid": 409,
  "role-not-found": 409,
  "role-inactive": 409,
  "membership-conflict": 409,
  "internal-error": 500,
};

export function isInvitationActionErrorCode(value: unknown): value is InvitationActionErrorCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(INVITATION_ACTION_MESSAGES, value);
}

export class InvitationActionError extends Error {
  constructor(public readonly code: InvitationActionErrorCode) {
    super(INVITATION_ACTION_MESSAGES[code]);
    this.name = "InvitationActionError";
  }
}

// --- Request ------------------------------------------------------------------------

export interface AcceptInvitationRequest {
  companyId: string;
  invitationId: string;
}

// Nur companyId und invitationId; alles andere (uid, email, employeeId, roleId, role, status, isAdmin,
// permissions, actorRole …) wird ignoriert. Beide IDs müssen einfache Dokument-IDs sein (kein Pfad).
export function parseAcceptInvitationRequest(body: unknown): AcceptInvitationRequest {
  const data = body as Record<string, unknown> | null;
  if (typeof data !== "object" || data === null) throw new InvitationActionError("invalid-request");
  if (!isSafeDocumentId(data.companyId) || !isSafeDocumentId(data.invitationId)) {
    throw new InvitationActionError("invalid-request");
  }
  return { companyId: data.companyId, invitationId: data.invitationId };
}

// --- Identität ----------------------------------------------------------------------

// Verifiziertes Principal aus dem Firebase-ID-Token (Admin SDK). `email` und `emailVerified` stammen aus
// den Token-Claims, nie aus dem Request.
export interface VerifiedPrincipal {
  uid: string;
  email?: string;
  emailVerified: boolean;
}

export interface AcceptingUser {
  uid: string;
  // Normalisierte (getrimmte, kleingeschriebene) E-Mail aus dem Token.
  email: string;
}

// Ohne verifizierte E-Mail keine Annahme: Nur dann beweist die Auth-E-Mail den Besitz der Adresse, an die
// die Einladung gerichtet ist (Firebase bestätigt sie per Link). Fehlende E-Mail oder emailVerified !== true
// -> abgelehnt.
export function requireVerifiedUser(principal: VerifiedPrincipal): AcceptingUser {
  if (typeof principal.uid !== "string" || principal.uid === "") throw new InvitationActionError("unauthenticated");
  if (principal.emailVerified !== true || typeof principal.email !== "string" || principal.email.trim() === "") {
    throw new InvitationActionError("email-not-verified");
  }
  return { uid: principal.uid, email: normalizeEmail(principal.email) };
}

// Einladungs-E-Mail == verifizierte Auth-E-Mail, beide über dieselbe zentrale Normalisierung.
export function invitationMatchesIdentity(invitationEmail: unknown, userEmail: string): boolean {
  if (typeof invitationEmail !== "string" || invitationEmail.trim() === "") return false;
  return normalizeEmail(invitationEmail) === normalizeEmail(userEmail);
}

// --- Einladung / Rolle / Membership -------------------------------------------------

// Gespeicherte Einladung (Felder des Invitation-Schemas plus die nur serverseitig geschriebenen
// Annahmefelder).
export interface StoredInvitation {
  name?: unknown;
  email?: unknown;
  role?: unknown;
  roleId?: unknown;
  location?: unknown;
  locationId?: unknown;
  status?: unknown;
  expiresAt?: unknown;
  acceptedByUid?: unknown;
  employeeId?: unknown;
}

export interface StoredEmployeeSummary {
  id: string;
  status?: unknown;
  roleId?: unknown;
}

// Der Mitarbeiter, der zu einer Einladung gehört, bekommt eine deterministische ID: Ein erneuter oder
// paralleler Versuch kann nie einen zweiten Mitarbeiter anlegen.
export function employeeIdForInvitation(invitationId: string): string {
  return `emp-${invitationId}`;
}

export interface AcceptInvitationPlanInput {
  principal: VerifiedPrincipal;
  request: AcceptInvitationRequest;
  now: Date;
  // companies/{companyId}/invitations/{invitationId}; undefined = fehlt.
  invitation: StoredInvitation | undefined;
  // companies/{companyId}/roles/{invitation.roleId}; undefined = fehlt.
  role: (Role & { id: string }) | undefined;
  // userMemberships/{uid}; undefined = fehlt.
  membership: UserMembership | undefined;
  // Mitarbeiter-Dokument an der geplanten (bzw. gespeicherten) ID; undefined = fehlt.
  employee: StoredEmployeeSummary | undefined;
  // IDs ALLER anderen Mitarbeiter der Firma mit derselben (normalisierten) E-Mail.
  sameEmailEmployeeIds: string[];
}

export interface ProvisionPlan {
  kind: "provision";
  companyId: string;
  invitationId: string;
  uid: string;
  email: string;
  employeeId: string;
  roleId: string;
  roleName: string;
  name: string;
  initials: string;
  location: string;
  locationId: string | undefined;
}

// Wiederholter Request desselben Nutzers für eine bereits vollständig angenommene Einladung.
export interface IdempotentPlan {
  kind: "already-accepted";
  companyId: string;
  employeeId: string;
}

export type AcceptInvitationPlan = ProvisionPlan | IdempotentPlan;

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

// Reihenfolge (durch Tests fixiert): Identität des Tokens -> Einladung vorhanden und für dieses Konto
// -> Status -> (angenommen: Idempotenz) -> Ablauf -> Rolle -> bestehende Membership -> Mitarbeiter.
// Die Prüfung "gehört zu diesem Konto" kommt VOR dem Status, damit ein fremdes Konto nichts über den
// Status einer Einladung erfährt.
export function planAcceptInvitation(input: AcceptInvitationPlanInput): AcceptInvitationPlan {
  const user = requireVerifiedUser(input.principal);
  const { invitation, request, membership } = input;

  if (!invitation || !invitationMatchesIdentity(invitation.email, user.email)) {
    throw new InvitationActionError("invitation-not-found");
  }

  if (invitation.status === "Widerrufen") throw new InvitationActionError("invitation-revoked");

  if (invitation.status === "Angenommen") return planRepeatedAcceptance(input, user.uid);

  if (invitation.status !== "Ausstehend") throw new InvitationActionError("invitation-invalid");

  // Ablauf: ohne gültiges expiresAt lässt er sich nicht beurteilen -> ungültig (fail-closed).
  const expiresAt = typeof invitation.expiresAt === "string" ? new Date(invitation.expiresAt).getTime() : NaN;
  if (Number.isNaN(expiresAt)) throw new InvitationActionError("invitation-invalid");
  if (expiresAt < input.now.getTime()) throw new InvitationActionError("invitation-expired");

  const roleId = stringOrUndefined(invitation.roleId);
  const name = stringOrUndefined(invitation.name);
  if (!roleId || !isSafeDocumentId(roleId) || !name) throw new InvitationActionError("invitation-invalid");

  // Ausschließlich die gespeicherte Rolle der Einladung, kein Fallback auf den Namens-Snapshot.
  if (!input.role || input.role.id !== roleId) throw new InvitationActionError("role-not-found");
  if (input.role.status !== "Aktiv") throw new InvitationActionError("role-inactive");

  // users/{uid} -> userMemberships ist ein Singleton: nie überschreiben, nie umbiegen.
  if (membership) {
    throw new InvitationActionError(
      membership.companyId !== request.companyId ? "already-member" : "membership-conflict"
    );
  }

  // Kein bestehender Mitarbeiter (weder an der geplanten ID noch mit derselben E-Mail): keine stille
  // Verknüpfung oder Reaktivierung (auch nicht bei "Gesperrt"/"Ausstehend").
  if (input.employee || input.sameEmailEmployeeIds.length > 0) throw new InvitationActionError("employee-invalid");

  return {
    kind: "provision",
    companyId: request.companyId,
    invitationId: request.invitationId,
    uid: user.uid,
    email: user.email,
    employeeId: employeeIdForInvitation(request.invitationId),
    roleId,
    roleName: input.role.name,
    name,
    initials: initialsOf(name),
    location: stringOrUndefined(invitation.location) ?? "",
    locationId: stringOrUndefined(invitation.locationId),
  };
}

// Einladung bereits angenommen. Idempotent erfolgreich NUR für dieselbe UID und einen vollständig
// konsistenten, aktiven Zustand (Membership: gleiche Firma, gleicher Mitarbeiter, gleiche Rolle, Aktiv;
// Mitarbeiter: Aktiv, gleiche Rolle). Alles andere wird abgelehnt – es wird nie etwas repariert.
function planRepeatedAcceptance(input: AcceptInvitationPlanInput, uid: string): IdempotentPlan {
  const { invitation, request, membership, employee } = input;
  if (!invitation) throw new InvitationActionError("invitation-not-found");

  if (invitation.acceptedByUid !== uid) throw new InvitationActionError("invitation-already-accepted");
  if (!membership) throw new InvitationActionError("invitation-already-accepted");
  if (membership.companyId !== request.companyId) throw new InvitationActionError("already-member");

  const employeeId = stringOrUndefined(invitation.employeeId);
  const roleId = stringOrUndefined(invitation.roleId);
  const consistent =
    employeeId !== undefined &&
    roleId !== undefined &&
    membership.employeeId === employeeId &&
    membership.roleId === roleId &&
    membership.status === "Aktiv" &&
    employee !== undefined &&
    employee.id === employeeId &&
    employee.status === "Aktiv" &&
    employee.roleId === roleId;
  if (!consistent) throw new InvitationActionError("membership-conflict");

  return { kind: "already-accepted", companyId: request.companyId, employeeId };
}
