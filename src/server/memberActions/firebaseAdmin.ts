// Firebase Admin SDK – NUR serverseitig (Route Handler unter src/app/api).
// Diese Datei und alles unter src/server darf nie aus Client-Komponenten, Hooks
// oder src/lib/firebase importiert werden (das Admin SDK gehört nicht ins
// Client-Bundle; firebase-admin ist in Next.js ohnehin ein serverExternalPackage).
//
// Zugangsdaten kommen ausschließlich aus der Umgebung des Servers:
//   FIREBASE_SERVICE_ACCOUNT_KEY   JSON des Service-Accounts (als String) ODER
//   GOOGLE_APPLICATION_CREDENTIALS Pfad zur Service-Account-Datei (ADC)
//   FIREBASE_ADMIN_PROJECT_ID      Projekt-ID (Fallback: NEXT_PUBLIC_FIREBASE_PROJECT_ID)
// Im lokalen Firestore-Emulator (FIRESTORE_EMULATOR_HOST) sind keine Zugangsdaten
// nötig. Secrets werden nie committet, geloggt oder an den Client gegeben.
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { MemberActionError } from "@/lib/security/memberActionRules";

const APP_NAME = "pruefcheckpro-member-actions";

function resolveProjectId(): string | undefined {
  return process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || undefined;
}

function createAdminApp(): App {
  const projectId = resolveProjectId();
  if (!projectId) throw new MemberActionError("server-not-configured");

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    let parsed: Parameters<typeof cert>[0];
    try {
      parsed = JSON.parse(serviceAccountJson);
    } catch {
      // Kein Inhalt des Secrets loggen oder weitergeben.
      throw new MemberActionError("server-not-configured");
    }
    return initializeApp({ credential: cert(parsed), projectId }, APP_NAME);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ credential: applicationDefault(), projectId }, APP_NAME);
  }
  // Emulator: Der Emulator prüft keine Credentials. Nur mit gesetztem
  // FIRESTORE_EMULATOR_HOST – produktiv nie genutzt.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ credential: applicationDefault(), projectId }, APP_NAME);
  }
  throw new MemberActionError("server-not-configured");
}

export function getAdminApp(): App {
  return getApps().find((app) => app.name === APP_NAME) ?? createAdminApp();
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

// Verifiziert ein Firebase-Auth-ID-Token (Signatur, Ablauf, Aussteller/Projekt) und
// prüft, ob es widerrufen wurde. Liefert nur die UID; alles andere (Firma, Rolle,
// Rechte) wird aus Firestore gelesen, nie aus dem Token oder dem Request.
export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string }> {
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken, true);
  return { uid: decoded.uid };
}

// Verifiziertes Principal für die Einladungsannahme: zusätzlich zur UID die E-Mail-Adresse des
// Auth-Kontos und ob Firebase sie bestätigt hat (email_verified). Beides stammt aus dem geprüften
// Token (Signatur, Ablauf, Projekt, Widerruf), nie aus dem Request. verifyFirebaseIdToken() (Member-
// Actions) bleibt unverändert: es liefert weiterhin nur die UID.
export async function verifyFirebaseIdPrincipal(
  idToken: string
): Promise<{ uid: string; email?: string; emailVerified: boolean }> {
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken, true);
  return { uid: decoded.uid, email: decoded.email, emailVerified: decoded.email_verified === true };
}
