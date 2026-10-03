// Development-Seed-Script für den Mitarbeiter-Firestore-Slice. Schreibt die
// bestehenden Mock-Mitarbeiter aus src/config/employees.ts nach
// companies/{companyId}/employees im lokalen Firestore-EMULATOR. Die
// Dokument-ID ist die bestehende Mitarbeiter-ID.
//
// Nur fachliche Mitarbeiterdaten (Metadaten): es werden KEINE Firebase-Auth-
// Benutzer angelegt.
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: fest verdrahteter Emulator (localhost:8080), Platzhalter-Projekt,
// keine Secrets, keine .env.local-Abhängigkeit.
//
// Ausführen (siehe docs/firebase/employee-firestore-slice.md, Abschnitt
// "Seed"): npx tsx scripts/seedEmployees.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Idempotent: vorhandene Dokumente werden übersprungen. --force überschreibt.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { employees } from "../src/config/employees";
import { companyLocationDetails } from "../src/config/locations";
import { companyCollectionPaths } from "../src/lib/firebase/collections";
import { resolveCompanyId } from "../src/lib/firebase/companyContext";
// Rein, ohne Firebase-App-Seiteneffekte; entfernt `undefined` (z. B. phone,
// joinedAt), setDoc() lehnt solche Werte ab.
import { sanitizeForFirestore } from "../src/lib/firebase/firestoreSanitize";

const EMULATOR_HOST = "localhost";
const EMULATOR_PORT = 8080;
// Muss mit dem --project-Flag beim Start des Emulators übereinstimmen.
const EMULATOR_PROJECT_ID = "demo-pruefcheckpro-emulator";

const FORCE_OVERWRITE = process.argv.includes("--force");

const app = initializeApp({ projectId: EMULATOR_PROJECT_ID });
const db = getFirestore(app);
connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT);

// locationId nur setzen, wenn der Standortname EXAKT EINEN Standort der
// Standort-Stammdaten trifft. Bei keinem oder mehreren Treffern bleibt es beim
// Legacy-Namen in `location` – es wird nicht geraten.
function resolveLocationId(locationName: string): string | undefined {
  const matches = companyLocationDetails.filter((location) => location.name === locationName);
  return matches.length === 1 ? matches[0].id : undefined;
}

async function seed() {
  const companyId = resolveCompanyId();
  const collectionPath = companyCollectionPaths.employees(companyId);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;
  let withoutLocationId = 0;

  for (const employee of employees) {
    const ref = doc(db, collectionPath, employee.id);
    const existing = await getDoc(ref);
    if (existing.exists() && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    // id nie als Datenfeld schreiben – die Dokument-ID trägt sie.
    const { id, ...data } = employee;
    const locationId = resolveLocationId(employee.location);
    if (!locationId) {
      withoutLocationId += 1;
      console.warn(`[seedEmployees] Kein eindeutiger Standort für „${employee.location}“ (${id}) – locationId entfällt.`);
    }
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      ...data,
      ...(locationId ? { locationId } : {}),
      createdAt: now,
      updatedAt: now,
    });
    await setDoc(ref, payload);
    if (existing.exists()) {
      overwritten += 1;
      console.log(`[seedEmployees] Überschrieben (--force): ${id}`);
    } else {
      created += 1;
      console.log(`[seedEmployees] Angelegt: ${id} (${employee.name}${locationId ? `, ${locationId}` : ""})`);
    }
  }

  console.log(
    `[seedEmployees] ${collectionPath}: ${created} Mitarbeiter angelegt, ${overwritten} überschrieben, ${skipped} übersprungen (bereits vorhanden), ${withoutLocationId} ohne eindeutige locationId.`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedEmployees] Fehlgeschlagen:", error);
    process.exit(1);
  });
