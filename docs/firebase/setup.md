# Firebase Setup

Status: **Infrastruktur-Vorbereitung – noch keine Firestore-CRUD-Logik, kein Cloud Storage, keine Änderung an der bestehenden Auth-Anbindung.** Beschreibt, welche Firebase-Produkte PrüfCheckPro später braucht, wie das Projekt strukturiert ist und welche Environment-Variablen nötig sind.

---

## 1. Benötigte Firebase-Produkte

### Firestore
Primäre Datenbank für alle fachlichen Domänen (Kunden, Projekte, Proben, Berichte, …). Multi-Tenant-Modell unter `companies/{companyId}/...`, siehe `docs/database/firestore-model.md` für das vollständige Collection-Schema und `docs/database/relationships.md`/`docs/database/status-workflows.md` für Beziehungen und Statuswerte.

### Auth
**Bereits angebunden** (`src/lib/firebase/client.ts`, `src/lib/firebase/auth.ts`) – E-Mail/Passwort-Login, Registrierung, Passwort-Reset. Wird von diesem Sprint nicht verändert. Nutzerprofile liegen unter `users/{uid}` (siehe `src/lib/firebase/users.ts`, `types/user.ts`).

### Storage
Für Anhänge, Fotos, Dokumente und exportierte PDF/Excel-Dateien (siehe `firestore-model.md`, Abschnitt zu `reports`: „Die eigentliche PDF-/Excel-Datei gehört nicht ins Firestore-Dokument, sondern in Cloud Storage"). Empfohlener Pfadaufbau: `companies/{companyId}/{domäne}/{dokumentId}/{dateiname}`. Heute noch nicht angebunden.

### Hosting
Für das Next.js-Frontend-Deployment. Noch nicht konfiguriert (kein `firebase.json`/`.firebaserc` im Projekt). Bei Bedarf: `firebase init hosting` mit Next.js-Adapter (Frameworks-Support) oder eigenständiges Hosting (z. B. Vercel) – Entscheidung steht noch aus.

### Emulator Suite
Für lokale Entwicklung ohne Verbindung zum echten Firebase-Projekt (Auth, Firestore, Storage). Empfohlen, sobald echte Firestore-/Storage-Anbindung ansteht, damit Entwicklung und Tests nicht gegen Produktivdaten laufen. Siehe Abschnitt 4.

---

## 2. Projektstruktur

```
src/lib/firebase/
  client.ts        Bestehende Firebase-Initialisierung (aktiv, von Auth genutzt) – unverändert
  auth.ts           Bestehende Auth-Helper (Login/Registrierung/Reset) – unverändert
  users.ts          Bestehende Firestore-Zugriffe für users/{uid} – unverändert
  firebase.ts        Neuer kanonischer Init-Einstiegspunkt (app/auth/db/storage) für zukünftigen Code
  config.ts           Firebase-Konfiguration aus Environment-Variablen + Emulator-Konfiguration
  collections.ts       Zentrale Collection-Namen (COLLECTIONS.*) + Pfad-Helfer für companies/{companyId}/...
  converters/           Firestore-Datenconverter je Domäne (reines Feld-Mapping, keine CRUD-Aufrufe)
  services/              Platzhalter für künftige Firestore-Implementierungen der Interfaces aus src/lib/interfaces/
  types/                 Firestore-spezifische Hilfstypen (WithoutId, WithTimestamp, ...)
```

`client.ts`/`auth.ts`/`users.ts` bleiben die aktiv genutzte, funktionierende Auth-Anbindung. `firebase.ts` ist der neue kanonische Einstiegspunkt für alles, was ab jetzt hinzukommt (Firestore-Services, Storage-Zugriffe), und verhindert über `getApps()[0] ?? initializeApp(...)` eine doppelte Initialisierung.

Siehe auch `docs/architecture/data-access-layer.md` für das Zusammenspiel von Repository → Service → Hook → View und wie Firestore später in die Service-Schicht einzieht.

---

## 3. Environment-Variablen

Siehe `.env.example` (Vorlage, keine echten Werte) bzw. `.env.local.example`. Für lokale Entwicklung nach `.env.local` kopieren und mit echten Werten aus der Firebase Console befüllen (Projekteinstellungen → Allgemein → Deine Apps → SDK-Konfiguration).

| Variable | Zweck |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web-API-Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth-Domain (`<project>.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase-Projekt-ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Cloud-Storage-Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Cloud-Messaging-Sender-ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase-App-ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Google-Analytics-Measurement-ID (optional) |
| `NEXT_PUBLIC_FIREBASE_USE_EMULATOR` | `"true"`, um lokal gegen die Emulator Suite statt gegen das echte Projekt zu laufen |
| `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` | Host:Port des Auth-Emulators (Standard `localhost:9099`) |
| `NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST` | Host:Port des Firestore-Emulators (Standard `localhost:8080`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST` | Host:Port des Storage-Emulators (Standard `localhost:9199`) |

Alle Variablen sind `NEXT_PUBLIC_*`, da sie im Browser (Client-SDK) gebraucht werden – das ist bei Firebase-Web-Config so vorgesehen (keine Secrets, der Zugriffsschutz läuft über Firestore Security Rules, nicht über Geheimhaltung des API-Keys).

**Wichtig:** `.env.local` enthält bereits echte Projektwerte und ist nicht Teil dieses Sprints – nicht verändern, nicht committen (sollte in `.gitignore` stehen).

---

## 4. Emulator Suite (Vorbereitung, noch nicht aktiv genutzt)

Geplanter Ablauf für lokale Entwicklung, sobald echte Firestore-Anbindung ansteht:

1. `firebase init emulators` (Auth, Firestore, Storage auswählen).
2. `firebase emulators:start` startet lokale Instanzen (Standard-Ports: Auth `9099`, Firestore `8080`, Storage `9199`, UI `4000`).
3. `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true` in `.env.local` setzen.
4. In `src/lib/firebase/firebase.ts` (oder einer Erweiterung davon) `connectAuthEmulator`/`connectFirestoreEmulator`/`connectStorageEmulator` aufrufen, wenn `firebaseEmulatorConfig.enabled` (`src/lib/firebase/config.ts`) `true` ist.

Schritt 4 ist heute **nicht verdrahtet** – `config.ts` liest die Emulator-Variablen bereits, ruft aber noch keine `connect*Emulator()`-Funktionen auf. Das folgt in einem späteren Sprint, sobald echte Firestore-Aufrufe hinzukommen.

---

## 5. Was dieser Sprint bewusst nicht macht

- Keine echten Firestore-Reads/-Writes/-Queries (`getDoc`, `setDoc`, `addDoc`, `onSnapshot`, …) außerhalb der bereits bestehenden `users.ts`.
- Kein Cloud-Storage-Code (Upload/Download).
- Keine Änderung an `client.ts`/`auth.ts`/`users.ts` (bestehende, funktionierende Auth-Anbindung).
- Keine Security Rules (siehe `docs/database/permissions.md` für die geplante Rechte-Logik).
- Keine echten Werte in `.env.local` (bleibt unverändert, enthält bereits Projektwerte).
