import type { Invitation } from "@/types/invitation";

// Eingabe für Neuanlagen. Status ("Ausstehend") sowie createdAt/updatedAt setzt
// der Service; die id vergibt die jeweilige Implementierung. acceptedAt, acceptedByUid und
// employeeId setzt ausschließlich die serverseitige Einladungsannahme (Admin SDK) – sie sind
// nie Teil eines Client-Inputs (die Rules verbieten sie beim Anlegen zusätzlich).
export type NewInvitationInput = Omit<
  Invitation,
  "id" | "status" | "createdAt" | "updatedAt" | "revokedAt" | "acceptedAt" | "acceptedByUid" | "employeeId"
>;

// Promise-basiert. Eine Einladung ist ein reiner Metadatensatz: kein
// E-Mail-Versand, kein Auth-Account, kein Annahmeflow. Bewusst KEIN Delete und
// KEIN "als angenommen markieren". Die Regeln (Duplikate, Widerruf nur bei
// ausstehenden Einladungen) prüft die Facade für Mock und Firestore gleich und
// wirft einen InvitationRuleError.
export interface IInvitationService {
  getInvitations(): Promise<Invitation[]>;
  getInvitationById(id: string): Promise<Invitation | undefined>;
  createInvitation(input: NewInvitationInput): Promise<Invitation>;
  revokeInvitation(id: string): Promise<Invitation | undefined>;
}
