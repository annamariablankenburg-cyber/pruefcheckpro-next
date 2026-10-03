import { INVITATION_DEMO_TODAY } from "@/config/invitations";
import { isFirestoreDataSource } from "@/config/dataSource";
import { parseDateDE } from "@/lib/calendar/calendarDates";
import { resolveCompanyId } from "@/lib/firebase/companyContext";
import { firestoreInvitationService } from "@/lib/firebase/services/firestoreInvitationService";
import {
  assertInvitationAllowed,
  InvitationRuleError,
  isInvitationRevocable,
} from "@/lib/invitations/invitationRules";
import type { IInvitationService } from "@/lib/interfaces/IInvitationService";
import { invitationRepository } from "@/lib/repositories/invitationRepository";
import { employeeService } from "@/lib/services/employeeService";
import type { Invitation } from "@/types/invitation";

// Facade: branch je Methode anhand von NEXT_PUBLIC_DATA_SOURCE zwischen dem
// In-Memory-Repository (Mock) und dem Firestore-Service. Die Regeln gelten für
// beide Quellen gleich. Es wird nichts versendet und kein Account angelegt.
function generateMockInvitationId(): string {
  return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// "Jetzt" für Regelprüfungen: Firestore = echte Zeit, Mock = Demo-Datum der
// Mockdaten (damit die Mock-Einladungen konsistent als ausstehend/abgelaufen
// erscheinen).
function currentNow(): Date {
  if (isFirestoreDataSource) return new Date();
  const demo = parseDateDE(INVITATION_DEMO_TODAY);
  demo.setHours(12, 0, 0, 0);
  return demo;
}

async function loadAll(): Promise<Invitation[]> {
  if (isFirestoreDataSource) {
    return firestoreInvitationService.getInvitations(resolveCompanyId());
  }
  return invitationRepository.getAll();
}

async function loadById(id: string): Promise<Invitation | undefined> {
  if (isFirestoreDataSource) {
    return firestoreInvitationService.getInvitationById(resolveCompanyId(), id);
  }
  return invitationRepository.getById(id);
}

export const invitationService: IInvitationService = {
  async getInvitations() {
    return loadAll();
  },

  async getInvitationById(id) {
    return loadById(id);
  },

  async createInvitation(input) {
    // Mitarbeiter-E-Mails kommen über denselben employeeService wie in der
    // Mitarbeiterverwaltung (keine zweite Quelle). Bewusst ein einfacher
    // Prüfschritt vor dem Schreiben, nicht atomar (siehe Doku).
    const [existing, employees] = await Promise.all([loadAll(), employeeService.getEmployees()]);
    assertInvitationAllowed({
      email: input.email,
      invitations: existing,
      employeeEmails: employees.map((employee) => employee.email),
      now: currentNow(),
    });

    if (isFirestoreDataSource) {
      return firestoreInvitationService.createInvitation(resolveCompanyId(), input);
    }
    const now = currentNow().toISOString();
    const invitation: Invitation = {
      ...input,
      id: generateMockInvitationId(),
      status: "Ausstehend",
      createdAt: now,
      updatedAt: now,
    };
    return invitationRepository.create(invitation);
  },

  async revokeInvitation(id) {
    const current = await loadById(id);
    if (!current) return undefined;
    if (!isInvitationRevocable(current, currentNow())) {
      throw new InvitationRuleError(
        "Nur ausstehende, nicht abgelaufene Einladungen können widerrufen werden."
      );
    }

    if (isFirestoreDataSource) {
      return firestoreInvitationService.revokeInvitation(resolveCompanyId(), id);
    }
    const now = currentNow().toISOString();
    return invitationRepository.update(id, { status: "Widerrufen", revokedAt: now, updatedAt: now });
  },
};
