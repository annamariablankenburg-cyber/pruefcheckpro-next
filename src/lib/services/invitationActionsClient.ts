// Client für die serverseitige Einladungsannahme (POST /api/invitation-actions/accept, siehe
// docs/firebase/invitation-acceptance.md). Sendet das Firebase-ID-Token des eingeloggten Users und NUR die
// beiden IDs aus dem Einladungslink; uid, E-Mail, Rolle, Mitarbeiter und Firma ermittelt der Server selbst.
import { auth } from "@/lib/firebase/firebase";
import {
  INVITATION_ACTION_MESSAGES,
  isInvitationActionErrorCode,
  type InvitationActionErrorCode,
} from "@/lib/security/invitationAcceptanceRules";

// "network": Server nicht erreichbar bzw. unerwartete Antwort.
export type InvitationActionClientErrorCode = InvitationActionErrorCode | "network";

export class InvitationActionClientError extends Error {
  constructor(public readonly code: InvitationActionClientErrorCode) {
    super(code === "network" ? "Der Server ist nicht erreichbar." : INVITATION_ACTION_MESSAGES[code]);
    this.name = "InvitationActionClientError";
  }
}

export async function acceptInvitation(companyId: string, invitationId: string): Promise<{ alreadyAccepted: boolean }> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new InvitationActionClientError("unauthenticated");

  let idToken: string;
  try {
    // Erzwingt ein frisches Token: eine gerade bestätigte E-Mail-Adresse steckt sonst noch nicht im Token.
    idToken = await user.getIdToken(true);
  } catch {
    throw new InvitationActionClientError("unauthenticated");
  }

  let response: Response;
  try {
    response = await fetch("/api/invitation-actions/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ companyId, invitationId }),
    });
  } catch {
    throw new InvitationActionClientError("network");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new InvitationActionClientError(response.ok ? "network" : "internal-error");
  }

  const data = payload as { ok?: boolean; alreadyAccepted?: boolean; code?: unknown };
  if (response.ok && data.ok === true) return { alreadyAccepted: data.alreadyAccepted === true };
  throw new InvitationActionClientError(isInvitationActionErrorCode(data.code) ? data.code : "internal-error");
}
