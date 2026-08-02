// Development-Seed-Script für den Projekte-Firestore-Slice. Schreibt die
// bestehenden Mock-Daten aus src/config/projects.ts nach
// companies/{companyId}/projects im lokalen Firestore-EMULATOR.
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: Dieses Skript verbindet sich fest verdrahtet mit dem lokalen
// Emulator (localhost:8080) und kann dadurch nie versehentlich gegen das
// echte Firebase-Projekt laufen, unabhängig davon, welche
// NEXT_PUBLIC_FIREBASE_*-Variablen gerade in .env.local stehen. Der Emulator
// benötigt keine echten Zugangsdaten, daher genügt ein Platzhalter-Projekt.
//
// Ausführen (siehe docs/firebase/project-firestore-slice.md, Abschnitt
// "Seed"): npx tsx scripts/seedProjects.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Kein blindes Überschreiben: bereits vorhandene Dokumente (gleiche
// Projekt-ID) werden übersprungen, nicht überschrieben.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { projects } from "../src/config/projects";
import { companyCollectionPaths } from "../src/lib/firebase/collections";
import { resolveCompanyId } from "../src/lib/firebase/companyContext";

const EMULATOR_HOST = "localhost";
const EMULATOR_PORT = 8080;
// Muss mit dem --project-Flag beim Start des Emulators übereinstimmen, siehe
// docs/firebase/project-firestore-slice.md ("Seed").
const EMULATOR_PROJECT_ID = "demo-pruefcheckpro-emulator";

const app = initializeApp({ projectId: EMULATOR_PROJECT_ID });
const db = getFirestore(app);
connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT);

async function seed() {
  const companyId = resolveCompanyId();
  const collectionPath = companyCollectionPaths.projects(companyId);

  let created = 0;
  let skipped = 0;

  for (const project of projects) {
    const ref = doc(db, collectionPath, project.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      skipped += 1;
      continue;
    }

    const { id, ...data } = project;
    const now = new Date().toISOString();
    await setDoc(ref, { ...data, createdAt: now, updatedAt: now });
    created += 1;
    console.log(`[seedProjects] Angelegt: ${id} (${project.name})`);
  }

  console.log(
    `[seedProjects] ${collectionPath}: ${created} Projekt(e) angelegt, ${skipped} übersprungen (bereits vorhanden).`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedProjects] Fehlgeschlagen:", error);
    process.exit(1);
  });
