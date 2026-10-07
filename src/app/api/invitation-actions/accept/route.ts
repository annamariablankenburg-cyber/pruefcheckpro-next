import { defaultInvitationActionDeps } from "@/server/invitationActions/defaultDeps";
import { handleAcceptInvitationRequest } from "@/server/invitationActions/requestHandler";

// Admin SDK braucht die Node.js-Runtime (nicht Edge).
export const runtime = "nodejs";

// POST /api/invitation-actions/accept  { companyId, invitationId }
// Authorization: Bearer <Firebase-ID-Token>
// Nimmt eine Einladung an: Mitarbeiter + Membership + Einladung in einer Transaktion
// (docs/firebase/invitation-acceptance.md). Identität kommt aus dem Token, nie aus dem Body.
export async function POST(request: Request) {
  return handleAcceptInvitationRequest(request, defaultInvitationActionDeps);
}
