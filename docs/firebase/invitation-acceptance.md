# Einladung annehmen / Membership-Provisionierung

Status: **serverseitig umgesetzt** (Admin SDK, Route Handler, eine Firestore-Transaktion; im Emulator getestet). **Nicht Teil dieses Slices:** Firmen-Anlage (`createCompany`), E-Mail-Versand, Cloud Functions, eine größere Permission-/Rules-Neustrukturierung. Eingebaut wurde nur eine kleine Invitation-Create-Härtung in `firestore.rules`, die `acceptedByUid` und `employeeId` zusätzlich zu `acceptedAt`/`revokedAt` server-only macht (Abschnitt 10).

Ergebnis des Flows: gültige Einladung → Mitarbeiter (`Aktiv`) → `userMemberships/{uid}` → `roleId` → aktive Rolle **derselben** Firma. Die Autorisierungsquelle bleibt unverändert die Kette `request.auth.uid → userMemberships/{uid} → roleId → companies/{companyId}/roles/{roleId} → permissions[key]`. `users/{uid}.role`, Profil, `Employee.role`/`roleId`, Rollen-Snapshots und Client-Angaben (`companyId`, `roleId`, E-Mail) autorisieren nichts.

## 1. Wie der Einladungsflow vor diesem Slice aussah (Ist-Analyse)

| Aspekt | Befund |
| --- | --- |
| Einladung anlegen | `invitationService.createInvitation` schreibt **nur** ein Dokument unter `companies/{c}/invitations/{id}` (Client, Rules Phase 1: `administration.mitarbeiter_verwalten` + Formprüfung + Rollenschutz). Kein Mitarbeiter, kein Auth-User, kein Token, kein Link, kein E-Mail-Versand. |
| Felder | `name`, `email`, `role` (Snapshot), `roleId`, `locationId`, `location`, `status` (`Ausstehend`/`Angenommen`/`Widerrufen`), `expiresAt`, `createdAt`, `updatedAt`, `revokedAt?`, `acceptedAt?`, `message?`, `activateImmediately`. `Abgelaufen` wird nie gespeichert, sondern aus `expiresAt` abgeleitet. |
| Mitarbeiter bei Einladung | **Nein.** Es gibt keinen vorab angelegten (`Ausstehend`) Mitarbeiter im Firestore-Flow. |
| Sicherer Token | **Nein.** Eine Einladung hat keine geheime Komponente. Die ID allein ist keine Sicherheit. |
| E-Mail-Verifizierung | **Fehlte** im gesamten Auth-Flow (Registrierung legt ein E-Mail/Passwort-Konto ohne Bestätigung an). |
| Annahme-Route / -Seite | Gab es nicht. |

Konsequenz: Eine unsichere Annahme („Client kennt die `invitationId`“) wäre möglich gewesen. Der Slice bindet die Annahme deshalb an die **verifizierte Auth-E-Mail** und ergänzt die dafür nötige Bestätigung im Client (Abschnitt 5/9). Das Datenmodell wurde nicht erfunden; ergänzt wurden nur die Felder `acceptedByUid` und `employeeId` an der Einladung (Server-geschrieben).

## 2. Architektur

```
/einladung?c=<companyId>&i=<invitationId>      (Seite, außerhalb (app) und (auth))
  → invitationActionsClient.acceptInvitation   (getIdToken(true), POST, Body nur {companyId, invitationId})
  → POST /api/invitation-actions/accept        (runtime = "nodejs")
    → handleAcceptInvitationRequest            (Token → Principal, Body validieren, Fehler → stabile Codes)
      → verifyFirebaseIdPrincipal              (Admin SDK: verifyIdToken(token, true) → uid, email, emailVerified)
      → acceptInvitation(db, principal, req)   (EINE db.runTransaction)
        → planAcceptInvitation                 (rein, getestet: tests/config/invitation-acceptance-rules.test.ts)
```

Dateien: `src/lib/security/invitationAcceptanceRules.ts` (Entscheidung, Fehlercodes), `src/server/invitationActions/{invitationActionsService,requestHandler,defaultDeps}.ts`, `src/app/api/invitation-actions/accept/route.ts`, `src/server/memberActions/firebaseAdmin.ts` (`verifyFirebaseIdPrincipal`, der bestehende `verifyFirebaseIdToken` der Member-Aktionen bleibt unverändert). `firebase-admin` wird nur serverseitig importiert (Bundle-Check: keine Treffer in `.next/static`).

## 3. Identitätsbindung

- Das Token wird mit `verifyIdToken(token, true)` geprüft (Signatur, Ablauf, Projekt, Widerruf).
- Verlangt wird **`email_verified === true`** (exakt `true`) und eine vorhandene E-Mail; sonst `email-not-verified`.
- Die E-Mail der Einladung muss der Token-E-Mail entsprechen – verglichen über **dieselbe zentrale Normalisierung** (`normalizeEmail`: trim + lower-case).
- Nur `companyId` und `invitationId` aus dem Request lokalisieren das Dokument. Sie sind nie eine Autorisierung. Alle weiteren Body-Felder (`uid`, `email`, `employeeId`, `roleId`, `role`, `status`, `isAdmin`, `permissions`, `actorRole`) werden verworfen (Test „gefälschte Felder“).
- Body-Limit 2048 **UTF-8-Bytes** (`TextEncoder`, nicht UTF-16-Zeichen – Mehrbyte-Zeichen umgehen es nicht); IDs müssen `isSafeDocumentId` bestehen (keine Pfad-Injection).
- **Anti-Enumeration:** „Einladung existiert nicht“ und „Einladung gehört einem anderen Konto“ liefern denselben Code `invitation-not-found` (404). Die Identitätsprüfung steht **vor** der Statusauskunft: ein fremdes Konto erfährt nicht, ob eine Einladung widerrufen, abgelaufen oder angenommen ist.

## 4. Die Transaktion

Lesen (alle vor dem ersten Schreiben):

1. `companies/{c}/invitations/{invitationId}`
2. `companies/{c}/roles/{invitation.roleId}` (dieselbe Firma)
3. `userMemberships/{uid}`
4. `companies/{c}/employees/emp-<invitationId>` (geplante Mitarbeiter-ID)
5. Query: weitere Mitarbeiter derselben Firma mit der (normalisierten) E-Mail der Einladung

Schreiben (nur bei Plan `provision`):

| Pfad | Operation | Inhalt |
| --- | --- | --- |
| `companies/{c}/employees/emp-<invitationId>` | `create` | `name`, `initials`, `email` (normalisiert), `role` (Name aus dem **Rollen-Dokument**), `roleId`, `location`, `locationId?`, `status: "Aktiv"`, `invitationStatus: "Angenommen"`, `joinedAt`, `history`, `createdAt`, `updatedAt` |
| `userMemberships/{uid}` | `create` | `companyId` (= Firma der validierten Einladung), `employeeId`, `roleId`, `role` (Snapshot), `status: "Aktiv"`, `createdAt`, `updatedAt` |
| `companies/{c}/invitations/{id}` | `update` | `status: "Angenommen"`, `acceptedAt`, `acceptedByUid`, `employeeId`, `updatedAt` |

Alle Werte stammen aus Einladung, Rollen-Dokument und Token – nie aus dem Request. Schreibt einer der drei Schritte nicht, wird **nichts** committet (Rollback-Test: Fehler beim Membership-, Mitarbeiter- und Einladungs-Write → Einladung bleibt offen, Wiederholung gelingt).

**Mitarbeiter:** Es wird bewusst **kein zweites Mitarbeitermodell** erfunden; da im Firestore-Flow kein Mitarbeiter bei der Einladung entsteht, wird er bei der Annahme angelegt, mit deterministischer ID `emp-<invitationId>`. Existiert dort schon ein Dokument oder ein anderer Mitarbeiter mit derselben E-Mail (auch `Gesperrt`), wird **nicht** still verknüpft oder reaktiviert → `employee-invalid`.

## 5. Entscheidungsregeln (`planAcceptInvitation`)

Reihenfolge: verifizierte E-Mail → Einladung vorhanden → E-Mail-Bindung → Status/Idempotenz → Ablauf → Rolle → bestehende Membership/Mitarbeiter.

| Zustand | Ergebnis |
| --- | --- |
| Token ohne verifizierte E-Mail | `email-not-verified` (403) |
| Einladung fehlt / andere E-Mail | `invitation-not-found` (404) |
| `Widerrufen` | `invitation-revoked` |
| `expiresAt` in der Vergangenheit | `invitation-expired` (genau zum Zeitpunkt noch gültig) |
| Status unbekannt, `expiresAt`/`name` kaputt, `roleId` fehlt/leer/kein String/unsicher | `invitation-invalid` (kein Fallback auf den Rollennamen) |
| Rolle fehlt (auch: nur in anderer Firma vorhanden) | `role-not-found` |
| Rolle archiviert (`status !== "Aktiv"`) | `role-inactive` (kein Snapshot-Fallback) |
| Mitgliedschaft in **anderer** Firma | `already-member` |
| Membership derselben Firma, aber andere Rolle/anderer Mitarbeiter/gesperrt | `membership-conflict` (fail-closed, keine Reaktivierung) |
| Mitarbeiter-Konflikt (geplante ID belegt oder gleiche E-Mail) | `employee-invalid` |
| angenommen von anderer UID | `invitation-already-accepted` |
| angenommen, aber Membership fehlt | `invitation-already-accepted` (nie neu provisionieren) |

**Geschützte Rollen** (Administrator, Rollen mit Restricted-/Admin-only-Schlüsseln) dürfen angenommen werden: der Schutz greift beim **Anlegen** der Einladung (nur wer `rollen.admin_verwalten` hat, darf sie ausstellen; Rules Phase 1). Der Annehmende braucht dieses Recht nicht. Verwendet wird ausschließlich `Invitation.roleId`; wurde sie nach dem Anlegen geändert, gilt der aktuell gespeicherte Wert, die Rolle wird beim Annehmen neu gelesen und muss aktiv sein.

## 6. Idempotenz

Erfolg ohne Schreibzugriff (`alreadyAccepted: true`) nur, wenn **alles** übereinstimmt: Einladung `Angenommen`, `acceptedByUid == uid`, Membership derselben Firma mit gleichem Mitarbeiter und gleicher `roleId`, Mitarbeiter vorhanden, aktiv, gleiche `roleId`, Membership `Aktiv`. Jede Abweichung ist ein Fehler, nie eine stille Reparatur. `updatedAt` bleibt bei der Wiederholung unverändert.

## 7. Parallelität

Gesichert durch Firestore-Transaktionen plus `tx.create` (kann ein bereits angelegtes Dokument nie überschreiben) und die deterministische Mitarbeiter-ID. Emulator-Tests (je 3 Runden, `Promise.allSettled`):

- **Dieselbe UID zweimal gleichzeitig:** beide Aufrufe gelingen, genau einer provisioniert, der andere ist `alreadyAccepted`; genau ein Mitarbeiter und eine Membership.
- **Zwei verschiedene Konten (nur eines mit passender E-Mail):** nur das passende Konto wird provisioniert, das andere erhält `invitation-not-found`/`invitation-already-accepted` und keine Membership.
- **Zwei Konten mit (hypothetisch) gleicher E-Mail:** genau ein Gewinner, das andere `invitation-already-accepted`; genau eine Membership pro Mitarbeiter.

Hinweis: Im Emulator dauern die Race-Tests einige Sekunden bis zu einer halben Minute je Test (Lock-Konflikte und Wiederholungen der Transaktion); das Ergebnis ist stabil.

## 8. Fehlercodes (HTTP)

| Code | Status | Bedeutung |
| --- | --- | --- |
| `unauthenticated` | 401 | kein/ungültiges/widerrufenes Token |
| `server-not-configured` | 503 | Admin SDK nicht konfiguriert |
| `invalid-request` | 400 | Body ungültig, zu groß, IDs fehlen/unsicher |
| `email-not-verified` | 403 | E-Mail nicht bestätigt |
| `invitation-not-found` | 404 | fehlt **oder** nicht für dieses Konto (gewollt zusammengefasst) |
| `invitation-invalid` / `-revoked` / `-expired` / `-already-accepted` | 409 | Zustand der Einladung |
| `already-member` | 409 | Konto gehört zu einer anderen Firma |
| `employee-invalid` | 409 | Mitarbeiter-Konflikt |
| `role-not-found` / `role-inactive` | 409 | Rolle fehlt / archiviert |
| `membership-conflict` | 409 | bestehende Membership passt nicht |
| `internal-error` | 500 | unerwartet (nur Fehlername serverseitig geloggt) |

Antworten enthalten **nur** `{ok:false, code, message}` – keine Pfade, IDs, E-Mail-Adressen, Tokens oder Exceptions (Test mit präparierter Exception). Erfolg: `{ok:true, alreadyAccepted}`.

## 9. Client / UI

- **Link:** Das Erzeugen der Einladung ändert sich nicht (kein Mailversand). Die Aktion „Einladungslink kopieren“ (Einladungen-Tab) erzeugt `/einladung?c=<companyId>&i=<invitationId>` – `companyId` stammt aus der Membership des Administrators. Der Link enthält **kein Geheimnis**; die Sicherheit liegt in der verifizierten E-Mail.
- **Seite `/einladung`** (`src/app/einladung/page.tsx`, bewusst außerhalb von `(app)`/`(auth)`, damit angemeldete Nutzer ohne Membership sie erreichen): lädt, nicht angemeldet → „Anmelden“/„Registrieren“ (mit `?next=`), E-Mail nicht bestätigt → „Bestätigungs-E-Mail senden“ / „Ich habe meine E-Mail bestätigt“ (Firebase-eigener Mechanismus, danach `getIdToken(true)`), „Einladung annehmen“, Fehlerzustände (falsches Konto → „mit anderem Konto anmelden“, ungültig/widerrufen/abgelaufen, bereits Mitglied), Erfolg → Membership-Cache verwerfen → Dashboard.
- **Login/Registrierung:** `?next=` wird über `safeNextPath` ausgewertet (Allowlist `^/einladung(\?…)?$`, sonst `/dashboard` – kein Open Redirect). Wer sich über eine Einladung registriert, bekommt gleich die Bestätigungs-Mail.
- **Wrapper:** `src/lib/services/invitationActionsClient.ts` (`acceptInvitation`, `InvitationActionClientError` mit stabilen Codes + `network`), sendet `Authorization: Bearer <frisches ID-Token>` und nur `{companyId, invitationId}`.

## 10. Firestore Rules

Bis auf **eine Härtung** unverändert: Beim **Anlegen** einer Einladung verbietet die Rule jetzt zusätzlich zu `acceptedAt`/`revokedAt` auch `acceptedByUid` und `employeeId` (diese Felder setzt ausschließlich der Admin-SDK-Annahmeflow; `NewInvitationInput` schließt sie auch im Typ aus). Die Update-Rule bleibt fail-closed (nur Widerruf: `status`/`revokedAt`/`updatedAt`) – die Felder lassen sich auch nicht nachtragen. Der Client kann `userMemberships` weiterhin nicht schreiben und Mitarbeiter-`roleId`/`role`/`status` nicht setzen; alles Neue läuft über das Admin SDK.

## 11. Voraussetzungen für den Betrieb (vor dem Deployment)

1. Admin-SDK-Konfiguration der Hosting-Umgebung (`FIREBASE_SERVICE_ACCOUNT_KEY` oder `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_ADMIN_PROJECT_ID`) – siehe `docs/firebase/member-security-actions.md`.
2. **E-Mail-Bestätigung:** In der Firebase-Konsole die Vorlage „E-Mail-Adresse bestätigen“ (Absender, Text, Aktions-URL/Domain) prüfen und die App-Domain unter *Authentication → Settings → Authorized domains* eintragen. Ohne bestätigte E-Mail kann niemand eine Einladung annehmen.
3. **Staging-End-to-End-Test** mit zwei echten Testkonten (ein passendes, ein fremdes): Einladung anlegen → Link kopieren → registrieren → E-Mail bestätigen → annehmen → Dashboard. Die gültige Signaturprüfung des Tokens ist nicht Teil der automatischen Tests (braucht echte Schlüssel oder den Auth-Emulator).
4. Bestehende Konten ohne bestätigte E-Mail müssen die E-Mail erst bestätigen (Seite führt dazu).

## Legacy-E-Mail-Hinweis (Data-Readiness)

Der Same-Email-Mitarbeiter-Check ist eine **exakte** Firestore-Query (`where("email", "==", <normalisierte E-Mail>)`). Enthalten Legacy-Mitarbeiter E-Mail-Adressen mit gemischter Groß-/Kleinschreibung oder Leerzeichen, findet die Query sie nicht und der Schutz vor einem doppelten Mitarbeiter greift für diese Datensätze nicht. Vor Production müssen bestehende Mitarbeiter-E-Mails im Data-Readiness-/Migrationsschritt auditiert bzw. normalisiert werden (trim + lower-case). Ein neues Schema-Feld (`emailNormalized`) wurde bewusst **nicht** eingeführt.

## 12. Tests

- `tests/config/invitation-acceptance-rules.test.ts` (26, inkl. Compile-Zeit-Schutz für `NewInvitationInput`) – Fehlercodes ohne Interna, Request-Parser (gefälschte Felder, Injection), verifizierte E-Mail/Normalisierung, `planAcceptInvitation` (alle Zustände der Tabelle, Reihenfolge/Anti-Enumeration, Rollen aus der Einladung, Membership-Policy, Idempotenz), Audit-Konsistenz, `safeNextPath`/`withNext`.
- `tests/firestore/invitation-acceptance.test.ts` (53, Admin SDK + Emulator; inkl. Body-Limit in Bytes) – Erfolg (alle Felder, Rollenname vom Rollen-Dokument, Audit sauber), Identität, Einladungszustände, Rolle, Firmenzuordnung (Cross-Company), bestehende Membership/Mitarbeiter (inkl. gesperrt), Idempotenz, **Rollback** (Proxy auf `tx.create`/`tx.update`), **Parallelität** (3 Tests), HTTP-Schicht (kein/ungültiges Token – auch mit echter Admin-SDK-Prüfung –, 400er-Fälle, ignorierte Felder, 503, 500 ohne Leak).
- Läuft mit `npm run test:permissions` bzw. `npm run test:rules`.

## 13. Nicht Teil dieses Slices

Firmen-Anlage (`createCompany`) und Bootstrap des ersten Administrators, E-Mail-Versand/Magic-Link/geheimer Einladungstoken (würde die E-Mail-Bindung zusätzlich härten), Custom Claims, Audit-Log, Wiederherstellung widerrufener/abgelaufener Einladungen, Reaktivierung gesperrter Mitglieder.
