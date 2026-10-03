// Development-Seed-Script für den Einladungen-Firestore-Slice. Schreibt die
// bestehenden Mock-Einladungen aus src/config/invitations.ts nach
// companies/{companyId}/invitations im lokalen Firestore-EMULATOR. Die
// Dokument-ID ist die bestehende Einladungs-ID (stabil/deterministisch).
//
// Nur Metadaten: es werden KEINE E-Mails versendet und KEINE Auth-Benutzer
// angelegt; die Dokumente enthalten weder Token noch Link.
//
// Zeitangaben: Die Mockdaten sind auf den 03.03.2026 datiert. Im Firestore-
// Modus gilt aber das echte Datum, daher werden die Zeitstempel hier relativ
// zum Seed-Zeitpunkt gesetzt, sodass die Beispiele ihren Charakter behalten:
//   - inv-eva, inv-sophie: ausstehend, laufen in der Zukunft ab
//   - inv-jan:             angenommen (nur über Seed – es gibt keine Annahme-UI)
//   - inv-miriam:          "Ausstehend", aber expiresAt in der Vergangenheit
//                          => wird als "Abgelaufen" angezeigt (abgeleitet)
//   - inv-felix:           widerrufen
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: fest verdrahteter Emulator (localhost:8080), Platzhalter-Projekt,
// keine Secrets, keine .env.local-Abhängigkeit.
//
// Ausführen (siehe docs/firebase/invitation-firestore-slice.md, Abschnitt
// "Seed"): npx tsx scripts/seedInvitations.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Idempotent: vorhandene Dokumente werden übersprungen. --force überschreibt.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { invitations } from "../src/config/invitations";
import { companyLocationDetails } from "../src/config/locations";
import { companyCollectionPaths } from "../src/lib/firebase/collections";
import { resolveCompanyId } from "../src/lib/firebase/companyContext";
// Rein, ohne Firebase-App-Seiteneffekte; entfernt `undefined` (z. B. message,
// acceptedAt), setDoc() lehnt solche Werte ab.
import { sanitizeForFirestore } from "../src/lib/firebase/firestoreSanitize";

const EMULATOR_HOST = "localhost";
const EMULATOR_PORT = 8080;
// Muss mit dem --project-Flag beim Start des Emulators übereinstimmen.
const EMULATOR_PROJECT_ID = "demo-pruefcheckpro-emulator";

const FORCE_OVERWRITE = process.argv.includes("--force");

const app = initializeApp({ projectId: EMULATOR_PROJECT_ID });
const db = getFirestore(app);
connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT);

const DAY_MS = 24 * 60 * 60 * 1000;
const seedTime = Date.now();
const daysFromNow = (days: number) => new Date(seedTime + days * DAY_MS).toISOString();

// Zeitfenster je Beispiel-Einladung (relativ zum Seed-Zeitpunkt).
const timing: Record<
  string,
  { createdAt: string; expiresAt: string; acceptedAt?: string; revokedAt?: string }
> = {
  "inv-eva": { createdAt: daysFromNow(-1), expiresAt: daysFromNow(13) },
  "inv-sophie": { createdAt: daysFromNow(-3), expiresAt: daysFromNow(11) },
  "inv-jan": {
    createdAt: daysFromNow(-12),
    acceptedAt: daysFromNow(-10),
    expiresAt: daysFromNow(2),
  },
  "inv-miriam": { createdAt: daysFromNow(-25), expiresAt: daysFromNow(-11) },
  "inv-felix": {
    createdAt: daysFromNow(-20),
    revokedAt: daysFromNow(-18),
    expiresAt: daysFromNow(-6),
  },
};

// locationId nur setzen, wenn der Standortname EXAKT EINEN Standort der
// Standort-Stammdaten trifft. Sonst bleibt es beim Legacy-Namen in `location`.
function resolveLocationId(locationName: string): string | undefined {
  const matches = companyLocationDetails.filter((location) => location.name === locationName);
  return matches.length === 1 ? matches[0].id : undefined;
}

async function seed() {
  const companyId = resolveCompanyId();
  const collectionPath = companyCollectionPaths.invitations(companyId);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const invitation of invitations) {
    const ref = doc(db, collectionPath, invitation.id);
    const existing = await getDoc(ref);
    if (existing.exists() && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    // id nie als Datenfeld schreiben – die Dokument-ID trägt sie.
    const { id, ...data } = invitation;
    const times = timing[id];
    if (!times) {
      console.warn(`[seedInvitations] Keine Zeitvorgabe für ${id} – Mock-Zeitstempel bleiben.`);
    }
    const locationId = resolveLocationId(invitation.location);
    const createdAt = times?.createdAt ?? data.createdAt;
    const payload = sanitizeForFirestore({
      ...data,
      ...(locationId ? { locationId } : {}),
      ...(times ?? {}),
      createdAt,
      updatedAt: times?.revokedAt ?? times?.acceptedAt ?? createdAt,
    });
    await setDoc(ref, payload);
    if (existing.exists()) {
      overwritten += 1;
      console.log(`[seedInvitations] Überschrieben (--force): ${id}`);
    } else {
      created += 1;
      console.log(`[seedInvitations] Angelegt: ${id} (${invitation.name}, ${invitation.status})`);
    }
  }

  console.log(
    `[seedInvitations] ${collectionPath}: ${created} Einladung(en) angelegt, ${overwritten} überschrieben, ${skipped} übersprungen (bereits vorhanden).`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedInvitations] Fehlgeschlagen:", error);
    process.exit(1);
  });
