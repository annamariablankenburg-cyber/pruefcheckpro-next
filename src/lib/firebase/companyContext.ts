// Zentrale, dokumentierte Auflösung der aktiven companyId für Firestore-Pfade
// (companies/{companyId}/...). Es gibt heute noch keinen React-Context, der
// die eingeloggte AppUser (inkl. companyId, siehe src/types/user.ts) global
// bereitstellt – ein solcher Context aufzubauen ist kein Teil dieses Sprints
// (keine neue Auth-Logik, kein Umbau des Login-Flows).
//
// Bis dieser Context existiert, wird eine fest dokumentierte Dev-Fallback-ID
// verwendet. Sobald ein echter User-/Auth-Context verfügbar ist, muss NUR
// resolveCompanyId() angepasst werden (z. B. um die companyId des
// eingeloggten AppUser zu übergeben) – alle Aufrufer (Services) bleiben
// unverändert.
export const DEMO_COMPANY_ID = "demo-company";

export function resolveCompanyId(explicitCompanyId?: string | null): string {
  return explicitCompanyId ?? DEMO_COMPANY_ID;
}
