// Development-Seed-Script für den Proben-Firestore-Slice. Schreibt die
// bestehenden Mock-Daten aus src/config/samples.ts nach
// companies/{companyId}/samples im lokalen Firestore-EMULATOR.
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: Dieses Skript verbindet sich fest verdrahtet mit dem lokalen
// Emulator (localhost:8080) und kann dadurch nie versehentlich gegen das
// echte Firebase-Projekt laufen, unabhängig davon, welche
// NEXT_PUBLIC_FIREBASE_*-Variablen gerade in .env.local stehen. Der Emulator
// benötigt keine echten Zugangsdaten, daher genügt ein Platzhalter-Projekt.
//
// Ausführen (siehe docs/firebase/sample-firestore-slice.md, Abschnitt
// "Seed"): npx tsx scripts/seedSamples.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Kein blindes Überschreiben: bereits vorhandene Dokumente (gleiche
// Probennummer/Dokument-ID) werden übersprungen, nicht überschrieben – siehe
// --force, um das für einzelne Läufe bewusst zu übersteuern.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { samples } from "../src/config/samples";
import { companyCollectionPaths } from "../src/lib/firebase/collections";
import { resolveCompanyId } from "../src/lib/firebase/companyContext";

const EMULATOR_HOST = "localhost";
const EMULATOR_PORT = 8080;
// Muss mit dem --project-Flag beim Start des Emulators übereinstimmen, siehe
// docs/firebase/sample-firestore-slice.md ("Seed").
const EMULATOR_PROJECT_ID = "demo-pruefcheckpro-emulator";

// Explizites Flag statt stillem Standardverhalten: ohne --force werden
// bestehende Dokumente übersprungen (idempotent), mit --force überschrieben
// (z. B. um nach einer Type-Änderung neu zu seeden).
const FORCE_OVERWRITE = process.argv.includes("--force");

const app = initializeApp({ projectId: EMULATOR_PROJECT_ID });
const db = getFirestore(app);
connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT);

async function seed() {
  const companyId = resolveCompanyId();
  const collectionPath = companyCollectionPaths.samples(companyId);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const sample of samples) {
    const ref = doc(db, collectionPath, sample.id);
    const existing = await getDoc(ref);
    if (existing.exists() && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    const { id, ...data } = sample;
    const now = new Date().toISOString();
    await setDoc(ref, { ...data, createdAt: now, updatedAt: now });
    if (existing.exists()) {
      overwritten += 1;
      console.log(`[seedSamples] Überschrieben (--force): ${id}`);
    } else {
      created += 1;
      console.log(`[seedSamples] Angelegt: ${id} (${sample.bezeichnung})`);
    }
  }

  console.log(
    `[seedSamples] ${collectionPath}: ${created} Probe(n) angelegt, ${overwritten} überschrieben, ${skipped} übersprungen (bereits vorhanden).`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedSamples] Fehlgeschlagen:", error);
    process.exit(1);
  });
