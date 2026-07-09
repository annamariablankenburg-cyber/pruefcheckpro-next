// Zentrale Collection-Namen. Nirgends sonst im Code sollen Collection-Strings
// hartkodiert werden – siehe docs/database/firestore-model.md für das
// vollständige Datenmodell (Multi-Tenant unter companies/{companyId}).
export const COLLECTIONS = {
  USERS: "users",
  COMPANIES: "companies",
  LOCATIONS: "locations",
  EMPLOYEES: "employees",
  INVITATIONS: "invitations",
  ROLES: "roles",
  CUSTOMERS: "customers",
  PROJECTS: "projects",
  DEVICES: "devices",
  SAMPLES: "samples",
  TEST_VALUES: "testValues",
  CALENDAR_EVENTS: "calendarEvents",
  LABORBOOK: "laborbook",
  REPORTS: "reports",
  INTEGRATIONS: "integrations",
  WEBHOOKS: "webhooks",
  AUDIT_LOG: "auditLog",
  AI_CHATS: "aiChats",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

// Pfad-Helfer für die firmengebundenen Subcollections unter
// companies/{companyId}/... . Vermeiden manuell zusammengesetzte Pfad-Strings
// an den Call-Sites, sobald echte Firestore-Aufrufe hinzukommen.
export function companyDocPath(companyId: string): string {
  return `${COLLECTIONS.COMPANIES}/${companyId}`;
}

function companySubcollectionPath(companyId: string, collection: string): string {
  return `${companyDocPath(companyId)}/${collection}`;
}

export const companyCollectionPaths = {
  locations: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.LOCATIONS),
  employees: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.EMPLOYEES),
  invitations: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.INVITATIONS),
  roles: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.ROLES),
  customers: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.CUSTOMERS),
  projects: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.PROJECTS),
  devices: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.DEVICES),
  samples: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.SAMPLES),
  testValues: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.TEST_VALUES),
  calendarEvents: (companyId: string) =>
    companySubcollectionPath(companyId, COLLECTIONS.CALENDAR_EVENTS),
  laborbook: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.LABORBOOK),
  reports: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.REPORTS),
  integrations: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.INTEGRATIONS),
  webhooks: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.WEBHOOKS),
  auditLog: (companyId: string) => companySubcollectionPath(companyId, COLLECTIONS.AUDIT_LOG),
};

// users/{uid}/aiChats/{chatId} – persönlich, nicht firmengebunden (siehe
// firestore-model.md Abschnitt 4).
export function userAiChatsPath(uid: string): string {
  return `${COLLECTIONS.USERS}/${uid}/${COLLECTIONS.AI_CHATS}`;
}
