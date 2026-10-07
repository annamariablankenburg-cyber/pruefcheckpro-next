// HTTP-Schicht der Einladungsannahme: Token prüfen, Body validieren, Service aufrufen, Fehler auf stabile Codes
// abbilden. Unabhängig von Next.js (Web-Request/Response) und mit austauschbaren Abhängigkeiten, damit Tests
// ohne echte Firebase-Auth auskommen.
//
// Vertrauensgrenze: Aus dem Request werden NUR companyId und invitationId gelesen. uid, E-Mail, employeeId,
// roleId, role, status, isAdmin, permissions … werden ignoriert; Identität kommt aus dem geprüften ID-Token,
// alles andere aus Einladung, Rolle und Firestore.
import type { Firestore } from "firebase-admin/firestore";

import {
  INVITATION_ACTION_HTTP_STATUS,
  INVITATION_ACTION_MESSAGES,
  InvitationActionError,
  parseAcceptInvitationRequest,
  type InvitationActionErrorCode,
  type VerifiedPrincipal,
} from "@/lib/security/invitationAcceptanceRules";
import { MemberActionError } from "@/lib/security/memberActionRules";
import { acceptInvitation } from "@/server/invitationActions/invitationActionsService";

export interface InvitationActionDeps {
  // Prüft ein Firebase-ID-Token und liefert uid, E-Mail und Verifizierungsstatus; wirft bei ungültigem Token.
  verifyPrincipal: (idToken: string) => Promise<VerifiedPrincipal>;
  getDb: () => Firestore;
  now?: () => Date;
}

const MAX_BODY_BYTES = 2048;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function invitationErrorResponse(code: InvitationActionErrorCode): Response {
  return json({ ok: false, code, message: INVITATION_ACTION_MESSAGES[code] }, INVITATION_ACTION_HTTP_STATUS[code]);
}

function bearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header) return undefined;
  return /^Bearer\s+(\S+)$/i.exec(header.trim())?.[1];
}

async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  // Echte UTF-8-Bytes (nicht UTF-16-Zeichen): Mehrbyte-Zeichen dürfen das Limit nicht umgehen.
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) throw new InvitationActionError("invalid-request");
  try {
    return JSON.parse(text);
  } catch {
    throw new InvitationActionError("invalid-request");
  }
}

export async function handleAcceptInvitationRequest(request: Request, deps: InvitationActionDeps): Promise<Response> {
  try {
    const token = bearerToken(request);
    if (!token) throw new InvitationActionError("unauthenticated");

    let principal: VerifiedPrincipal;
    try {
      principal = await deps.verifyPrincipal(token);
    } catch (error) {
      // Konfigurationsfehler (kein Admin SDK) unterscheiden von einem ungültigen Token.
      if (error instanceof MemberActionError && error.code === "server-not-configured") {
        throw new InvitationActionError("server-not-configured");
      }
      if (error instanceof InvitationActionError) throw error;
      throw new InvitationActionError("unauthenticated");
    }

    const body = await readJsonBody(request);
    const parsed = parseAcceptInvitationRequest(body);
    const result = await acceptInvitation(deps.getDb(), principal, parsed, deps.now?.() ?? new Date());
    return json({ ok: true, alreadyAccepted: result.alreadyAccepted }, 200);
  } catch (error) {
    if (error instanceof InvitationActionError) return invitationErrorResponse(error.code);
    if (error instanceof MemberActionError && error.code === "server-not-configured") {
      return invitationErrorResponse("server-not-configured");
    }
    // Unerwartet: nur serverseitig loggen (ohne Token/Request), dem Client nichts verraten.
    console.error("[invitation-actions] unerwarteter Fehler:", error instanceof Error ? error.name : "unknown");
    return invitationErrorResponse("internal-error");
  }
}
