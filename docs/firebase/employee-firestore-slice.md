# Employee-Firestore-Slice (Mitarbeiter)

Status: **Zehnter Vertical Slice mit echter Firestore-Anbindung.** Beschreibt die Mitarbeiterverwaltung in `/company?tab=mitarbeiter`. Analog zu `docs/firebase/location-firestore-slice.md`.

> **Wichtig:** Die Collection `employees` ist ausschließlich die **fachliche Verwaltungsebene (Metadaten)**. Firebase Auth ist **nicht** Teil dieses Slices. Es werden keine Auth-Benutzer angelegt, gelöscht oder gesperrt, es gibt kein Admin SDK, keine Cloud Function und keine E-Mails.

---

## 1. Datenfluss

```
app/(app)/company/page.tsx
  → useLocations()                 ← eine gemeinsame Instanz (Standorte + Mitarbeiter)
  → EmployeesView(locations, …)
      → useEmployees() (src/hooks/useEmployees.ts)
        → employeeService (src/lib/services/employeeService.ts)
          ── isMockDataSource ──→ employeeRepository (In-Memory, config/employees.ts)
          ── isFirestoreDataSource ──→ firestoreEmployeeService (Firestore SDK)
```

Der lokale State ändert sich erst nach einem bestätigten Service-Ergebnis. Es gibt keine optimistischen Updates. Drawer und Dialoge halten nur die `employeeId` und lesen den Datensatz aus der Liste, sodass sie nach einer Mutation immer den aktuellen Stand zeigen.

## 2. Collection-Pfad

```
companies/{companyId}/employees/{employeeId}
```

Über `companyCollectionPaths.employees(companyId)` (bereits vorhanden) und `resolveCompanyId()`. **Dokument-ID = `Employee.id`**, nie als Datenfeld geschrieben (`withoutIdField`). Der Converter `employeeConverter` existierte bereits.

## 3. Datenmodell

Alle bisherigen Felder bleiben: `name`, `initials`, `email`, `phone?`, `role`, `location`, `status`, `lastLogin`, `invitationStatus`, `joinedAt?`, `history`. Additiv: `locationId?`, `createdAt?`, `updatedAt?`. Keine Breaking Migration der Mock-Daten.

`lastLogin` ist ein Anzeige-Snapshot ("Online", "Vor 2 Std.") und wird in diesem Slice nicht aus Auth berechnet.

## 4. `location` und `locationId`

- `location` bleibt der **lesbare Standortname** (Snapshot/Legacy). Die UI zeigt weiter diesen Namen.
- `locationId` ist die **stabile Beziehung** zu `companies/{companyId}/locations/{locationId}`.
- Bei einer Zuweisung werden **beide** gespeichert: `locationId = location.id`, `location = location.name`.
- **Altdaten ohne `locationId`** werden weiter korrekt angezeigt und sind bearbeitbar. Wird der Standort nicht geändert, bleibt der Altwert unangetastet.
- Wird ein Standort später umbenannt, steht im Mitarbeiter bis zur nächsten Zuweisung der alte Name. Das ist ein bekannter Snapshot-Effekt (siehe Abschnitt 12).

## 5. Standortquelle

Die Standortauswahl nutzt die echte Standortverwaltung statt `config/employees.locationNames`:

- `company/page.tsx` hält **eine** `useLocations()`-Instanz und reicht `locations`, `locationsLoading`, `locationsError` an `EmployeesView` weiter. Es gibt keine zweite Hook-Instanz, die auseinanderlaufen könnte.
- Auswahlwert = `location.id`, Label = `location.name`.
- **Nur aktive Standorte** sind neue Ziele.
- Ist der aktuelle Standort inaktiv, unbekannt oder ein Altwert ohne ID, bleibt er als Option „… (inaktiv)“ bzw. „… (bisheriger Wert)“ sichtbar. Er wird nicht still überschrieben; „Standort ändern“ ist erst nach einer echten Änderung klickbar.
- Solange die Standorte laden oder fehlgeschlagen sind, öffnet „Standort ändern“ nicht, sondern zeigt einen Hinweis.
- `InviteEmployeeDialog` bekommt ebenfalls die aktiven echten Standorte (nur Auswahl).

## 6. Historie

Jede echte Änderung hängt einen Eintrag an die `history` an (Format `DD.MM.YYYY`, wie bisher):

| Aktion | Meldung |
|---|---|
| Rolle ändern | „Rolle auf Laborleiter geändert.“ |
| Standort ändern | „Standort auf „Labor Stuttgart“ geändert.“ |
| Sperren | „Zugriff temporär gesperrt.“ |
| Reaktivieren | „Zugriff reaktiviert.“ |
| Zugriff entziehen | „Zugriff entzogen.“ |

Bei Firestore läuft das in einer **Transaktion**: Der Datensatz wird gelesen, die Historie erweitert und der Update im selben Schreibvorgang geschrieben. `createdAt` wird nie überschrieben, `updatedAt` bei jeder Mutation neu gesetzt, `undefined` in einem Update entfernt das Feld (`buildUpdatePayload`). Der Mock hängt gleich an.

Der Drawer nutzt `${timestamp}-${index}` als React-Key, damit wiederholte Meldungen nicht kollidieren.

## 7. Aktionen und Semantik

| Aktion | Wirkung | Firestore-backed |
|---|---|---|
| Rolle ändern | `role` | ja |
| Standort ändern | `location` + `locationId` | ja |
| Temporär sperren | `status = "Gesperrt"` | ja |
| Reaktivieren | `status = "Aktiv"` | ja |
| Zugriff entziehen | `status = "Gesperrt"`, eigene Historie | ja |
| Passwort-Reset | nur Hinweis | **nein (Placeholder)** |
| Einladung widerrufen | nur Hinweis | **nein (Placeholder)** |
| Mitarbeiter einladen | nur Hinweis, nichts gespeichert | **nein (Placeholder)** |

**Sperren, Reaktivieren und Zugriff entziehen sind fachliche Statusänderungen in PrüfCheckPro.** Sie sperren **nicht** den Login. Die Dialogtexte sagen das ausdrücklich und verweisen auf die spätere serverseitige Auth-Sperre. „Zugriff entziehen“ löscht nichts; Datensatz und Historie bleiben erhalten.

Dialoge und Buttons haben einen Pending-State (keine Doppel-Requests). Erfolgsmeldungen erscheinen erst nach bestätigtem Ergebnis; bei Fehlern bleibt der Dialog offen und zeigt eine Fehlermeldung.

## 8. Kein Hard-Delete

Mitarbeiter werden nie hart gelöscht, damit Historie und Referenzen erhalten bleiben. `removeEmployee` wurde aus Interface, Service, Repository und Hook entfernt. Es gibt keine Löschfunktion.

**Einladung widerrufen:** Eine noch nicht angenommene Einladung (`status`/`invitationStatus = "Ausstehend"`) hat im Modell keinen Zustand „widerrufen“ (`InvitationStatus` kennt nur „Angenommen“ und „Ausstehend“). Ohne das Employee-Modell dafür aufzublähen, bleibt der Widerruf ein **Placeholder** für den späteren Invitations-Slice. Der Button ist als „(später)“ markiert und zeigt nur einen Hinweis; es wird nichts gelöscht oder geändert.

## 9. Rollen sind keine Zugriffskontrolle

`employeeRoles` und `rolePermissions` bleiben **statische Produktkonfiguration** (`config/employees.ts`), nicht in Firestore. Die Rolle eines Mitarbeiters ist ein **Verwaltungsdatum**. Die Berechtigungsübersicht im Drawer ist reine UI. Der Slice führt keine rollenbasierte Zugriffskontrolle ein, und `role === "Admin"` steuert **keine** Firestore-Rechte.

## 10. Einladungen und Passwort-Reset

- **Einladungen** folgen im separaten Invitations-Slice. `InviteEmployeeDialog` sendet nichts und legt **keinen** Mitarbeiter an. Der Klick auf „Einladung senden“ schließt den Dialog und zeigt „Einladungen werden später serverseitig angebunden. Es wurde nichts gesendet.“ Der Einladungs-Bereich (`InvitationsView`) nutzt den Dialog weiterhin mit der statischen Namensliste als Fallback.
- **Passwort-Reset** ist nicht angebunden. Der Button zeigt „Passwort-Reset wird später über die Auth-Verwaltung angebunden.“ Es wird keine Firebase-Client-API genutzt, um fremden Mitarbeitern Reset-Mails zu schicken, und kein Fake-Erfolg gezeigt.

## 11. Seed

`scripts/seedEmployees.ts`:

- Schreibt `config/employees.ts` nach `companies/{companyId}/employees`, Dokument-ID = bestehende ID, `id` nicht als Feld, `sanitizeForFirestore()`.
- **`locationId`** wird nur gesetzt, wenn der Standortname **genau einen** Standort aus `config/locations.ts` trifft (alle sechs Mock-Mitarbeiter treffen eindeutig: Stuttgart, München, Remseck, Baustellenbüro Nord). Sonst entfällt `locationId`, der Legacy-Name bleibt, und das Skript gibt eine Warnung aus. Es wird nicht geraten.
- Legt **keine** Auth-Benutzer an. Emulator-only (`localhost:8080`), keine Secrets, keine `.env.local`. Idempotent, `--force` überschreibt.

Ausführen (Emulator vorher starten): `npx tsx scripts/seedEmployees.ts`.

## 12. Rules

`firestore.rules`: Block `companies/{companyId}/employees/{employeeId}` mit `allow read, write: if belongsToCompany(companyId);`. Keine Rollen- oder Claims-Logik. Das Feld `role` steuert keine Rechte.

## 13. Verifikation

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: grün.
- Isoliert über die Mock-Facade geprüft: Rolle, Standort (mit `locationId`), Sperren, Reaktivieren, Zugriff entziehen (Datensatz bleibt, Anzahl unverändert), Historie wächst, unbekannte ID liefert `undefined`, Service hat weder `removeEmployee` noch `getLocationNames`, `undefined` wird zu `deleteField()` und `id` fehlt im Payload, eindeutige Seed-Zuordnung aller Mock-Mitarbeiter.
- **Nicht getestet:** Firestore-Pfade gegen den Emulator (Transaktion, Seed); Oberfläche im echten, angemeldeten Betrieb.

## 14. Offene Punkte

- **Keine echte Auth-Verwaltung:** Login-Sperre, Passwort-Reset, Einladungs-E-Mails brauchen Admin SDK/Cloud Functions in einem späteren Backend-Slice.
- **Einladungen/Widerruf** folgen im Invitations-Slice (Zustand „widerrufen“ fehlt im Modell).
- **Keine Zugriffskontrolle** über die Rolle; Rules prüfen nur „angemeldet + eigene companyId“.
- **Standortname ist ein Snapshot:** wird ein Standort umbenannt, aktualisiert sich `employee.location` nicht automatisch; die Beziehung läuft über `locationId`.
- **Letzter Admin:** Es gibt keine Schutzregel gegen das Sperren des letzten aktiven Admins (bewusst keine Business-Engine).
- **Verbleibende Mock-/Snapshot-Werte außerhalb des Mitarbeiter-Tabs:** `companyProfile.employeesCount`, `employeeCount` je Standort, die Mitarbeiterliste der Company-Übersicht (`companyEmployees`), `AdminView`, `settings.ts` (liest `employees`/`locationNames` aus der Config) und `NewDeviceDialog` (`locationNames`) sind weiter Config-Daten und spiegeln Firestore-Änderungen nicht.
- **`lastLogin`** ist ein Anzeigewert, kein Auth-Datum.
- **Kein Realtime-Sync**, kein globales Audit-Log.
- **Emulator- und Browser-Test** ausstehend.
