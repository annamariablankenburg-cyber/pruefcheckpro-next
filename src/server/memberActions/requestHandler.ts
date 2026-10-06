// HTTP-Schicht der Mitglieder-Aktionen: Token prüfen, Body validieren, Service
// aufrufen, Fehler auf stabile Codes abbilden. Unabhängig von Next.js (Web-
// Request/Response) und mit austauschbaren Abhängigkeiten, damit Tests ohne echte
// Firebase-Auth auskommen.
//
// Vertrauensgrenze: Aus dem Request werden NUR employeeId, roleId bzw. status und
// reason gelesen. Alles andere (companyId, actorRole, isAdmin, uid …) wird
// ignoriert – Firma, Actor und Rechte kommen aus dem verifizierten ID-Token (UID)
// und Firestore.
import type { Firestore } from "firebase-admin/firestore";

import {
  MEMBER_ACTION_HTTP_STATUS,
  MEMBER_ACTION_MESSAGES,
  MemberActionError,
  parseAssignRoleRequest,
  parseSetMemberStatusRequest,
  type MemberActionErrorCode,
} from "@/lib/security/memberActionRules";
import { assignRole, setMemberStatus } from "@/server/memberActions/memberActionsService";

export type MemberActionName = "assign-role" | "set-status";

export interface MemberActionDeps {
  // Prüft ein Firebase-ID-Token und liefert die UID; wirft bei ungültigem Token.
  verifyIdToken: (idToken: string) => Promise<{ uid: string }>;
  getDb: () => Firestore;
  now?: () => Date;
}

const MAX_BODY_BYTES = 4096;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function errorResponse(code: MemberActionErrorCode): Response {
  return json({ ok: false, code, message: MEMBER_ACTION_MESSAGES[code] }, MEMBER_ACTION_HTTP_STATUS[code]);
}

function bearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header) return undefined;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1];
}

async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new MemberActionError("invalid-request");
  try {
    return JSON.parse(text);
  } catch {
    throw new MemberActionError("invalid-request");
  }
}

export async function handleMemberActionRequest(
  request: Request,
  action: MemberActionName,
  deps: MemberActionDeps
): Promise<Response> {
  try {
    const token = bearerToken(request);
    if (!token) throw new MemberActionError("unauthenticated");

    let uid: string;
    try {
      ({ uid } = await deps.verifyIdToken(token));
    } catch (error) {
      // Konfigurationsfehler (kein Admin SDK) unterscheiden von einem ungültigen Token.
      if (error instanceof MemberActionError) throw error;
      throw new MemberActionError("unauthenticated");
    }

    const body = await readJsonBody(request);
    const db = deps.getDb();
    const now = deps.now?.() ?? new Date();

    const result =
      action === "assign-role"
        ? await assignRole(db, uid, parseAssignRoleRequest(body), now)
        : await setMemberStatus(db, uid, parseSetMemberStatusRequest(body), now);

    return json({ ok: true, ...result }, 200);
  } catch (error) {
    if (error instanceof MemberActionError) return errorResponse(error.code);
    // Unerwartet: nur serverseitig loggen (ohne Token/Request), dem Client nichts verraten.
    console.error("[member-actions] unerwarteter Fehler:", error instanceof Error ? error.name : "unknown");
    return errorResponse("internal-error");
  }
}
