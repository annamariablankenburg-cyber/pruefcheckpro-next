// Development-Seed-Script für die Security Foundations. Schreibt Demo-
// Membership-Dokumente nach userMemberships/{uid} im lokalen Firestore-
// EMULATOR (siehe docs/firebase/security-foundations.md).
//
// WICHTIG – was das NICHT tut:
//  - Es erzeugt KEINE Firebase-Auth-Benutzer. Ein Membership-Dokument allein
//    erstellt keinen Account; die Demo-UIDs unten entsprechen keinem echten
//    Auth-Konto. Wer sich mit einer dieser UIDs anmelden will, muss im
//    Auth-Emulator selbst einen Benutzer mit dieser UID anlegen (nicht Teil
//    dieses Skripts, hier nicht getestet).
//  - Es nutzt kein Admin SDK und setzt keine Custom Claims.
//
// Inhalt (aus bestehender Config abgeleitet, keine erfundenen Rollen):
//  - demo-uid-active:  aktive Membership -> demo-company, Mitarbeiter emp-max
//                      (Rolle aus config/employees.ts)
//  - demo-uid-blocked: gesperrte Membership -> demo-company, Mitarbeiter
//                      emp-jonas (Status "Gesperrt")
// `uid` ist die Dokument-ID und wird nie als Feld gespeichert.
//
// Rules im Emulator: Die Client-SDK-Schreibzugriffe dieses Skripts laufen ohne
// Anmeldung. Die produktiven firestore.rules verbieten Client-Writes auf
// userMemberships absichtlich. Deshalb den Emulator zum Seeden OHNE geladene
// Rules starten (kein --rules/keine firestore.rules in der Emulator-
// Konfiguration; so laufen auch die übrigen Seed-Skripte) und die Rules separat
// prüfen (z. B. mit dem Emulator + @firebase/rules-unit-testing). Das Seeden
// ändert nichts an den Rules.
//
// Absichtlich NICHT die echte firebaseConfig aus src/lib/firebase/config.ts
// verwendet: fest verdrahteter Emulator (localhost:8080), Platzhalter-Projekt,
// keine Secrets, keine .env.local-Abhängigkeit.
//
// Ausführen: npx tsx scripts/seedUserMemberships.ts
// (npx lädt tsx nur temporär, es wird NICHT als Projekt-Dependency
// installiert – package.json bleibt unverändert.)
//
// Idempotent: vorhandene Dokumente werden übersprungen. --force überschreibt.
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { employees } from "../src/config/employees";
import { COLLECTIONS } from "../src/lib/firebase/collections";
import { resolveCompanyId } from "../src/lib/firebase/companyContext";
// Rein, ohne Firebase-App-Seiteneffekte; entfernt `undefined`, setDoc() lehnt
// solche Werte ab.
import { sanitizeForFirestore } from "../src/lib/firebase/firestoreSanitize";
import type { UserMembership } from "../src/types/userMembership";

const EMULATOR_HOST = "localhost";
const EMULATOR_PORT = 8080;
// Muss mit dem --project-Flag beim Start des Emulators übereinstimmen.
const EMULATOR_PROJECT_ID = "demo-pruefcheckpro-emulator";

const FORCE_OVERWRITE = process.argv.includes("--force");

const app = initializeApp({ projectId: EMULATOR_PROJECT_ID });
const db = getFirestore(app);
connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT);

// Stabile Demo-UIDs: keine echten Auth-Konten.
const DEMO_MEMBERSHIPS: Array<{ uid: string; employeeId: string; status: UserMembership["status"] }> = [
  { uid: "demo-uid-active", employeeId: "emp-max", status: "Aktiv" },
  { uid: "demo-uid-blocked", employeeId: "emp-jonas", status: "Gesperrt" },
];

async function seed() {
  const companyId = resolveCompanyId();
  const now = new Date().toISOString();

  let created = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const entry of DEMO_MEMBERSHIPS) {
    const employee = employees.find((candidate) => candidate.id === entry.employeeId);
    if (!employee) {
      throw new Error(`[seedUserMemberships] Mitarbeiter ${entry.employeeId} nicht in config/employees.ts.`);
    }

    const ref = doc(db, COLLECTIONS.USER_MEMBERSHIPS, entry.uid);
    const existing = await getDoc(ref);
    if (existing.exists() && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    // uid nie als Datenfeld schreiben – die Dokument-ID trägt sie. Rolle als
    // Snapshot (roleId + Name) wie bei Mitarbeitern/Einladungen; daraus wird
    // in diesem Slice noch nichts autorisiert.
    const { uid, ...data } = {
      uid: entry.uid,
      companyId,
      employeeId: employee.id,
      roleId: employee.roleId,
      role: employee.role,
      status: entry.status,
      createdAt: now,
      updatedAt: now,
    } satisfies UserMembership;
    await setDoc(ref, sanitizeForFirestore(data));
    if (existing.exists()) {
      overwritten += 1;
      console.log(`[seedUserMemberships] Überschrieben (--force): ${uid}`);
    } else {
      created += 1;
      console.log(`[seedUserMemberships] Angelegt: ${uid} (${entry.status}, ${employee.name})`);
    }
  }

  console.log(
    `[seedUserMemberships] ${COLLECTIONS.USER_MEMBERSHIPS}: ${created} angelegt, ${overwritten} überschrieben, ${skipped} übersprungen (bereits vorhanden). Es wurden KEINE Auth-Benutzer erzeugt.`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seedUserMemberships] Fehlgeschlagen:", error);
    process.exit(1);
  });
