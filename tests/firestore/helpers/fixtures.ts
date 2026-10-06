import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

import { COLLECTIONS, companyCollectionPaths } from "../../../src/lib/firebase/collections";
import { seed } from "./testEnv";

export const COMPANY_A = "company-a";
export const COMPANY_B = "company-b";

// Test-User. Die Namen beschreiben den Zustand der Membership.
export const USERS = {
  activeA: "user-active-a", // Membership: company-a, Aktiv
  activeB: "user-active-b", // Membership: company-b, Aktiv
  blockedA: "user-blocked-a", // Membership: company-a, Gesperrt
  noMembership: "user-no-membership", // authentifiziert, aber ohne Membership-Dokument
} as const;

// Die 12 Company-Collections mit eigenem match-Block in firestore.rules. Die
// Schlüssel müssen in companyCollectionPaths (src/lib/firebase/collections.ts)
// existieren – dort stehen die echten Pfadnamen (z. B. testValues, laborbook).
export const COMPANY_COLLECTIONS = [
  "customers",
  "projects",
  "devices",
  "samples",
  "testValues",
  "reports",
  "calendarEvents",
  "laborbook",
  "locations",
  "employees",
  "invitations",
  "roles",
] as const satisfies readonly (keyof typeof companyCollectionPaths)[];

export type CompanyCollection = (typeof COMPANY_COLLECTIONS)[number];

export function collectionPath(collection: CompanyCollection, companyId: string): string {
  return companyCollectionPaths[collection](companyId);
}

// Dokument-ID, die in jeder Collection beider Firmen vorab existiert.
export const EXISTING_DOC_ID = "existing";

export function membershipData(companyId: string, status: string) {
  return {
    companyId,
    employeeId: "emp-test",
    roleId: "pruefer",
    role: "Prüfer",
    status,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

export async function seedMembership(env: RulesTestEnvironment, uid: string, data: Record<string, unknown>) {
  await seed(env, async (firestore) => {
    await setDoc(doc(firestore, COLLECTIONS.USER_MEMBERSHIPS, uid), data);
  });
}

// Standard-Welt: drei Memberships (activeA, activeB, blockedA; noMembership hat
// absichtlich keine) und in beiden Firmen je ein bestehendes Dokument in jeder
// der 12 Collections.
export async function seedWorld(env: RulesTestEnvironment) {
  await seed(env, async (firestore) => {
    await setDoc(doc(firestore, COLLECTIONS.USER_MEMBERSHIPS, USERS.activeA), membershipData(COMPANY_A, "Aktiv"));
    await setDoc(doc(firestore, COLLECTIONS.USER_MEMBERSHIPS, USERS.activeB), membershipData(COMPANY_B, "Aktiv"));
    await setDoc(doc(firestore, COLLECTIONS.USER_MEMBERSHIPS, USERS.blockedA), membershipData(COMPANY_A, "Gesperrt"));

    for (const companyId of [COMPANY_A, COMPANY_B]) {
      for (const collection of COMPANY_COLLECTIONS) {
        await setDoc(doc(firestore, collectionPath(collection, companyId), EXISTING_DOC_ID), {
          name: `${collection}-${companyId}`,
        });
      }
    }
  });
}
