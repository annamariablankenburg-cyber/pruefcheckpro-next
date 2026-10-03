import type { Invitation } from "@/types/invitation";

// Eingabe für Neuanlagen. Status ("Ausstehend") sowie createdAt/updatedAt setzt
// der Service; die id vergibt die jeweilige Implementierung.
export type NewInvitationInput = Omit<
  Invitation,
  "id" | "status" | "createdAt" | "updatedAt" | "revokedAt" | "acceptedAt"
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
