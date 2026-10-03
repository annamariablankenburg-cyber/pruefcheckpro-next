// Development-Seed-Script für den Berichte-Firestore-Slice. Schreibt die
// bestehenden Mock-Daten aus src/config/reports.ts nach
// companies/{companyId}/reports im lokalen Firestore-EMULATOR.
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: Dieses Skript verbindet sich fest verdrahtet mit dem lokalen
// Emulator (localhost:8080) und kann dadurch nie versehentlich gegen das
// echte Firebase-Projekt laufen, unabhängig davon, welche
// NEXT_PUBLIC_FIREBASE_*-Variablen gerade in .env.local stehen. Der Emulator
// benötigt keine echten Zugangsdaten, daher genügt ein Platzhalter-Projekt.
//
// Ausführen (siehe docs/firebase/report-firestore-slice.md, Abschnitt
// "Seed"): npx tsx scripts/seedReports.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Kein blindes Überschreiben: bereits vorhandene Dokumente (gleiche
// Berichts-ID/Dokument-ID) werden übersprungen, nicht überschrieben – siehe
// --force, um das für einzelne Läufe bewusst zu übersteuern.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { reports } from "../src/config/reports";
import { companyCollectionPaths } from "../src/lib/firebase/collections";
import { resolveCompanyId } from "../src/lib/firebase/companyContext";
// Rein, ohne Firebase-App-Seiteneffekte (siehe firestoreSanitize.ts) –
// gefahrlos neben dem emulator-only App-Setup unten importierbar.
// config/reports.ts setzt bei Berichten ohne E-Mail-Historie Felder wie
// emailSentTo/emailSentAt/… explizit auf `undefined` statt sie wegzulassen
// (siehe reports.ts, emailOverrides) – ohne Sanitization würde setDoc()
// daran scheitern.
import { sanitizeForFirestore } from "../src/lib/firebase/firestoreSanitize";

const EMULATOR_HOST = "localhost";
const EMULATOR_PORT = 8080;
// Muss mit dem --project-Flag beim Start des Emulators übereinstimmen, siehe
// docs/firebase/report-firestore-slice.md ("Seed").
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
  const collectionPath = companyCollectionPaths.reports(companyId);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const report of reports) {
    const ref = doc(db, collectionPath, report.id);
    const existing = await getDoc(ref);
    if (existing.exists() && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    const { id, ...data } = report;
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({ ...data, createdAt: now, updatedAt: now });
    await setDoc(ref, payload);
    if (existing.exists()) {
      overwritten += 1;
      console.log(`[seedReports] Überschrieben (--force): ${id}`);
    } else {
      created += 1;
      console.log(`[seedReports] Angelegt: ${id} (${report.titel})`);
    }
  }

  console.log(
    `[seedReports] ${collectionPath}: ${created} Bericht(e) angelegt, ${overwritten} überschrieben, ${skipped} übersprungen (bereits vorhanden).`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedReports] Fehlgeschlagen:", error);
    process.exit(1);
  });
