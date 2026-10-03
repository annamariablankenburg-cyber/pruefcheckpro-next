# Invitation-Firestore-Slice (Einladungen)

Status: **Elfter Vertical Slice mit echter Firestore-Anbindung.** Beschreibt den Tab „Einladungen“ in `/company` und den Einladungsdialog. Analog zu `docs/firebase/employee-firestore-slice.md`.

> **Wichtig:** Eine Einladung ist ausschließlich ein **Metadatensatz** in Firestore. Dieser Slice versendet **keine E-Mail**, legt **keinen Firebase-Auth-Benutzer** an, nutzt **kein Admin SDK** und **keine Cloud Function**, erzeugt **keinen Einladungs-/Magic-Link** und enthält **keinen Annahmeflow**. UI und Texte sagen das ausdrücklich. Erfolgsmeldung: „Einladung gespeichert. Der E-Mail-Versand wird später serverseitig angebunden.“ – nie „verschickt“.

---

## 1. Datenfluss

```
app/(app)/company/page.tsx
  → useInvitations()  ← EINE Instanz (Einladungen-Tab, Mitarbeiter-Tab, Dialog)
  → useLocations()    ← eine Instanz (aktive Standorte für den Dialog)
  → InvitationsView(invitationsData, onInvite)
  → InviteEmployeeDialog(locations, onCreate = invitationsData.createInvitation)
        → invitationService (src/lib/services/invitationService.ts)
          ── isMockDataSource ──→ invitationRepository (In-Memory, config/invitations.ts)
          ── isFirestoreDataSource ──→ firestoreInvitationService (Firestore SDK)
```

Der Einladungsdialog wird vom Mitarbeiter-Tab und vom Einladungen-Tab geöffnet, es gibt aber nur **einen** Dialog und **einen** Einladungs-State auf der Company-Seite. Eine neu gespeicherte Einladung erscheint dadurch sofort in beiden Tabs. Der lokale State ändert sich erst nach einem bestätigten Service-Ergebnis (keine optimistischen Updates).

## 2. Collection-Pfad

```
companies/{companyId}/invitations/{invitationId}
```

`companyCollectionPaths.invitations(companyId)` und `invitationConverter` existierten bereits. **Dokument-ID = `Invitation.id`**, nie als Datenfeld geschrieben (`withoutIdField`). Die ID vergibt `addDoc` (Firestore) bzw. ein Generator (Mock).

## 3. Datenmodell

| Feld | Bemerkung |
|---|---|
| `name`, `email` | E-Mail wird getrimmt und kleingeschrieben gespeichert |
| `role` | `EmployeeRole` (statische Rollenliste) |
| `locationId?` + `location` | Beziehung + lesbarer Namens-Snapshot (siehe Abschnitt 8) |
| `status` | persistiert: `Ausstehend` \| `Angenommen` \| `Widerrufen` |
| `expiresAt` | ISO-Zeitpunkt |
| `createdAt?`, `updatedAt?` | ISO |
| `revokedAt?`, `acceptedAt?` | ISO |
| `message?` | optionale Nachricht |
| `activateImmediately` | Vormerkung für das spätere Onboarding, heute ohne Wirkung |

Gegenüber dem früheren Mock-Modell **entfallen**: der erfundene `link` (es gibt keinen Einladungslink), `lastReminder` (setzt Mailversand voraus), `invitedBy` (kein belastbarer Absender ohne Auth-Verwaltung), `initials` (wird aus dem Namen abgeleitet) und die gespeicherte `history` (der Verlauf wird aus den Zeitstempeln abgeleitet, siehe Abschnitt 5). Datumsfelder sind jetzt ISO statt `DD.MM.YYYY`-Strings; die Anzeige formatiert sie.

## 4. Statusmodell und Ablauf

- **Persistiert** werden nur `Ausstehend`, `Angenommen`, `Widerrufen`.
- **`Abgelaufen` wird nie gespeichert**, sondern abgeleitet: Status `Ausstehend` **und** `expiresAt` liegt vor dem Bezugszeitpunkt (`getInvitationDisplayStatus`). Angenommene und widerrufene Einladungen bleiben so, wie sie sind.
- Der Typ `InvitationStatus` ist der Anzeigestatus (alle vier Werte), `PersistedInvitationStatus` der gespeicherte. UI, Filter, KPIs und Badges arbeiten mit dem abgeleiteten Wert (`InvitationRow.displayStatus`).
- **Bezugszeitpunkt:** Firestore = echte Zeit (erst nach dem Mount gesetzt; bis dahin zeigt die Ansicht ein Skeleton statt falscher Zahlen). Mock = Demo-Datum `03.03.2026` (`INVITATION_DEMO_TODAY`), damit die Mockdaten sinnvoll wirken.
- **`expiresAt` wird beim Anlegen berechnet** (`jetzt + N × 24 h`). Der Dialog speichert nie das Label „7 Tage“, nur den Zeitpunkt. Kein Demo-Datum im Firestore-Modus.
- Vorteil gegenüber einem gespeicherten Status: kein Job, der abgelaufene Einladungen umschreiben müsste; der Wert kann nicht veralten.

## 5. Verlauf

Der Verlauf im Drawer wird **nicht gespeichert**, sondern aus `createdAt`, `acceptedAt`, `revokedAt` und dem abgeleiteten Ablauf erzeugt (`buildInvitationTimeline`). Es gibt kein Audit-Log.

## 6. Aktionen

| Aktion | Stand |
|---|---|
| Einladung speichern | **Firestore-backed** (nur Datensatz) |
| Einladungen anzeigen, filtern, suchen, KPIs | **Firestore-backed** |
| Einladung widerrufen | **Firestore-backed** (Transaktion) |
| Erinnerung senden | Placeholder („später“), nur Hinweis |
| Erneut senden | Placeholder („später“), nur Hinweis |
| Link kopieren | **entfernt** (es gibt keinen Link) |
| Löschen | **entfernt** (kein Delete) |
| Als „angenommen“ markieren | **bewusst nicht vorhanden** |

`Angenommen` existiert nur über Seed/Mock-Daten, bis ein echter Onboarding-Flow folgt.

### Widerruf

- Erlaubt nur, wenn die Einladung **noch wirklich ausstehend** ist (nicht angenommen, nicht widerrufen, nicht abgelaufen). Die UI blendet die Aktion sonst aus und erklärt es im Drawer. Die Facade prüft es zusätzlich (`InvitationRuleError`).
- Schreibt `status = "Widerrufen"`, `revokedAt`, `updatedAt`. Nichts wird gelöscht.
- Bei Firestore läuft er in einer **Transaktion**, die den gespeicherten Status **und** den Ablauf prüft: dieselbe gemeinsame Regel `isInvitationRevocable(...)` wie in der Facade, mit der aktuellen echten Zeit des Firestore-Services. Eine Einladung, die zwischen Vorprüfung und Transaktion abläuft, wird nicht mehr widerrufen. Bei abgelaufen / angenommen / bereits widerrufen (oder ungültigem `expiresAt`) wirft die Transaktion einen `InvitationRuleError` mit verständlicher Meldung.
- Der Bestätigungsdialog hat Pending-State, zeigt Fehler inline, bleibt bei Fehler offen und ist während des Speicherns nicht schließbar (ESC/Overlay/Close werden ignoriert).

## 7. Duplikat-Prüfungen

Vor dem Anlegen prüft `invitationService.createInvitation` (für Mock und Firestore gleich), case-insensitiv und getrimmt:

1. Existiert bereits eine **ausstehende, nicht abgelaufene** Einladung mit derselben E-Mail? → blockiert („… bereits eine ausstehende Einladung …“). Abgelaufene, widerrufene und angenommene Einladungen blockieren **nicht**.
2. Existiert bereits ein **Mitarbeiter** mit derselben E-Mail? → blockiert. Die Mitarbeiter-E-Mails kommen über `employeeService.getEmployees()` – derselbe Service wie die Mitarbeiterverwaltung, also **keine zweite Mitarbeiterquelle**.

Die offene Einladung wird zuerst geprüft, weil ihre Meldung hilfreicher ist.

**Bekannte Race-Condition:** Die Prüfung liest den Bestand und schreibt danach – nicht atomar. Zwei gleichzeitige Anfragen aus verschiedenen Sitzungen könnten beide bestehen und zwei ausstehende Einladungen für dieselbe Adresse erzeugen. Es gibt keinen Unique-Constraint. Eine harte Garantie bräuchte eine Server-Funktion oder ein deterministisches Dokument je E-Mail.

## 8. Standortbeziehung

Der Dialog nutzt die aktiven Standorte der gemeinsamen `useLocations()`-Instanz (Wert = `location.id`, Label = `location.name`). Gespeichert werden `locationId` **und** `location`. Seed-/Mock-Einladungen ohne `locationId` bleiben mit dem Legacy-Namen gültig. Ist kein aktiver Standort verfügbar oder laden die Standorte noch bzw. fehlgeschlagen, lässt sich nicht speichern. Wird ein Standort umbenannt, bleibt in der Einladung der alte Name (Snapshot), die Beziehung läuft über `locationId`.

## 9. Mitarbeiter-Slice unverändert

Es wurde nichts zurückgebaut: kein `removeEmployee`, keine Fake-Passwort-Resets oder Auth-Sperren, `locationId` bleibt. Einzige Anpassung: Der Mitarbeiter-Tab hat keinen eigenen Fallback-Einladungsdialog mehr, sondern öffnet über `onInvite` den gemeinsamen Dialog der Company-Seite. Der Mitarbeiter-Placeholder „Einladung widerrufen (später)“ bleibt bewusst unverändert (siehe offene Punkte).

## 10. Seed

`scripts/seedInvitations.ts`:

- Schreibt `config/invitations.ts` nach `companies/{companyId}/invitations`, Dokument-ID = bestehende ID (`inv-eva`, …), `id` nicht als Feld, `sanitizeForFirestore()`.
- Beispiele: zwei ausstehende, eine angenommene, eine widerrufene und eine „abgelaufene“ (Status `Ausstehend`, `expiresAt` in der Vergangenheit).
- **Zeitstempel relativ zum Seed-Zeitpunkt**, weil die Mockdaten auf März 2026 datiert sind und im Firestore-Modus das echte Datum gilt. So bleiben die ausstehenden Beispiele wirklich ausstehend und die abgelaufene wirklich abgelaufen.
- `locationId` nur bei eindeutigem Namens-Treffer in `config/locations.ts`.
- Keine Tokens/Links, keine Auth-Benutzer, keine E-Mails. Emulator-only (`localhost:8080`), keine Secrets, keine `.env.local`. Idempotent, `--force` überschreibt.

Ausführen (Emulator vorher starten): `npx tsx scripts/seedInvitations.ts`.

## 11. Rules

`firestore.rules`: Block `companies/{companyId}/invitations/{invitationId}` mit `allow read, write: if belongsToCompany(companyId);`. Keine Rollen- oder Claims-Logik. Die Dokumente enthalten keine Tokens oder Links.

## 12. Verifikation

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: grün.
- Isoliert über die Mock-Facade geprüft: abgeleiteter Ablaufstatus inklusive Grenzfall, Duplikat-Check (ausstehend, case-insensitiv/getrimmt; vorhandener Mitarbeiter), abgelaufene Einladung blockiert nicht, erneutes Einladen nach Widerruf, Widerruf (ausstehend ok; doppelt, angenommen, abgelaufen, unbekannte ID), Service ohne Delete/Update, abgeleiteter Verlauf.
- **Nicht getestet:** Firestore-Pfade gegen den Emulator (Transaktion, Seed); Oberfläche im angemeldeten Echtbetrieb.

## 13. Offene Punkte

- **Echter Versand/Onboarding:** E-Mail-Versand, Einladungslink/Token, Annahme (inkl. Mitarbeiter-/Auth-Anlage) und Erinnerungen brauchen ein Backend (Admin SDK/Cloud Functions) in einem späteren Slice. Dort gehört auch `acceptedAt` hin.
- **Race-Condition** beim Duplikat-Check (Abschnitt 7).
- **Mitarbeiter-Tab:** Der Placeholder „Einladung widerrufen (später)“ für ausstehende Mitarbeiter ist noch nicht mit dem Widerruf einer Einladung verknüpft.
- **`invitedBy`/Absender** fehlt, bis eine belastbare Nutzeridentität in den Datensätzen existiert.
- **`AdminView`** liest die Einladungs-Mockdaten weiter direkt aus der Config (zählt ausstehende anhand des Demo-Datums) und spiegelt Firestore-Änderungen nicht.
- **Keine Rollen-/Claims-Prüfung**, kein Realtime-Sync, kein Audit-Log.
- **Emulator- und Browser-Test** ausstehend.
