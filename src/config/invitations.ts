import type { Invitation } from "@/types/invitation";

// Mock-Daten für die Einladungsverwaltung (Tab "Einladungen" in /company).
// Reine Metadaten: keine echten Einladungs-E-Mails, keine Auth-Accounts.
//
// "Heute" der Mockdaten (passend zu den übrigen Demo-Daten). Nur im Mock-Modus
// maßgeblich; im Firestore-Modus gilt das echte Datum.
export const INVITATION_DEMO_TODAY = "03.03.2026";

// Der Ablauf wird aus expiresAt abgeleitet: inv-miriam ist "Ausstehend" mit
// Ablaufdatum in der Vergangenheit und erscheint daher als "Abgelaufen".
export const invitations: Invitation[] = [
  {
    id: "inv-eva",
    name: "Eva König",
    email: "eva@musterlabor.de",
    role: "Gast",
    roleId: "gast",
    location: "Baustellenbüro Nord",
    status: "Ausstehend",
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-01T09:00:00.000Z",
    expiresAt: "2026-03-15T12:00:00.000Z",
    activateImmediately: false,
  },
  {
    id: "inv-sophie",
    name: "Sophie Bauer",
    email: "sophie@musterlabor.de",
    role: "Prüfer",
    roleId: "pruefer",
    location: "Labor Stuttgart",
    status: "Ausstehend",
    createdAt: "2026-02-28T09:00:00.000Z",
    updatedAt: "2026-02-28T09:00:00.000Z",
    expiresAt: "2026-03-14T12:00:00.000Z",
    message: "Willkommen im Team! Du übernimmst die Betonprüfungen am Standort Stuttgart.",
    activateImmediately: true,
  },
  {
    id: "inv-jan",
    name: "Jan Weber",
    email: "jan@musterlabor.de",
    role: "Azubi",
    roleId: "azubi",
    location: "Labor Remseck",
    status: "Angenommen",
    createdAt: "2026-02-20T09:00:00.000Z",
    updatedAt: "2026-02-22T09:00:00.000Z",
    acceptedAt: "2026-02-22T09:00:00.000Z",
    expiresAt: "2026-03-06T12:00:00.000Z",
    activateImmediately: false,
  },
  {
    id: "inv-miriam",
    name: "Miriam Koch",
    email: "miriam@musterlabor.de",
    role: "Laborleiter",
    roleId: "laborleiter",
    location: "Labor München",
    status: "Ausstehend",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
    expiresAt: "2026-01-24T12:00:00.000Z",
    activateImmediately: false,
  },
  {
    id: "inv-felix",
    name: "Felix Braun",
    email: "felix@musterlabor.de",
    role: "Prüfer",
    roleId: "pruefer",
    location: "Labor Stuttgart",
    status: "Widerrufen",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-17T09:00:00.000Z",
    revokedAt: "2026-01-17T09:00:00.000Z",
    expiresAt: "2026-01-29T12:00:00.000Z",
    activateImmediately: false,
  },
];
