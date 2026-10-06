# Firestore Rules Testing

Status: **Test-Infrastruktur für die bestehende Security-Basis.** Sie testet `firestore.rules` automatisiert gegen den lokalen Firestore-Emulator. Es gibt noch **keine** Permission-/Rollen-Regeln; die Tests bilden den Ist-Stand ab (Membership + Company-Isolation + Profil-Regeln) und dienen als Regressionsbasis für die schrittweise Härtung (siehe `docs/firebase/role-security-audit.md`).

> `firestore.rules` wurde in diesem Slice **nicht verändert**.

---

## 1. Voraussetzungen

| Was | Version |
|---|---|
| Node.js | ≥ 20 (lokal 24, CI 24) |
| npm | wie im Repo (`package-lock.json`) |
| **Java (JDK)** | **21 oder neuer** – der Firestore-Emulator ist eine Java-Anwendung. `firebase-tools` 15.x bricht sonst mit „Could not spawn `java -version`“ bzw. einer Versionsmeldung ab (Mindestversion `MIN_SUPPORTED_JAVA_MAJOR_VERSION = 21` in `firebase-tools`). |

Java installieren: z. B. Temurin/Adoptium JDK 21 (offizielles Installationspaket oder Paketmanager) und prüfen:

```bash
java -version
```

Es wird nichts automatisch installiert. Ohne Java sind die Tests lokal **nicht ausführbar** (die TypeScript-Prüfung `npx tsc --noEmit` deckt die Test-Dateien trotzdem ab).

## 2. Installation

```bash
npm install
```

Neue Dev-Dependencies für diesen Slice:

- `@firebase/rules-unit-testing` – Test-Contexts (authentifiziert/unauthentifiziert), Rules-Laden, Daten-Reset,
- `firebase-tools` – Emulator-Start (`firebase emulators:exec`),
- `tsx` – führt die TypeScript-Tests mit dem eingebauten Node-Test-Runner (`node:test`) aus.

Es gibt **kein** zusätzliches Test-Framework: Der Node-Test-Runner (`node:test`) und `node:assert` genügen.

## 3. Ausführen

```bash
npm run test:rules
```

Ein einzelner Befehl: startet den Firestore-Emulator (`firebase emulators:exec --only firestore`), führt alle Tests aus und beendet den Emulator wieder. Exit-Code ≠ 0 bei Fehlern.

| Script | Zweck |
|---|---|
| `npm run test:rules` | Emulator starten + Tests ausführen + Emulator beenden (Standard, auch CI) |
| `npm run test:rules:run` | nur die Tests; erwartet einen **bereits laufenden** Emulator (`FIRESTORE_EMULATOR_HOST` gesetzt) |

**Port 8080:** `firebase.json` legt den Firestore-Emulator auf `127.0.0.1:8080` fest (derselbe Port wie bei den Seed-Skripten). Läuft dort bereits ein Entwicklungs-Emulator (z. B. zum Seeden), vorher beenden – oder dessen Emulator mit `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run test:rules:run` mitbenutzen (dann Rules-Dateien beachten: die Tests laden die Rules selbst in den Emulator und überschreiben sie dort).

`firebase.json` enthält bewusst **keinen** `firestore.rules`-Eintrag: Ein normal gestarteter Entwicklungs-Emulator lädt damit keine Rules (so laufen die Seed-Skripte wie bisher); die Tests setzen die Rules selbst (`initializeTestEnvironment({ firestore: { rules } })`).

> **Permission-Konfig-Tests:** `npm run test:permissions` (ohne Emulator, ohne Java) prüft Taxonomie und Systemrollen-Matrix (`tests/config/permissions.test.ts`); die CI führt sie vor den Rules-Tests aus.

## 4. Testprojekt und Produktions-Sicherheit

- Test-Projekt-ID: **`demo-pruefcheckpro-rules-test`**. Das Präfix `demo-` ist die offizielle Firebase-Konvention für Projekte, die nur im Emulator existieren: Es gibt weder Credentials noch eine Verbindung zu echten Diensten.
- Der Helfer `assertLocalEmulator()` (`tests/firestore/helpers/testEnv.ts`) bricht **vor jeder Verbindung** ab, wenn `FIRESTORE_EMULATOR_HOST` fehlt oder nicht auf `localhost`/`127.0.0.1`/`::1` zeigt – und wenn die Projekt-ID nicht mit `demo-` beginnt. Ohne Emulator können die Tests also nicht „aus Versehen“ gegen ein echtes Projekt laufen.
- Kein `.env`/`.env.local`, keine Service-Accounts, keine Secrets, kein Deployment.
- Die Tests laufen mit `--test-concurrency=1` (sequenziell), weil alle Dateien denselben Emulator und dasselbe Projekt teilen und sich vor jedem Test per `clearFirestore()` zurücksetzen.

## 5. Teststruktur

```
tests/firestore/
  helpers/testEnv.ts            Emulator-Guard, Test-Environment (Rules aus firestore.rules), Kontexte (Anmeldung/anonym), Seed mit deaktivierten Rules
  helpers/fixtures.ts           Test-User, Firmen, Membership-Seed, Standard-Welt, die 12 Company-Collections
  membership.test.ts            userMemberships/{uid}
  company-isolation.test.ts     Tenant-Isolation, defekte Memberships, Fallback-Pfade
  company-collections.test.ts   parametrisiert: die 8 noch nicht rollenbasierten Company-Collections + Abdeckungs-Wächter (alle 12)
  profile.test.ts               users/{uid} (Login-Profil)
  phase1-matrix.test.ts         Rules Phase 1: 19 Personas × roles/employees/invitations/locations × get/list/create/update/delete
  phase1-employees.test.ts      Rules Phase 1: eigenes Dokument, Administrator-/Restricted-Schutz, Self-Promotion
  phase1-roles.test.ts          Rules Phase 1: Rollen lesen/anlegen/ändern, Restricted-Schlüssel, Administrator-Rolle
  phase1-invitations-locations.test.ts  Rules Phase 1: Einladungs-Formregeln, Widerruf, Standorte
  rules-config-sync.test.ts     firestore.rules ↔ src/config/roles.ts (ohne Emulator lauffähig)
```

**Ablauf je Test:** Daten werden mit `withSecurityRulesDisabled` angelegt (Setup); die Assertions laufen mit `authenticatedContext(uid)` bzw. `unauthenticatedContext()` und `assertSucceeds`/`assertFails`. Vor jedem Test setzt `clearFirestore()` die Daten zurück.

> **Rules Phase 2:** `phase2-matrix.test.ts` (880 Tests: 22 Personas × 8 Fach-Collections × get/list/create/update/delete, Erwartung aus `permissions[Schlüssel] === true`) und `phase2-permissions.test.ts` (gezielte Fälle: Einzelschlüssel, Read-only, Legacy 31, geschützte Löschrechte, Berichte-Export, `sampleId`, Tenant, Bulk, Service-Abläufe, Snapshots); `company-collections`/`company-isolation` laufen mit Membership + Rolle `admin`; `rules-config-sync` prüft Schlüssel je Operation gegen `allPermissionKeys`. Details und Gesamtzahl: `docs/firebase/role-permission-rules-phase2.md`.

### Testfall-Kategorien (1786 Testfälle nach Rules Phase 2, alle grün; 797 nach Server-Slice inkl. Last-Admin-Race; 711 nach Phase 1; vor Phase 1: 189)

> **Server-Slice:** `tests/firestore/member-actions.test.ts` (69 Tests, inkl. der Last-Admin-Race-Tests) nutzt zusätzlich das **Admin SDK** gegen denselben Firestore-Emulator (Transaktionen, Atomizität, HTTP-Schicht; `docs/firebase/member-security-actions.md`). Die Employee-Tests in `phase1-employees.test.ts` wurden auf das Client-Verbot von `roleId`/`role`/`status` umgestellt.

1. **Membership (`userMemberships/{uid}`)** – eigene lesen (inkl. fehlend/gesperrt: für die App-Zustände nötig), fremde/anonym/Liste/gefilterte Query verboten; Create (auch Selbst-Zuweisung), Update (`companyId`, `roleId`, `role`, `status`, Selbst-Entsperren, Überschreiben, fremde), Delete – jeweils DENY; abgelehnte Writes lassen das Dokument unverändert.
2. **Tenant-Isolation** (Beispiel `customers`) – richtige Firma ALLOW (Ist-Stand: auch Schreiben/Löschen), falsche Firma, gesperrt, ohne Membership, anonym: DENY.
3. **Alle 12 Company-Collections** (`customers`, `projects`, `devices`, `samples`, `testValues`, `reports`, `calendarEvents`, `laborbook`, `locations`, `employees`, `invitations`, `roles`; echte Pfade aus `companyCollectionPaths`): pro Collection aktives Mitglied der richtigen Firma / anderer Firma / gesperrt / ohne Membership / anonym für get, list, create, update, delete. Ein **Wächter-Test** liest die `match`-Blöcke aus `firestore.rules` und schlägt fehl, wenn eine Collection dazukommt oder wegfällt, ohne dass die Tests angepasst werden.
4. **Defekte Memberships** – ohne/leere/falsch typisierte `companyId`, andere Schreibweise, ohne/leerer/unbekannter/klein geschriebener `status`, leeres Dokument: immer DENY (plus Kontrolle, dass die korrekte Variante funktioniert).
5. **Nicht freigegebene Pfade** – `companies/{id}` (Stammdokument), `integrations`, `webhooks`, `auditLog`, `users/{uid}/aiChats`, unbekannte Pfade: DENY (Deny-Fallback).
6. **Profil (`users/{uid}`)** – eigenes/fremdes/anonym/Liste lesen; Create: das von `createUserProfile()` erzeugte Basisprofil ALLOW; `role: "admin"`, `plan: "enterprise"`, zusätzliche Felder (`companyId`, `laboratoryId`), fremde UID, falsche `id`, ungültige Werte, fehlende Pflichtfelder (je Feld), Client-Zeit statt Server-Timestamp: DENY; Update: nur `lastLogin` (Server-Zeit, auch im `setDoc`-merge-Muster von `updateLastLogin()`) ALLOW, jede andere Änderung (auch zusammen mit `lastLogin`) DENY; Delete DENY.

> **Phase 1 (Rollen-Rules):** Kategorie 3 testet nur noch die acht übrigen Collections; die Tests für die vier rollenbasierten Collections stehen in `phase1-*.test.ts` (siehe `docs/firebase/role-permission-rules-phase1.md`, Abschnitt 8). Die 12 Collections sind weiter durch den Wächter-Test erfasst; vier davon folgen der Permission-Policy.

> **Hinweis zur Ausführung:** Die Emulator-Tests brauchen Java 21. Auf der lokalen Entwicklungsmaschine lief `npm run test:rules` vollständig grün (189 Tests vor Phase 1; mit Phase 1 698 von 698, 0 Fehler). Die Konsistenz-Tests (`rules-config-sync.test.ts`, Abdeckungs-Wächter) laufen auch ohne Emulator. Nach dem Lauf mit 698 Tests kam die Regel „nur bekannte Permission-Schlüssel“ mit 13 weiteren Tests hinzu (insgesamt 711); der lokale Lauf bestätigte 711 von 711 (0 Fehler), auch nach dem UI-Gating-Slice (`firestore.rules` unverändert).

## 6. CI

`.github/workflows/firestore-rules.yml` (neu, es gab keine CI): bei Pull Requests und Pushes auf `main`, die `firestore.rules`, `firebase.json`, `tests/**`, `package*.json` oder `collections.ts` betreffen. Schritte: Checkout → Node 24 → Temurin JDK 21 → `npm ci` → `npm run test:rules`. Nur Emulator, keine Secrets, keine Deployments, `permissions: contents: read`.

## 7. Wie künftige Permission-Slices Tests ergänzen

1. **Zuerst den Test, dann die Regel.** Neue Regel = neuer Testfall (ALLOW **und** DENY).
2. **Bestehende ALLOW-Erwartungen bewusst anpassen.** `company-collections.test.ts` und `company-isolation.test.ts` erwarten heute „aktives Mitglied darf alles“. Sobald eine Collection eingeschränkt wird, die entsprechende Erwartung dort ändern (und im Commit begründen), nicht den Test löschen.
3. **Rollen im Test seeden.** Für rollenbasierte Regeln in `fixtures.ts` Rollen-Dokumente (`companies/{id}/roles/{roleId}` mit `permissions`) und Memberships mit `roleId` anlegen (mit deaktivierten Rules) und je Permission-Key positive und negative Fälle prüfen – insbesondere Custom Roles, archivierte Rollen, fehlende/unbekannte `roleId` (fail-closed).
4. **Matrix aus dem Audit abdecken.** `docs/firebase/role-security-audit.md` (Abschnitt 4) ist die Soll-Matrix: Collection × Rolle × Operation.
5. **Kritische Admin-Aktionen** (Rollen ändern, Admin-Rolle, Membership, Einladungen mit erhöhter Rolle) bekommen eigene Testdateien.
6. **Neue Company-Collection?** In `COMPANY_COLLECTIONS` (`fixtures.ts`) aufnehmen; der Wächter-Test erinnert daran.
7. **Rules-Änderungen nie ohne grünen `npm run test:rules`** mergen (CI erzwingt das).

## 8. Bekannte Grenzen

- Die Tests prüfen Rules, nicht die App: Client-Logik (Gate, Services) ist nicht Teil davon.
- Getestet werden Einzeloperationen (get/list/create/update/delete); Transaktionen und Batches nutzen dieselben Rules pro Operation, haben aber eigene Limits für Dokumentzugriffe (relevant bei künftigen `get()`-lastigen Rollenregeln, dann gezielt testen).
- Aussagen zu Kosten/Limits der Rules gehören in den Emulator-Lauf des jeweiligen Slices.
