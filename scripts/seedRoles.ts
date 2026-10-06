// Development-Seed-Script für den Rollen-Firestore-Slice. Schreibt die
// bestehenden Rollen aus src/config/roles.ts (5 Systemrollen + die 2 bereits
// vorhandenen benutzerdefinierten Beispielrollen) nach
// companies/{companyId}/roles im lokalen Firestore-EMULATOR. Die Dokument-ID
// ist die stabile Rollen-ID (admin, laborleiter, pruefer, azubi, gast, …).
// Es werden keine zusätzlichen Rollen erfunden.
//
// Nur Verwaltungsdaten: keine Custom Claims, kein Admin SDK, keine
// Rules-Auswertung.
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: fest verdrahteter Emulator (localhost:8080), Platzhalter-Projekt,
// keine Secrets, keine .env.local-Abhängigkeit.
//
// Ausführen (siehe docs/firebase/role-firestore-slice.md, Abschnitt "Seed"):
//   npx tsx scripts/seedRoles.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Idempotent: vorhandene Dokumente werden übersprungen. --force überschreibt.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { roles } from "../src/config/roles";
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
  const collectionPath = companyCollectionPaths.roles(companyId);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const role of roles) {
    const ref = doc(db, collectionPath, role.id);
    const existing = await getDoc(ref);
    if (existing.exists() && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    // id nie als Datenfeld schreiben – die Dokument-ID trägt sie. Die
    // permissions-Map enthält Schlüssel mit Punkt ("proben.ansehen"); das ist
    // als Map-Schlüssel in Firestore zulässig.
    const { id, ...data } = role;
    await setDoc(ref, sanitizeForFirestore(data));
    if (existing.exists()) {
      overwritten += 1;
      console.log(`[seedRoles] Überschrieben (--force): ${id}`);
    } else {
      created += 1;
      console.log(`[seedRoles] Angelegt: ${id} (${role.name}, ${role.type})`);
    }
  }

  console.log(
    `[seedRoles] ${collectionPath}: ${created} Rolle(n) angelegt, ${overwritten} überschrieben, ${skipped} übersprungen (bereits vorhanden).`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedRoles] Fehlgeschlagen:", error);
    process.exit(1);
  });
