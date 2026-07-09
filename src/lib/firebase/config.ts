import type { FirebaseOptions } from "firebase/app";

// Zentrale Firebase-Web-Konfiguration aus Environment-Variablen (siehe
// .env.example). Keine echten Werte im Code – nur Platzhalter-Referenzen.
//
// Hinweis: `src/lib/firebase/client.ts` initialisiert die App heute bereits
// eigenständig (aktiv genutzt von Login/Registrierung/Passwort-Reset) und
// wird von diesem Sprint bewusst nicht angefasst. `firebaseConfig` hier ist
// die kanonische Konfiguration für den neuen `firebase.ts`-Einstiegspunkt
// und zukünftigen Firestore-/Storage-Code.
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Emulator-Verbindungsdaten (siehe docs/firebase/setup.md). Nur gelesen,
// wenn NEXT_PUBLIC_FIREBASE_USE_EMULATOR explizit "true" ist – heute nirgends
// verdrahtet, nur vorbereitet.
export const firebaseEmulatorConfig = {
  enabled: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true",
  authHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
  firestoreHost: process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST,
  storageHost: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST,
};
