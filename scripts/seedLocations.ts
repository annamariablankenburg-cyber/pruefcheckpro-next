// Development-Seed-Script für den Standorte-Firestore-Slice. Schreibt die
// bestehenden Mock-Standorte aus src/config/locations.ts nach
// companies/{companyId}/locations im lokalen Firestore-EMULATOR. Die
// Dokument-ID ist die bestehende Standort-ID.
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: fest verdrahteter Emulator (localhost:8080), Platzhalter-Projekt,
// keine Secrets, keine .env.local-Abhängigkeit.
//
// Ausführen (siehe docs/firebase/location-firestore-slice.md, Abschnitt
// "Seed"): npx tsx scripts/seedLocations.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Idempotent: vorhandene Dokumente werden übersprungen. --force überschreibt.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { companyLocationDetails } from "../src/config/locations";
import { companyCollectionPaths } from "../src/lib/firebase/collections";
import { resolveCompanyId } from "../src/lib/firebase/companyContext";
// Rein, ohne Firebase-App-Seiteneffekte; entfernt `undefined`, setDoc() lehnt
// solche Werte ab.
import { sanitizeForFirestore } from "../src/lib/firebase/firestoreSanitize";

const EMULATOR_HOST = "localhost";
const EMULATOR_PORT = 8080;
// Muss mit dem --project-Flag beim Start des Emulators übereinstimmen.
const EMULATOR_PROJECT_ID = "demo-pruefcheckpro-emulator";

const FORCE_OVERWRITE = process.argv.includes("--force");

const app = initializeApp({ projectId: EMULATOR_PROJECT_ID });
const db = getFirestore(app);
connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT);

async function seed() {
  const companyId = resolveCompanyId();
  const collectionPath = companyCollectionPaths.locations(companyId);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const location of companyLocationDetails) {
    const ref = doc(db, collectionPath, location.id);
    const existing = await getDoc(ref);
    if (existing.exists() && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    // id nie als Datenfeld schreiben – die Dokument-ID trägt sie.
    const { id, ...data } = location;
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({ ...data, createdAt: now, updatedAt: now });
    await setDoc(ref, payload);
    if (existing.exists()) {
      overwritten += 1;
      console.log(`[seedLocations] Überschrieben (--force): ${id}`);
    } else {
      created += 1;
      console.log(`[seedLocations] Angelegt: ${id} (${location.name})`);
    }
  }

  console.log(
    `[seedLocations] ${collectionPath}: ${created} Standort(e) angelegt, ${overwritten} überschrieben, ${skipped} übersprungen (bereits vorhanden).`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedLocations] Fehlgeschlagen:", error);
    process.exit(1);
  });
