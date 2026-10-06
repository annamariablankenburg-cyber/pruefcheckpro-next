# Role-Firestore-Slice (Rollen & Berechtigungen)

Status: **Zwölfter Vertical Slice mit echter Firestore-Anbindung.** Beschreibt den Tab „Rollen & Rechte“ in `/company` sowie die Rollenauswahl im Mitarbeiter- und Einladungs-UI. Analog zu `docs/firebase/employee-firestore-slice.md` und `invitation-firestore-slice.md`.

> **Wichtig:** Rollen und Berechtigungen sind **Verwaltungsdaten**. Sie steuern die Verwaltungslogik und Darstellung, **nicht** die serverseitige Zugriffskontrolle. Es gibt **keine** dynamische Auswertung der Rollen-Dokumente in den Firestore Rules, **keine** Custom Claims, **kein** Admin SDK, **keine** serverseitige Rollenvergabe und **keine** echten API-Rechte. Die UI sagt das ausdrücklich: „Diese Rollen und Berechtigungen steuern aktuell die Verwaltungslogik und Darstellung. Die serverseitige Durchsetzung folgt in einem späteren Security-Slice.“ Es gibt keinen Text wie „hat jetzt technisch keinen Zugriff mehr“.

---

## 1. Datenfluss

```
app/(app)/company/page.tsx
  → useRoles()        ← EINE Instanz (Rollen-Tab, Mitarbeiter-Tab, Einladungen-Tab, Dialoge)
  → useEmployees(roles)   ← eine Instanz (Mitarbeiter-Tab + Benutzerzahlen im Rollen-Tab)
  → useInvitations(roles) ← eine Instanz
  → <RolesProvider roles>  (reicht dieselbe Liste an reine Anzeige-Komponenten weiter)
  → RolesView(rolesData, employeesData)
  → EmployeesView(employeesData, roles, …)
  → InviteEmployeeDialog(roles = activeRoles, …)
        → roleService (src/lib/services/roleService.ts)
          ── isMockDataSource ──→ roleRepository (In-Memory, config/roles.ts)
          ── isFirestoreDataSource ──→ firestoreRoleService (Firestore SDK)
```

Es gibt genau **eine** Rollenquelle pro Seite. `config/roles.ts` ist im Firestore-Modus nur noch Vorlage für den Seed (und im Mock-Modus die Datenquelle); `config/employees.ts` enthält keine Rollenlisten oder Berechtigungsübersichten mehr (`employeeRoles`, `rolePermissions` und `getEmployeeRoles()` sind entfernt). Der `RolesProvider` ist kein zweiter State, sondern transportiert nur die Liste der Seite an `EmployeeRoleBadge` und die Detail-Drawer (Rollenname/-farbe/Berechtigungsübersicht), damit sie nicht durch jede Tabelle gereicht werden muss. Der lokale State ändert sich erst nach einem bestätigten Service-Ergebnis (keine optimistischen Updates).

## 2. Collection-Pfad

```
companies/{companyId}/roles/{roleId}
```

`companyCollectionPaths.roles(companyId)` und `roleConverter` existierten bereits. **Dokument-ID = `Role.id`**, nie als Datenfeld geschrieben (`withoutIdField`). Systemrollen haben stabile IDs, benutzerdefinierte Rollen eine von `addDoc` vergebene ID.

## 3. Rollenmodell

| Feld | Bemerkung |
|---|---|
| `name`, `description` | Name ist über alle Rollen eindeutig (ohne Groß-/Kleinschreibung) |
| `type` | `System` \| `Benutzerdefiniert` (entspricht „isSystem“) |
| `status` | `Aktiv` \| `Archiviert` (entspricht „isActive“) |
| `color` | `primary \| success \| warning \| danger \| neutral` (bestehende Design-Tokens) |
| `permissions` | Map `permissionKey → boolean` |
| `createdAt?`, `updatedAt?` | ISO-Strings |

Das bestehende UI-Modell (`type`/`status` statt `isSystem`/`isActive`) wurde **bewusst beibehalten**, damit keine zweite Wahrheit und kein Umbau der vorhandenen Komponenten entsteht. Gegenüber dem früheren Mock-Modell **entfallen**: `userCount` (wird aus den Mitarbeitern abgeleitet, siehe Abschnitt 8), `updatedBy` (keine belastbare Nutzeridentität in den Datensätzen) und die vorformatierten Datumsstrings (jetzt ISO, die Anzeige formatiert).

## 4. Berechtigungsmodell

Die **Berechtigungs-Taxonomie** (welche Berechtigungen es gibt und wie sie gruppiert sind) ist statische Produktkonfiguration in `config/roles.ts` (`permissionCategories`). Pro Rolle wird nur gespeichert, welche Schlüssel gewährt sind.

Die vorhandenen deutschen Schlüssel (z. B. `proben.ansehen`, `kunden.bearbeiten`, `administration.mitarbeiter_verwalten`) wurden **nicht** durch das englische Vorschlags-Set (`customers.read` …) ersetzt: Die bestehende UI-Domäne ist feiner (ansehen/erstellen/bearbeiten/löschen) und bereits in 11 Module gruppiert (Dashboard, Proben, Prüfungen, Kunden, Projekte, Geräte, Laborbuch, Kalender, PDF, KI, Administration). Eine Umbenennung hätte reinen Aufwand ohne Nutzen erzeugt und bestehende Rollen unlesbar gemacht. Die Gruppierung nach Modulen (mit Zähler „gewährt/gesamt“, Suche und Auf-/Zuklappen) war bereits vorhanden und bleibt.

Die Taxonomie wird in diesem Slice nicht erweitert. Fachlich noch nicht abgebildet sind eigene Schlüssel für Berichte und Einladungen (heute über PDF bzw. `administration.mitarbeiter_verwalten` mit abgedeckt) – siehe „Offene Punkte“.

**Normalisierung:** Beim Lesen und Schreiben (`normalizePermissions`) werden nur bekannte Schlüssel behalten, jeder mit explizitem `true`/`false`. Entfernte oder unbekannte Schlüssel fallen weg, fehlende gelten als `false`. Die Map enthält Schlüssel mit Punkt – als Map-Schlüssel in Firestore zulässig; geschrieben wird immer die ganze Map (`setDoc`/`addDoc` bzw. Ersetzen des Feldes `permissions` per Update), nie ein Punktpfad.

## 5. Systemrollen

`admin` (Administrator), `laborleiter`, `pruefer`, `azubi`, `gast` – stabile IDs, `type: "System"`.

- **Kein Löschen, kein Archivieren** (Regel in Facade **und** Firestore-Transaktion).
- **Name, Beschreibung und Farbe sind fest**; änderbar sind nur die Berechtigungen.
- Die **Administrator-Rolle ist komplett festgeschrieben**: auch ihre Berechtigungen sind nicht änderbar (Schutz vor versehentlichem Abwählen; Rollen-Verwaltung bliebe sonst ohne Admin-Rechte).
- Alle Prüfungen (`assertRoleChangeAllowed`, `assertRoleArchivable`) laufen mit dem **gelesenen** Datensatz in der Transaktion, nicht gegen einen veralteten Client-Stand.

## 6. Benutzerdefinierte Rollen (umgesetzt)

Das bestehende UI kannte Custom Roles bereits (Erstellen, Kopieren, Duplizieren, Archivieren, Löschen). Sie wurden deshalb **vollständig umgesetzt**:

- **Erstellen** (auch als Kopie einer bestehenden Rolle oder per Vorlage): `type: "Benutzerdefiniert"`, `status: "Aktiv"`, Name eindeutig.
- **Bearbeiten**: Name, Beschreibung, Farbe, Berechtigungen – im Drawer als eigener Bearbeitungsmodus mit „Speichern“/„Abbrechen“ (ein Schreibvorgang statt eines Writes pro Schalter).
- **Archivieren/Reaktivieren** statt Löschen. Archivierte Rollen sind nicht mehr für neue Zuweisungen wählbar; bestehende Zuweisungen bleiben erhalten (die Rolle bleibt auflösbar und sichtbar).
- **Kein Hard Delete.** Das frühere „Löschen“ ist entfernt, weil Mitarbeiter und Einladungen auf Rollen verweisen können.
- Mock-Beispielrollen `qualitaetsmanager` und `baustellenleiter` existierten bereits in der Config und werden mitgeseedet. Es wurden **keine** zusätzlichen Rollen erfunden.

**Duplikat-Prüfung:** Rollenname eindeutig über alle Rollen (inkl. Systemrollen und archivierter), ohne Groß-/Kleinschreibung. Bekannte Einschränkung: der Check liest den Bestand und schreibt danach – **nicht atomar**; zwei gleichzeitige Anfragen aus verschiedenen Sitzungen könnten beide durchkommen (kein Unique-Constraint).

## 7. Service

`IRoleService` (Promise-basiert): `getRoles`, `getRoleById`, `createRole`, `updateRole`, `deactivateRole`, `reactivateRole` sowie statische Taxonomie-Helfer (`getPermissionCategories`, `getAllPermissionKeys`, `buildPermissions`). **Kein `removeRole`/`deleteRole`.** Fachliche Regelverstöße kommen als `RoleRuleError` mit verständlicher Meldung bis in die UI. Regeln liegen in `src/lib/roles/roleRules.ts` und gelten für Mock und Firestore gleich.

## 8. Rolle in Mitarbeitern und Einladungen

Wie bei Standorten: **`roleId` + lesbarer Snapshot `role`** (statt String-Union `EmployeeRole`, die mit dynamischen Rollen kollidiert wäre und entfernt wurde).

- **Auswahl:** Mitarbeiter-„Rolle ändern“ und der Einladungsdialog bieten **nur aktive Rollen** der gemeinsamen `useRoles()`-Instanz an (Wert = `role.id`, Label = Name). Es gibt **keine Fallback-Mockliste**: Sind die Rollen nicht geladen oder fehlgeschlagen, lassen sich Rolle ändern bzw. Einladung speichern nicht, mit verständlicher Meldung.
- **Speichern:** `roleId` und `role` (Name) werden gemeinsam geschrieben. Die Einladungs-Facade prüft zusätzlich, dass die Rolle existiert und aktiv ist, und übernimmt den Namen aus der Rolle (nicht blind vom Client).
- **Anzeige/Legacy:** Bestehende Datensätze mit nur `role` bleiben gültig. `resolveRole` löst auf: 1. `roleId`, 2. exakter Rollenname, 3. Alias (`"Admin"` → `admin`). Angezeigt wird der **aktuelle** Rollenname (bzw. der Snapshot, solange Rollen laden oder die Rolle unbekannt ist). Altdaten werden **nicht still überschrieben**; im Rollen-Dialog erscheint ein nicht auflösbarer oder archivierter Altwert als „bisheriger Wert“/„archiviert“.
- **Benutzerzahlen:** pro Rolle abgeleitet aus den Mitarbeitern (`countRoleUsers`), nicht gespeichert. Solange Mitarbeiter laden oder fehlschlagen, zeigt der Rollen-Tab „–“.
- **Filter/Suche:** Rollen-Chips in Mitarbeiter- und Einladungsfiltern kommen aus den echten (nicht archivierten) Rollen; statt einer festen Liste.
- **Berechtigungsübersicht** im Mitarbeiter-Drawer: aus der echten Rolle (gewährt/gesamt je Modul) statt der früheren illustrativen Textliste.
- **Mock-Daten:** Mitarbeiter und Einladungen in `config/` tragen jetzt `roleId`; „Admin“ heißt dort „Administrator“ (wie die Rolle).
- `AdminView` (`/admin`) liest Rollen jetzt über `useRoles()` statt aus der Config; die Benutzerzahlen kommen dort aus der (weiterhin gemockten) Mitarbeiterliste dieser Seite.

Bestehende Slices bleiben erhalten: kein Employee-/Invitation-Hard-Delete, `locationId`, Invitation-Duplicate-Check, kein Fake-Mailversand, keine Fake-Auth-Sperre.

## 9. UI-Verhalten

- `RolesView`: Skeleton beim Laden, Fehlerkarte mit „Erneut versuchen“, Empty State (z. B. wenn der Seed noch nicht lief), Sicherheitshinweis, KPIs (Rollen gesamt, Systemrollen, benutzerdefinierte, Benutzer mit Administratorrechten, aktive Berechtigungen).
- Alle Mutationen (Erstellen, Duplizieren, Speichern, Archivieren/Reaktivieren): Pending-State, Buttons deaktiviert (keine Doppelrequests), Dialog/Drawer **während des Speicherns nicht schließbar** (ESC/Overlay/Close ignoriert), Fehler inline, bei Fehler bleibt der Dialog offen, Schließen/Erfolgsmeldung erst nach bestätigtem Ergebnis.
- „Exportieren“ bleibt ein ehrlicher UI-Platzhalter (Toast, es wird keine Datei erzeugt).

## 10. Seed

`scripts/seedRoles.ts`:

- Schreibt `config/roles.ts` (5 Systemrollen + 2 vorhandene Beispielrollen) nach `companies/{companyId}/roles`, Dokument-ID = stabile Rollen-ID, `id` nicht als Feld, `sanitizeForFirestore()`.
- Emulator-only (`localhost:8080`, Projekt `demo-pruefcheckpro-emulator`), keine Secrets, keine `.env.local`. Idempotent (vorhandene Dokumente werden übersprungen), `--force` überschreibt.
- Ausführen (Emulator vorher starten): `npx tsx scripts/seedRoles.ts`.

**Hinweis:** Wurden Mitarbeiter/Einladungen schon vorher geseedet, tragen sie nur den alten Namen (`"Admin"` …). Das ist kompatibel (Legacy-Auflösung); mit `--force` neu geseedete Datensätze haben zusätzlich `roleId`.

## 11. Rules

`firestore.rules`: Block `companies/{companyId}/roles/{roleId}` mit `allow read, write: if belongsToCompany(companyId);`. **Keine** dynamische Role-Abfrage, keine Claims-Logik – das hätte in diesem Slice bestehende Nutzer aussperren können. Das Rollen-Dokument ist reines Verwaltungsdatum.

## 12. Verifikation

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: siehe Abschlussbericht.
- Isoliert über die Mock-Facade geprüft: Sortierung, Legacy-Auflösung („Admin“, Name, `roleId` gewinnt), Benutzerzahlen, Namens-Eindeutigkeit (case-insensitiv, auch gegen Systemrollen), Erstellen/Bearbeiten/Archivieren/Reaktivieren, Systemrollen-Schutz (Name/Farbe/Beschreibung, Administrator-Berechtigungen, kein Archivieren), unbekannte Berechtigungsschlüssel, kein Delete im Service, Einladungs-Rollenprüfung (archiviert, unbekannt, fehlende ID, Snapshot aus der Rolle).
- **Nicht getestet:** Firestore-Pfade gegen den Emulator (Transaktionen, `addDoc`, Seed); Oberfläche im angemeldeten Echtbetrieb.

## 13. Offene Punkte

- **Security-Enforcement:** Rules, Custom Claims, Admin SDK und serverseitige Rollenvergabe folgen in einem eigenen Security-Slice. Bis dahin kann **jeder angemeldete Nutzer der eigenen Firma** Rollen lesen und schreiben (`belongsToCompany`), unabhängig von seiner Rolle.
- **Rollenname-Race:** Eindeutigkeit ist nicht atomar (Abschnitt 6).
- **Umbenennung:** Wird eine benutzerdefinierte Rolle umbenannt, zeigen Mitarbeiter/Einladungen den neuen Namen (Auflösung über `roleId`), der gespeicherte Snapshot bleibt alt, bis der Datensatz neu geschrieben wird.
- **Taxonomie:** keine eigenen Schlüssel für Berichte und Einladungen; keine Erweiterung in diesem Slice.
- **Export** der Rolle als Datei fehlt (Platzhalter).
- **Kein Audit-Log, kein Realtime-Sync, kein „Geändert von“** (keine belastbare Nutzeridentität).
- **Mitarbeiter-/Einladungsdaten im Emulator** ohne `roleId` (Altseed) werden nur per Name aufgelöst; Umbenennungen der Systemrollen sind ausgeschlossen, daher ist das stabil.
- `AdminView` kombiniert Firestore-Rollen mit gemockten Mitarbeitern (Benutzerzahlen nur dort aus der Mock-Liste).
- **Emulator- und Browser-Test** ausstehend.
