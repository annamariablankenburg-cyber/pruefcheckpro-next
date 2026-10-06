// Membership eines Firebase-Auth-Users: die einzige sicherheitsrelevante Quelle
// für die Firmenzuordnung (Dokument userMemberships/{uid}).
//
// Abgrenzung:
//  - users/{uid}                      = Login-Profil (AppUser), clientseitig
//                                       verwaltet. Dessen Felder (role,
//                                       companyId, plan …) sind Legacy-/Profil-
//                                       felder und werden NICHT für Autorisierung
//                                       oder Company-Zuordnung ausgewertet.
//  - userMemberships/{uid}            = diese Zuordnung (kein Client-Write).
//  - companies/{companyId}/employees  = fachliche Personaldaten; `employeeId`
//                                       verweist nur dorthin, nichts wird
//                                       dupliziert.
//
// Ein Membership-Dokument allein erzeugt KEINEN Firebase-Auth-Benutzer.
export type MembershipStatus = "Aktiv" | "Gesperrt";

export interface UserMembership {
  // Firestore: Dokument-ID (= Firebase-Auth-UID), nie als Datenfeld geschrieben.
  uid: string;
  companyId: string;
  // Optional für Legacy-/Dev-Daten. Verweis auf
  // companies/{companyId}/employees/{employeeId}.
  employeeId?: string;
  // Rolle als Verwaltungs-Metadatum (roleId + lesbarer Snapshot, analog zu
  // Employee/Invitation). Noch KEINE serverseitige Permission-Auswertung.
  roleId?: string;
  role?: string;
  status: MembershipStatus;
  createdAt?: string;
  updatedAt?: string;
}
