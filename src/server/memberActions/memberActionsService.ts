// Serverseitige Mitglieder-Aktionen (Admin SDK): assignRole und setMemberStatus
// schreiben Employee UND Membership in EINER Firestore-Transaktion. Die
// Entscheidung trifft memberActionRules (rein, getestet); hier wird nur gelesen,
// entschieden und geschrieben.
//
// Ablauf je Aktion (alle Lesezugriffe vor den Schreibzugriffen, alles in einer
// Transaktion – bei einem Fehler wird nichts geschrieben):
//   1. Actor: userMemberships/{actorUid} + companies/{companyId}/roles/{roleId}
//      (Firma, Rolle und Rechte kommen NUR von hier, nie aus dem Request)
//   2. Ziel: Mitarbeiter-Dokument der Actor-Firma + alle Memberships der Firma mit
//      employeeId == Ziel (die UID wird daraus abgeleitet)
//   3. Rollen (Ziel-/Employee-/Membership-Rolle) und aktive Administratoren
//   4. plan…() entscheidet; bei Freigabe: Employee + Membership aktualisieren.
//
// Keine stillen Reparaturen: Inkonsistenzen führen zu einem Fehler.
import type { DocumentReference, Firestore, Transaction } from "firebase-admin/firestore";

import { companyCollectionPaths, userMembershipDocPath } from "@/lib/firebase/collections";
import { buildEmployeeHistoryEntry, employeeHistoryMessages } from "@/lib/employees/employeeRules";
import { ADMIN_ROLE_ID } from "@/lib/roles/roleRules";
import {
  MemberActionError,
  assertCanManageMembers,
  isSafeDocumentId,
  planAssignRole,
  planSetMemberStatus,
  resolveActor,
  statusHistoryMessage,
  type ActorInput,
  type AssignRoleRequest,
  type SetMemberStatusRequest,
  type TargetRoles,
} from "@/lib/security/memberActionRules";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
import type { MembershipStatus, UserMembership } from "@/types/userMembership";

export interface MemberActionResult {
  employee: Employee;
  membership: { roleId?: string; role?: string; status: MembershipStatus };
}

type Data = Record<string, unknown>;

// Admin-Writes können Timestamps liefern, die App speichert ISO-Strings.
function toIso(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

function withIsoDates<T extends object>(data: T): T {
  const result = { ...data } as Data;
  for (const key of ["createdAt", "updatedAt"]) {
    if (key in result) result[key] = toIso(result[key]);
  }
  return result as T;
}

async function readMembership(tx: Transaction, db: Firestore, uid: string): Promise<UserMembership | undefined> {
  const snapshot = await tx.get(db.doc(userMembershipDocPath(uid)));
  return snapshot.exists ? withIsoDates({ uid, ...(snapshot.data() as Data) } as unknown as UserMembership) : undefined;
}

async function readRole(
  tx: Transaction,
  db: Firestore,
  companyId: string,
  roleId: unknown
): Promise<Role | undefined> {
  if (!isSafeDocumentId(roleId)) return undefined;
  const snapshot = await tx.get(db.doc(`${companyCollectionPaths.roles(companyId)}/${roleId}`));
  return snapshot.exists ? ({ id: roleId, ...(snapshot.data() as Data) } as unknown as Role) : undefined;
}

// Actor laden und gegen die Rechte prüfen, BEVOR weitere Daten gelesen werden.
async function loadActor(tx: Transaction, db: Firestore, actorUid: string): Promise<ActorInput> {
  if (!isSafeDocumentId(actorUid)) throw new MemberActionError("unauthenticated");
  const membership = await readMembership(tx, db, actorUid);
  const roleId = membership?.roleId;
  const role =
    membership && isSafeDocumentId(membership.companyId)
      ? await readRole(tx, db, membership.companyId, roleId)
      : undefined;
  const actor: ActorInput = { uid: actorUid, membership, role };
  // Früh abbrechen (kein Auslesen fremder Daten für nicht berechtigte Aufrufer).
  assertCanManageMembers(resolveActor(actor));
  return actor;
}

interface LoadedTarget {
  employeeRef: DocumentReference;
  employeeData: Data | undefined;
  employee: Pick<Employee, "id" | "status" | "roleId"> | undefined;
  memberships: UserMembership[];
  membershipRef: DocumentReference | undefined;
  roles: TargetRoles;
  activeAdminUids: string[];
}

async function loadTarget(
  tx: Transaction,
  db: Firestore,
  companyId: string,
  employeeId: string
): Promise<LoadedTarget> {
  const employeeRef = db.doc(`${companyCollectionPaths.employees(companyId)}/${employeeId}`);
  const employeeSnapshot = await tx.get(employeeRef);
  const employeeData = employeeSnapshot.exists ? (employeeSnapshot.data() as Data) : undefined;
  const employee = employeeData
    ? ({ id: employeeId, status: employeeData.status, roleId: employeeData.roleId } as LoadedTarget["employee"])
    : undefined;

  // Alle Memberships der Firma, die auf diesen Mitarbeiter zeigen.
  const membershipSnapshot = await tx.get(
    db
      .collection("userMemberships")
      .where("companyId", "==", companyId)
      .where("employeeId", "==", employeeId)
  );
  const memberships = membershipSnapshot.docs.map((doc) =>
    withIsoDates({ uid: doc.id, ...(doc.data() as Data) } as unknown as UserMembership)
  );
  const membershipRef = memberships.length === 1 ? membershipSnapshot.docs[0].ref : undefined;

  // Aktive Administratoren der Firma (für den Letzter-Administrator-Schutz).
  const adminSnapshot = await tx.get(
    db
      .collection("userMemberships")
      .where("companyId", "==", companyId)
      .where("roleId", "==", ADMIN_ROLE_ID)
      .where("status", "==", "Aktiv")
  );
  const activeAdminUids = adminSnapshot.docs.map((doc) => doc.id);

  const only = memberships.length === 1 ? memberships[0] : undefined;
  const membershipRole = only ? await readRole(tx, db, companyId, only.roleId) : undefined;
  const employeeRole = employee ? await readRole(tx, db, companyId, employee.roleId) : undefined;

  return {
    employeeRef,
    employeeData,
    employee,
    memberships,
    membershipRef,
    roles: { membershipRole, employeeRole },
    activeAdminUids,
  };
}

function nextEmployee(
  employeeId: string,
  data: Data,
  patch: Data,
  historyMessage: string,
  now: Date
): { update: Data; employee: Employee } {
  const history = Array.isArray(data.history) ? (data.history as Employee["history"]) : [];
  const update: Data = {
    ...patch,
    history: [...history, buildEmployeeHistoryEntry(historyMessage, now)],
  };
  const employee = withIsoDates({ ...data, ...update, id: employeeId }) as unknown as Employee;
  return { update, employee };
}

// Rolle ändern: employees/{id}.roleId/.role und userMemberships/{uid}.roleId/.role
// (+ updatedAt) atomar.
export async function assignRole(
  db: Firestore,
  actorUid: string,
  request: AssignRoleRequest,
  now: Date = new Date()
): Promise<MemberActionResult> {
  if (!isSafeDocumentId(request.employeeId) || !isSafeDocumentId(request.roleId)) {
    throw new MemberActionError("invalid-request");
  }
  return db.runTransaction(async (tx) => {
    const actorInput = await loadActor(tx, db, actorUid);
    const companyId = (actorInput.membership as UserMembership).companyId;

    const target = await loadTarget(tx, db, companyId, request.employeeId);
    const newRole = await readRole(tx, db, companyId, request.roleId);

    const plan = planAssignRole({
      actor: actorInput,
      request,
      target: { employeeId: request.employeeId, employee: target.employee, memberships: target.memberships },
      roles: target.roles,
      newRole,
      activeAdminUids: target.activeAdminUids,
    });

    const updatedAt = now.toISOString();
    const { update, employee } = nextEmployee(
      plan.employeeId,
      target.employeeData as Data,
      { roleId: plan.roleId, role: plan.roleName, updatedAt },
      employeeHistoryMessages.roleChanged(plan.roleName),
      now
    );
    const membershipPatch = { roleId: plan.roleId, role: plan.roleName, updatedAt };

    tx.update(target.employeeRef, update);
    tx.update(target.membershipRef as DocumentReference, membershipPatch);

    const membership = target.memberships[0];
    return { employee, membership: { roleId: plan.roleId, role: plan.roleName, status: membership.status } };
  });
}

// Status ändern (sperren, reaktivieren, Zugriff entziehen): employees/{id}.status und
// userMemberships/{uid}.status (+ updatedAt) atomar.
export async function setMemberStatus(
  db: Firestore,
  actorUid: string,
  request: SetMemberStatusRequest,
  now: Date = new Date()
): Promise<MemberActionResult> {
  if (!isSafeDocumentId(request.employeeId)) throw new MemberActionError("invalid-request");
  return db.runTransaction(async (tx) => {
    const actorInput = await loadActor(tx, db, actorUid);
    const companyId = (actorInput.membership as UserMembership).companyId;

    const target = await loadTarget(tx, db, companyId, request.employeeId);

    const plan = planSetMemberStatus({
      actor: actorInput,
      request,
      target: { employeeId: request.employeeId, employee: target.employee, memberships: target.memberships },
      roles: target.roles,
      activeAdminUids: target.activeAdminUids,
    });

    const updatedAt = now.toISOString();
    const { update, employee } = nextEmployee(
      plan.employeeId,
      target.employeeData as Data,
      { status: plan.status, updatedAt },
      statusHistoryMessage(plan.status, request.reason),
      now
    );

    tx.update(target.employeeRef, update);
    tx.update(target.membershipRef as DocumentReference, { status: plan.status, updatedAt });

    const membership = target.memberships[0];
    return { employee, membership: { roleId: membership.roleId, role: membership.role, status: plan.status } };
  });
}
