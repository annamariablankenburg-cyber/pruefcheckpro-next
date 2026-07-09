import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { firebaseConfig } from "@/lib/firebase/config";

// Kanonischer Einstiegspunkt für neuen Firebase-Code (Services/Converter).
// `getApps()[0] ?? initializeApp(...)` verhindert eine doppelte
// Initialisierung, falls `src/lib/firebase/client.ts` (bestehende
// Auth-Anbindung) bereits zuvor gelaufen ist – beide nutzen dieselbe
// Konfiguration, ein zweiter initializeApp()-Aufruf ist also unschädlich,
// wird aber ohnehin vermieden.
export const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
