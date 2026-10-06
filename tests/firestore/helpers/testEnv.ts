import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import type { Firestore } from "firebase/firestore";

// Test-Projekt für die Rules-Tests. Das Präfix "demo-" ist die offizielle
// Firebase-Konvention für Projekte, die NIE mit echten Firebase-Diensten
// sprechen (nur Emulator, keine Credentials nötig). Es ist dieselbe Namens-
// konvention wie bei den Seed-Skripten (demo-pruefcheckpro-emulator).
export const TEST_PROJECT_ID = "demo-pruefcheckpro-rules-test";

// Die Rules werden direkt aus der echten Datei geladen – getestet wird exakt
// das, was deployt würde, keine Kopie.
export const RULES_PATH = resolve(process.cwd(), "firestore.rules");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

// Sicherheitsnetz: Die Tests laufen ausschließlich gegen einen LOKALEN
// Firestore-Emulator. `firebase emulators:exec` setzt FIRESTORE_EMULATOR_HOST;
// fehlt sie oder zeigt sie nicht auf diesen Rechner, brechen die Tests ab, bevor
// irgendeine Verbindung aufgebaut wird.
export function assertLocalEmulator(): { host: string; port: number } {
  const value = process.env.FIRESTORE_EMULATOR_HOST;
  if (!value) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST ist nicht gesetzt. Die Rules-Tests laufen nur gegen den lokalen Emulator: `npm run test:rules` verwenden (startet den Emulator über `firebase emulators:exec`)."
    );
  }
  const separator = value.lastIndexOf(":");
  const host = separator === -1 ? value : value.slice(0, separator);
  const port = Number(separator === -1 ? NaN : value.slice(separator + 1));
  if (!LOCAL_HOSTS.has(host) || !Number.isInteger(port)) {
    throw new Error(`FIRESTORE_EMULATOR_HOST="${value}" ist kein lokaler Emulator. Abbruch.`);
  }
  if (!TEST_PROJECT_ID.startsWith("demo-")) {
    throw new Error("Die Test-Projekt-ID muss mit \"demo-\" beginnen.");
  }
  return { host: host.replace(/^\[|\]$/g, ""), port };
}

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  const { host, port } = assertLocalEmulator();
  return initializeTestEnvironment({
    projectId: TEST_PROJECT_ID,
    firestore: { rules: readFileSync(RULES_PATH, "utf8"), host, port },
  });
}

// Die Kontexte liefern eine Compat-Firestore-Instanz. Die modularen Funktionen
// (doc, getDoc, setDoc, …) akzeptieren sie zur Laufzeit; für TypeScript genügt
// ein Cast auf den modularen Typ (siehe Doku von @firebase/rules-unit-testing).
export function db(context: RulesTestContext): Firestore {
  return context.firestore() as unknown as Firestore;
}

// Test-Daten werden mit DEAKTIVIERTEN Rules geschrieben (Setup), die eigentlichen
// Assertions laufen mit authentifiziertem bzw. unauthentifiziertem Kontext.
export async function seed(env: RulesTestEnvironment, write: (firestore: Firestore) => Promise<void>): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    await write(db(context));
  });
}

export function asUser(env: RulesTestEnvironment, uid: string): Firestore {
  return db(env.authenticatedContext(uid));
}

export function asAnonymous(env: RulesTestEnvironment): Firestore {
  return db(env.unauthenticatedContext());
}
