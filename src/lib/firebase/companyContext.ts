// NUR für Emulator-Seed-Skripte (scripts/seed*.ts) und die Dokumentation.
//
// Die App selbst (Service-Facades) nutzt diese Datei NICHT mehr: im
// Firestore-Modus kommt die companyId ausschließlich aus dem Membership-
// Dokument des eingeloggten Users (userMemberships/{uid}, siehe
// src/lib/firebase/activeCompany.ts und docs/firebase/security-foundations.md);
// im Mock-Modus gibt es keine Firestore-Zugriffe und damit keine companyId.
//
// Die Seed-Skripte laufen ohne Login gegen den lokalen Emulator und brauchen
// eine feste Demo-Firma. Bewusst ohne Auth-/Firebase-Imports, damit sie in
// Skripten ohne App-Initialisierung nutzbar bleibt.
export const DEMO_COMPANY_ID = "demo-company";

export function resolveCompanyId(explicitCompanyId?: string | null): string {
  return explicitCompanyId ?? DEMO_COMPANY_ID;
}
