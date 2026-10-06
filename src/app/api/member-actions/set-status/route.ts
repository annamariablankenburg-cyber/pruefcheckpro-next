import { defaultMemberActionDeps } from "@/server/memberActions/defaultDeps";
import { handleMemberActionRequest } from "@/server/memberActions/requestHandler";

// Admin SDK braucht die Node.js-Runtime (nicht Edge).
export const runtime = "nodejs";

// POST /api/member-actions/set-status  { employeeId, status: "Aktiv" | "Gesperrt", reason? }
// Authorization: Bearer <Firebase-ID-Token>
// Ändert status von Employee UND Membership in einer Transaktion
// (docs/firebase/member-security-actions.md).
export async function POST(request: Request) {
  return handleMemberActionRequest(request, "set-status", defaultMemberActionDeps);
}
