// Serverseitige Einladungsannahme (Admin SDK): eine gültige Einladung wird in EINER Firestore-
// Transaktion zu Mitarbeiter + Membership + angenommener Einladung. Die Entscheidung trifft
// invitationAcceptanceRules (rein, getestet); hier wird nur gelesen, entschieden und geschrieben.
//
// Ablauf (alle Lesezugriffe vor den Schreibzugriffen):
//   Lesen:     Einladung (unter der Firma des Requests), Rolle der Einladung (gleiche Firma),
//              userMemberships/{uid}, Mitarbeiter an der geplanten ID, Mitarbeiter mit gleicher E-Mail
//   Schreiben: companies/{c}/employees/{emp-<invitationId>}  (create, Aktiv)
//              userMemberships/{uid}                          (create, Aktiv)
//              companies/{c}/invitations/{invitationId}       (Angenommen, acceptedAt/-ByUid/employeeId)
// Bei jedem Fehler vor dem Commit wird nichts geschrieben. Ein erneuter oder paralleler Versuch trifft auf
// den angenommenen Zustand (idempotent für dieselbe UID, sonst abgelehnt); Firestore wiederholt kollidierende
// Transaktionen mit frischen Daten.
import type { Firestore, Transaction } from "firebase-admin/firestore";

import { formatDateDE } from "@/lib/calendar/calendarDates";
import { companyCollectionPaths, userMembershipDocPath } from "@/lib/firebase/collections";
import { normalizeEmail } from "@/lib/invitations/invitationRules";
import {
  InvitationActionError,
  employeeIdForInvitation,
  planAcceptInvitation,
  requireVerifiedUser,
  type AcceptInvitationRequest,
  type StoredEmployeeSummary,
  type StoredInvitation,
  type VerifiedPrincipal,
} from "@/lib/security/invitationAcceptanceRules";
import { isSafeDocumentId } from "@/lib/security/memberActionRules";
import type { Role } from "@/types/role";
import type { UserMembership } from "@/types/userMembership";

export interface AcceptInvitationResult {
  // true: die Einladung war bereits (vollständig) von demselben Konto angenommen; es wurde nichts geschrieben.
  alreadyAccepted: boolean;
}

type Data = Record<string, unknown>;

function toIso(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

export async function acceptInvitation(
  db: Firestore,
  principal: VerifiedPrincipal,
  request: AcceptInvitationRequest,
  now: Date = new Date()
): Promise<AcceptInvitationResult> {
  // Vor jedem Firestore-Zugriff: verifizierte E-Mail und sichere IDs (Pfad-Injection).
  const user = requireVerifiedUser(principal);
  if (!isSafeDocumentId(user.uid)) throw new InvitationActionError("unauthenticated");
  if (!isSafeDocumentId(request.companyId) || !isSafeDocumentId(request.invitationId)) {
    throw new InvitationActionError("invalid-request");
  }

  return db.runTransaction(async (tx) => {
    const { companyId, invitationId } = request;
    const invitationRef = db.doc(`${companyCollectionPaths.invitations(companyId)}/${invitationId}`);
    const invitationSnap = await tx.get(invitationRef);
    const invitation = invitationSnap.exists ? (invitationSnap.data() as StoredInvitation & Data) : undefined;

    // Weitere Daten nur lesen, wenn die Einladung existiert (die Entscheidung prüft zuerst die Identität).
    let role: (Role & { id: string }) | undefined;
    let membership: UserMembership | undefined;
    let employee: StoredEmployeeSummary | undefined;
    let sameEmailEmployeeIds: string[] = [];
    // Bei bereits angenommener Einladung steht die Mitarbeiter-ID in der Einladung, sonst ist sie geplant.
    const storedEmployeeId =
      typeof invitation?.employeeId === "string" && isSafeDocumentId(invitation.employeeId)
        ? invitation.employeeId
        : employeeIdForInvitation(invitationId);

    if (invitation) {
      role = await readRole(tx, db, companyId, invitation.roleId);
      membership = await readMembership(tx, db, user.uid);
      employee = await readEmployee(tx, db, companyId, storedEmployeeId);
      if (typeof invitation.email === "string" && invitation.email.trim() !== "") {
        sameEmailEmployeeIds = await readSameEmailEmployeeIds(
          tx,
          db,
          companyId,
          normalizeEmail(invitation.email),
          storedEmployeeId
        );
      }
    }

    const plan = planAcceptInvitation({
      principal,
      request,
      now,
      invitation,
      role,
      membership,
      employee,
      sameEmailEmployeeIds,
    });

    if (plan.kind === "already-accepted") return { alreadyAccepted: true };

    const nowIso = now.toISOString();
    const today = formatDateDE(now);
    const employeeRef = db.doc(`${companyCollectionPaths.employees(companyId)}/${plan.employeeId}`);
    const membershipRef = db.doc(userMembershipDocPath(plan.uid));

    // Alle Werte stammen aus Einladung, Rolle und Token – nie aus dem Request.
    const employeeData: Data = {
      name: plan.name,
      initials: plan.initials,
      email: plan.email,
      role: plan.roleName,
      roleId: plan.roleId,
      location: plan.location,
      status: "Aktiv",
      lastLogin: "Gerade beigetreten",
      invitationStatus: "Angenommen",
      joinedAt: today,
      history: [{ message: "Einladung angenommen.", timestamp: today }],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    if (plan.locationId) employeeData.locationId = plan.locationId;

    const membershipData: Data = {
      companyId: plan.companyId,
      employeeId: plan.employeeId,
      roleId: plan.roleId,
      // Nur lesbarer Snapshot; maßgeblich ist roleId.
      role: plan.roleName,
      status: "Aktiv",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    tx.create(employeeRef, employeeData);
    tx.create(membershipRef, membershipData);
    tx.update(invitationRef, {
      status: "Angenommen",
      acceptedAt: nowIso,
      acceptedByUid: plan.uid,
      employeeId: plan.employeeId,
      updatedAt: nowIso,
    });

    return { alreadyAccepted: false };
  });
}

async function readRole(
  tx: Transaction,
  db: Firestore,
  companyId: string,
  roleId: unknown
): Promise<(Role & { id: string }) | undefined> {
  if (!isSafeDocumentId(roleId)) return undefined;
  const snapshot = await tx.get(db.doc(`${companyCollectionPaths.roles(companyId)}/${roleId}`));
  return snapshot.exists ? ({ ...(snapshot.data() as Data), id: roleId } as unknown as Role & { id: string }) : undefined;
}

async function readMembership(tx: Transaction, db: Firestore, uid: string): Promise<UserMembership | undefined> {
  const snapshot = await tx.get(db.doc(userMembershipDocPath(uid)));
  if (!snapshot.exists) return undefined;
  const data = snapshot.data() as Data;
  return { ...data, uid, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) } as unknown as UserMembership;
}

async function readEmployee(
  tx: Transaction,
  db: Firestore,
  companyId: string,
  employeeId: string
): Promise<StoredEmployeeSummary | undefined> {
  const snapshot = await tx.get(db.doc(`${companyCollectionPaths.employees(companyId)}/${employeeId}`));
  if (!snapshot.exists) return undefined;
  const data = snapshot.data() as Data;
  return { id: employeeId, status: data.status, roleId: data.roleId };
}

// Andere Mitarbeiter der Firma mit derselben (normalisierten) E-Mail-Adresse (ohne den eigenen/geplanten).
async function readSameEmailEmployeeIds(
  tx: Transaction,
  db: Firestore,
  companyId: string,
  email: string,
  ownEmployeeId: string
): Promise<string[]> {
  const snapshot = await tx.get(db.collection(companyCollectionPaths.employees(companyId)).where("email", "==", email));
  return snapshot.docs.map((doc) => doc.id).filter((id) => id !== ownEmployeeId);
}
