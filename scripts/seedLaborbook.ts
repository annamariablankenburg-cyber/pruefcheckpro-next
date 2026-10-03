// Development-Seed-Script für den Laborbuch-Firestore-Slice. Schreibt die
// bestehenden Mock-Einträge aus src/config/laborbook.ts nach
// companies/{companyId}/laborbook im lokalen Firestore-EMULATOR. Die Dokument-ID
// ist die bestehende Eintrags-ID; die Verknüpfungen (probeId, projectId,
// customerId, deviceId) bleiben erhalten.
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: fest verdrahteter Emulator (localhost:8080), Platzhalter-Projekt,
// keine Secrets, keine .env.local-Abhängigkeit.
//
// Ausführen (siehe docs/firebase/laborbook-firestore-slice.md, Abschnitt
// "Seed"): npx tsx scripts/seedLaborbook.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Idempotent: vorhandene Dokumente werden übersprungen. --force überschreibt.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { laborbookEntries } from "../src/config/laborbook";
import { companyCollectionPaths } from "../src/lib/firebase/collections";
import { resolveCompanyId } from "../src/lib/firebase/companyContext";
// Rein, ohne Firebase-App-Seiteneffekte. Die Mock-Einträge enthalten optionale
// Felder, die als `undefined` gesetzt sind (z. B. fachbereich, projectId, wenn
// die Probe keinen Projektbezug hat). setDoc() lehnt solche Werte ab.
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
  const collectionPath = companyCollectionPaths.laborbook(companyId);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const entry of laborbookEntries) {
    const ref = doc(db, collectionPath, entry.id);
    const existing = await getDoc(ref);
    if (existing.exists() && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    // id nie als Datenfeld schreiben – die Dokument-ID trägt sie.
    const { id, ...data } = entry;
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({ ...data, createdAt: now, updatedAt: now });
    await setDoc(ref, payload);
    if (existing.exists()) {
      overwritten += 1;
      console.log(`[seedLaborbook] Überschrieben (--force): ${id}`);
    } else {
      created += 1;
      console.log(`[seedLaborbook] Angelegt: ${id} (${entry.titel})`);
    }
  }

  console.log(
    `[seedLaborbook] ${collectionPath}: ${created} Eintrag/Einträge angelegt, ${overwritten} überschrieben, ${skipped} übersprungen (bereits vorhanden).`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedLaborbook] Fehlgeschlagen:", error);
    process.exit(1);
  });
