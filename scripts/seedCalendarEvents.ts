// Development-Seed-Script für den Smart-Kalender-Firestore-Slice. Schreibt die
// heute im Mock-Modus gültige Terminliste aus src/config/calendarEvents.ts
// (eigenständige Termine PLUS die einmalig aus den Mock-Proben abgeleiteten
// Termine) als echte Dokumente nach companies/{companyId}/calendarEvents im
// lokalen Firestore-EMULATOR. Danach stammen Kalendertermine im Firestore-
// Modus ausschließlich aus dieser Collection.
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: fest verdrahteter Emulator (localhost:8080), ein Platzhalter-
// Projekt, keine Secrets.
//
// Ausführen (siehe docs/firebase/calendar-firestore-slice.md, Abschnitt
// "Seed"): npx tsx scripts/seedCalendarEvents.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Kein blindes Überschreiben: bereits vorhandene Dokumente (gleiche
// Termin-ID) werden übersprungen – siehe --force.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { calendarEvents } from "../src/config/calendarEvents";
import { companyCollectionPaths } from "../src/lib/firebase/collections";
import { resolveCompanyId } from "../src/lib/firebase/companyContext";
// Rein, ohne Firebase-App-Seiteneffekte. Abgeleitete Termine können optionale
// Felder wie projectId als `undefined` enthalten (Probe ohne Projektbezug);
// setDoc() lehnt solche Werte ab, daher vorher sanitizen.
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
  const collectionPath = companyCollectionPaths.calendarEvents(companyId);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const event of calendarEvents) {
    const ref = doc(db, collectionPath, event.id);
    const existing = await getDoc(ref);
    if (existing.exists() && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    // id nie als Datenfeld schreiben – die Dokument-ID trägt sie.
    const { id, ...data } = event;
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({ ...data, createdAt: now, updatedAt: now });
    await setDoc(ref, payload);
    if (existing.exists()) {
      overwritten += 1;
      console.log(`[seedCalendarEvents] Überschrieben (--force): ${id}`);
    } else {
      created += 1;
      console.log(`[seedCalendarEvents] Angelegt: ${id} (${event.title})`);
    }
  }

  console.log(
    `[seedCalendarEvents] ${collectionPath}: ${created} Termin(e) angelegt, ${overwritten} überschrieben, ${skipped} übersprungen (bereits vorhanden).`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedCalendarEvents] Fehlgeschlagen:", error);
    process.exit(1);
  });
