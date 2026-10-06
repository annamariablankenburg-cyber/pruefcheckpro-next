# Rollenbasierte Firestore Rules – Phase 2 (Fach-Collections)

Status: **Rules und Emulator-Tests sind implementiert** (Ergebnis siehe Abschnitt 10). **Nicht deployt** – siehe Abschnitt 9 (Deployment-Voraussetzungen). Die UI der Fachseiten ist noch **nicht** angepasst (UI Permission Gating Phase 2 ist der nächste Slice, Abschnitt 8).

Phase 2 erzwingt serverseitig Lesen, Erstellen, Bearbeiten und Löschen für die acht Fach-Collections `customers`, `projects`, `devices`, `samples`, `testValues`, `reports`, `calendarEvents`, `laborbook`. Bisher prüften sie nur „aktive Membership der Firma“ (`belongsToCompany`). Phase 1 (`roles`, `employees`, `invitations`, `locations`) bleibt unverändert, siehe `docs/firebase/role-permission-rules-phase1.md`. **Damit hängt keine Company-Collection mehr im Nur-Membership-Block; `belongsToCompany` ist aus den Rules entfernt.**

---

## 1. Scope

- **Ja:** `firestore.rules` (acht Blöcke, zwei kleine Berichte-Helper), Test-Fixtures, Phase-2-Testmatrix, Sync-Tests, Doku.
- **Nein:** Schema-/Pflichtfeld-/Status-Validierung (späterer Slice), Fachseiten-UI (UI Gating Phase 2), Deployment, echte Daten, Server-Aktionen (`assignRole`/`setMemberStatus` unverändert), Rules der Phase-1-Collections.

## 2. Mapping Collection → Operation → Permission

Ausschließlich Schlüssel aus `src/config/roles.ts` (45). Die Tabelle entspricht `docs/database/permissions.md` (Abschnitt 5) und dem tatsächlichen Code (Services, Hooks, Dialoge); getestet durch `tests/firestore/rules-config-sync.test.ts` gegen `PHASE2_PERMISSIONS` (Testfixture) und `allPermissionKeys`.

| Collection | get / list | create | update | delete |
| --- | --- | --- | --- | --- |
| `customers` | `kunden.ansehen` | `kunden.erstellen` | `kunden.bearbeiten` | `kunden.loeschen` |
| `projects` | `projekte.ansehen` | `projekte.erstellen` | `projekte.bearbeiten` | `projekte.loeschen` |
| `devices` | `geraete.ansehen` | `geraete.erstellen` | `geraete.bearbeiten` | `geraete.loeschen` ¹ |
| `samples` | `proben.ansehen` | `proben.erstellen` | `proben.bearbeiten` | `proben.loeschen` |
| `testValues` | `pruefungen.ansehen` | `pruefungen.erstellen` ² | `pruefungen.bearbeiten` ² | `pruefungen.loeschen` |
| `reports` | `berichte.ansehen` | `berichte.erstellen` ³ | `berichte.bearbeiten` ³ | `berichte.loeschen` ¹ |
| `calendarEvents` | `kalender.ansehen` | `kalender.termine_erstellen` ⁴ | `kalender.bearbeiten` | `kalender.loeschen` |
| `laborbook` | `laborbuch.ansehen` | `laborbuch.erstellen` | `laborbuch.bearbeiten` | `laborbuch.loeschen` ¹ |

¹ **Admin-only-Löschrecht** (`ADMIN_ONLY_DELETE_PERMISSION_KEYS`): Vergabe ist in den Rollen-Rules geschützt; hier gilt nur der gespeicherte Wert über `hasPermission()` – keine zusätzliche Admin-Abfrage.
² Prüfwerte sind Prüfungen (`pruefungen.*`), nicht Proben. Zusätzlich: `sampleId` == Dokument-ID beim Anlegen, danach unveränderlich (Abschnitt 4).
³ Der **Wechsel in einen Export-Status** („PDF exportiert“, „Excel exportiert“) verlangt zusätzlich `pdf.exportieren` (Policy `docs/database/permissions.md`: `pdf.exportieren` = Aktion „exportieren“). Das gilt für `update` (nur beim *Wechsel* in den Status; Änderungen an einem bereits exportierten Bericht sind normale Updates) und für `create` mit Export-Status.
⁴ Legacy-Name; es gibt kein `kalender.erstellen`.

**Ist-Flow-Abgleich (Update = Statuswechsel):** Archivieren, Deaktivieren, Reaktivieren, Pausieren, Abschließen, Wiederöffnen, Wiederherstellen, Starten sind im Code `updateDoc`-Aufrufe (`archiveCustomer`, `pauseProject`, `archiveDevice`, `completeSample`, `archiveReport`, `archiveLaborbookEntry` …). Es gibt dafür **keinen eigenen Schlüssel**; sie laufen unter `*.bearbeiten` (dokumentiert in `docs/database/permissions.md`: „inkl. Status/Archiv“). Duplizieren einer Probe ist ein `create` (`proben.erstellen`; der Service liest vorher). Bulk-Archivieren/-Löschen sind `writeBatch`-Updates bzw. -Deletes mit denselben Schlüsseln.

**Operationen ohne eigenen Schlüssel:** keine offen. Für jede Operation existiert ein Schlüssel; es wurde nichts „geraten“. Ausdrücklich nicht geprüft/abgeleitet: `dashboard.anzeigen`, `ki.verwenden` (keine Datenpfade dieser Collections).

## 3. Rules-Aufbau und Helper

Es wird die bestehende Kette wiederverwendet (keine zweite Permission-Engine):

`request.auth.uid` → `userMemberships/{uid}` (`hasActiveMembership(companyId)`) → `membership.roleId` (`currentRoleId()`) → `companies/{companyId}/roles/{roleId}` mit `status == "Aktiv"` → `permissions[key] == true` (`hasPermission(companyId, key)`).

Neu: **keine neuen Rules-Helper für die Berechtigungen**. Jede Collection hat vier kurze `allow`-Zeilen mit `hasPermission(companyId, "<Schlüssel>")` (get/list, create, update, delete getrennt, **kein** `allow read, write`). Nur für Berichte gibt es zwei kleine Helper: `reportIsExported(data)` (Status ∈ Export-Status, gespiegelt aus `ReportStatus`) und `reportExportStatusEntered()` (neuer Status ist Export-Status **und** unterscheidet sich vom gespeicherten). `belongsToCompany` wurde entfernt (nirgends mehr verwendet). Der Test `rules-config-sync` verlangt genau vier `allow`-Regeln je Collection und verbietet `belongsToCompany`.

## 4. Tenant-Isolation und Cross-Reference-Checks

**Tenant-Isolation:** Jede Operation läuft über `hasPermission(companyId, …)` mit der `companyId` aus dem **Pfad**: aktive Membership dieser Firma, Rolle aus **derselben** Firma (`rolePath(companyId, roleId)`), Rolle aktiv. Ein User aus Firma A mit allen Rechten kann in Firma B nichts lesen, auflisten, anlegen, ändern oder löschen (Test je Collection, beide Richtungen). Eine gleichlautende `roleId` in Firma B mit allen Rechten nützt einem Mitglied von Firma A nicht (Test `split-role`).

**Cross-Reference-Checks – bewusst keine `exists()`/`get()`-Prüfungen.** Geprüfte Referenzfelder: `project.customerId`, `device.locationId`, `sample.customerId/projectId`, `testValue.sampleId/projectId/customerId`, `report.projectId/customerId/probeId`, `calendarEvent.sampleId/projectId/testValueId/deviceId`, `laborbook.projectId/customerId/probeId/deviceId`. Begründung:

1. Alle Referenzen sind **einfache Dokument-IDs ohne Pfad**. Der Client löst sie ausschließlich innerhalb von `companies/{aktiveFirma}/…` auf. Eine ID, die in Firma B existiert, ist in Firma A nur eine tote Zeichenkette; sie macht **keine** Daten aus Firma B les- oder schreibbar. Es gibt keinen Weg, über eine Referenz einen fremden Pfad zu adressieren.
2. Die Relationen sind optional und oft nur Anzeige-Snapshots (z. B. `kunde`/`projekt` als Namen neben der ID); Altdaten und Seeds enthalten Referenzen auf nicht (mehr) existierende Datensätze. Es gibt keinen Cascade-Delete und keine referenzielle Sperre (TODOs in den Services) – ein `exists()` beim Anlegen würde legitime Abläufe (gleichzeitiges Löschen, Altdaten) brechen und bringt gegen Cross-Company-Zugriff nichts.
3. Zählgrenzen: Bulk-Batches (bis 500 Operationen) haben ein Limit von 20 Access-Calls; zusätzliche `exists()` je Dokument würden Bulk-Archivieren/-Löschen sprengen. Mit den heutigen Regeln braucht jede Operation nur die zwei Dokumente Membership und Rolle (wiederholte Zugriffe zählen einmal) – Test: Batch mit je 25 Updates/Deletes.

**Einzige strukturelle Prüfung:** `testValues` – das Prüfwert-Dokument liegt unter der **Probennummer** (`createTestEntry` schreibt `setDoc(…/testValues/{sampleId})`, `sampleId` und `id` spiegeln die Dokument-ID). Die Rules verlangen deshalb beim `create` `sampleId == testValueId` und verbieten im `update` jede Änderung von `sampleId`. Damit lässt sich weder eine abweichende noch eine fremde Probenreferenz einschleusen. Es entsteht **kein** Cross-Read (kein Access-Call).

Nicht Teil dieses Slices: Pflichtfelder, Status-Übergänge, Typ-/Formvalidierung.

## 5. Delete-Policy

- Hard Delete nur mit dem **eigenen** `*.loeschen`-Schlüssel (acht Stück, alle in der Taxonomie vorhanden). `bearbeiten`, `erstellen` oder `*_verwalten` erlauben nie Löschen (Tests A und D: eine Rolle nur mit `erstellen`/`bearbeiten` darf nicht löschen).
- `geraete.loeschen`, `laborbuch.loeschen`, `berichte.loeschen` sind Admin-only-Löschrechte: Laborleiter → DENY (aktuelle Matrix), Administrator → ALLOW, Custom Role ohne Schlüssel → DENY, Custom Role mit gespeichertem Schlüssel → ALLOW (die Vergabe ist in den Rollen-Rules geschützt), archivierte Rolle → DENY.
- **Offen (nicht umgesetzt):** die Empfehlung in `docs/database/permissions.md` Abschnitt 6, `delete` zusätzlich auf *archivierte* Datensätze zu beschränken. Das wäre eine Produktentscheidung mit UI-Folgen (heute löschen die Dialoge ohne Archivierung) und ist nicht Teil von „Permissions“.

## 6. Fehlende, kaputte und archivierte Rollen, Legacy 31 → 45, Custom Roles

Fail-closed für alle acht Collections (Matrix-Test mit 22 Personas): Membership ohne `roleId`, leere `roleId`, Nicht-String-`roleId`, unbekannte Rolle, Rolle nur in anderer Firma, **archivierte** Rolle, Rolle ohne `permissions`-Feld, leere `permissions`, gesperrte Membership, fehlende Membership, Mitglied einer anderen Firma, anonym → jeweils alles DENY. Ein Schlüssel muss **exakt `true`** sein; `false`, fehlend, `"true"`, `1`, `null`, `{}` und unbekannte oder anders geschriebene Zusatzschlüssel gewähren nichts.

**Legacy-Rollen mit nur 31 Schlüsseln:** die 14 neuen Schlüssel fehlen und gelten als `false`; es gibt keine Kompatibilitätsausnahme. Die Legacy-Persona behält alle alten Rechte (Kunden, Projekte, Proben, Prüfungen, Geräte lesen/bearbeiten, Laborbuch lesen/bearbeiten, Kalender lesen/Termin anlegen), verliert aber: Geräte anlegen/löschen, Laborbuch anlegen/löschen, Kalender bearbeiten/löschen und **alle** Berichte (`berichte.*`). Siehe Deployment-Voraussetzungen.

**Custom Roles:** Beispiel-Custom-Role „Baustellenleiter“ aus der Config und beliebige Rollen werden im Matrix-Test nach ihrer gespeicherten Permission-Map beurteilt; je Collection und Operation gibt es eine Rolle mit **genau einem** Schlüssel (32 Rollen) – nur diese Operation ist erlaubt.

## 7. Service-Abhängigkeiten (Rules verlangen sie bewusst nicht)

Die Rules verlangen für Schreibvorgänge **kein** `*.ansehen`. Der Client liest aber vor/nach dem Schreiben; wer nur schreiben darf, sieht dann eine Fehlermeldung, obwohl (teilweise) geschrieben wurde. Beim Einrichten von Custom Roles ist `*.ansehen` mitzugeben (Test `J`):

| Service-Ablauf | liest zusätzlich | Folge ohne `*.ansehen` |
| --- | --- | --- |
| `createSample`, `createTestEntry` | `getDoc` auf die neue ID (Eindeutigkeit) | Anlegen scheitert im Client |
| alle `update*`/Statuswechsel | `getDoc` nach dem Schreiben | Update gespeichert, Client meldet Fehler |
| `updateLaborbookEntry` | `transaction.get` (Historie) | Aktualisieren scheitert (Rules verweigern das Lesen in der Transaktion) |
| `duplicateSample` | liest alle Proben | scheitert |
| `removeX`, Bulk-Delete/-Update | nichts | funktioniert mit dem Schlüssel allein |
| Dialoge | siehe Abschnitt 8 (Referenzdaten laden) | Dropdowns leer/Fehlerzustand |

## 8. UI Permission Gating Phase 2 (offen, nächster Slice)

Nicht umgebaut. Folgende Stellen können jetzt `permission-denied` bekommen (je nach Rolle; Systemrollen laut Matrix):

- **Alle acht Seiten/Listen** laden ihre Collection mit `getDocs` und zeigen bei fehlendem `*.ansehen` einen Fehlerzustand: `/kunden` (CustomersView), `/projekte`, `/geraete`, `/probekoerper`, `/pruefungen` (zusätzlich `useSamples` + `useReports`), `/berichte`, `/kalender`, `/laborbuch`; **Dashboard** lädt `useCalendar()` (`kalender.ansehen`).
- **Referenzdaten in Dialogen:** NewProjectDialog (Kunden), NewSampleDialog (Projekte, Kunden), NewTestEntryDialog (Proben), NewReportDialog (Proben), NewCalendarTaskDialog (Proben), NewLaborbookEntryDialog (Proben, Projekte, Kunden, Geräte) brauchen die jeweiligen `*.ansehen`.
- **Schaltflächen ohne Recht:** Neu/Anlegen (`*.erstellen`, Kalender `kalender.termine_erstellen`), Bearbeiten/Archivieren/Deaktivieren/Statuswechsel/Bulk-Archivieren (`*.bearbeiten`), Löschen/Bulk-Löschen (`*.loeschen`; bei Geräten, Laborbuch, Berichten nur Administrator), Duplizieren (`proben.erstellen` + `proben.ansehen`), Berichte exportieren (`berichte.bearbeiten` + `pdf.exportieren`).
- Prüfer/Azubi/Gast sehen heute alle Schaltflächen; Rules weisen sie ab (z. B. Prüfer: keine Kunden/Projekte/Geräte anlegen/bearbeiten/löschen; Azubi: nur Proben anlegen/bearbeiten; Gast: nur lesen).

## 9. Deployment-Voraussetzungen (Commit ≠ Deployment)

**Nicht** `firebase deploy` ausführen, solange nicht:

1. **Rollen migriert sind.** Gespeicherte Systemrollen haben nur die 31 alten Schlüssel; die neuen (`geraete.erstellen/loeschen`, `kalender.bearbeiten/loeschen`, `laborbuch.erstellen/loeschen`, `berichte.*`, `standorte.ansehen` …) fehlen = `false`. Ohne Migration verlieren z. B. Prüfer das Lesen von Berichten und der Administrator Geräte-Anlegen/Löschen. Rollen vorher gegen `src/config/roles.ts` prüfen (`docs/database/permissions.md` Abschnitt 7; im Emulator `npx tsx scripts/seedRoles.ts --force`).
2. **Memberships korrekt sind** (`roleId` zeigt auf eine aktive Rolle derselben Firma) – `npx tsx scripts/auditMemberLinks.ts` (read-only) und eine Prüfung der Rollen-Dokumente.
3. **Die Fachseiten-UI angepasst ist** (Abschnitt 8) oder Nutzer die Fehlerzustände in Kauf nehmen.
4. Ein **Staging-/Emulator-Lauf** mit echten Rollen durchgeführt wurde.

Dieser Slice ändert keine echten Daten und führt kein Deployment aus.

## 10. Testmatrix und Zahlen

`npm run test:rules` (Emulator, Java):

| Datei | Inhalt | Tests |
| --- | --- | --- |
| `phase2-matrix.test.ts` | 22 Personas × 8 Collections × {get, list, create, update, delete}; Erwartung = `permissions[Schlüssel] === true` aus der Config (bzw. Rolle im Seed) | 880 |
| `phase2-permissions.test.ts` | A Einzelschlüssel, B Read-only, C fehlende/unbekannte/nicht-true-Werte, D Admin-only-Löschrechte, E Legacy 31, F Berichte-Export, G `sampleId`, H Tenant (beide Richtungen, alle acht), I Bulk, J Service-Abläufe, K Snapshots | 106 |
| `rules-config-sync.test.ts` (erweitert) | Schlüssel je Operation = Tabelle der Tests = `allPermissionKeys`; nur vier `allow`-Regeln je Collection; kein `belongsToCompany`; delete nur über `*.loeschen` | +3 (ersetzt 1 Test durch 4) |
| `company-collections.test.ts`, `company-isolation.test.ts` | auf Rollen umgestellt (Membership + Rolle `admin`) | unverändert in der Zahl |

Persona-Matrix und Rules laufen gegen dieselbe Config: ändert sich eine Rolle in `src/config/roles.ts` oder ein Schlüssel in den Rules, schlägt die Matrix fehl.

**Regression Phase 1:** `phase1-*` (roles, employees, invitations, locations), `membership`, `profile` und die Member-Action-Tests laufen unverändert grün (Employee `roleId`/`role`/`status` weiter clientseitig DENY, Membership read-only, Protected-Role-Policy unverändert).

**Composite Indexes:** keine neuen. Die Rules selbst brauchen keine Indizes; `list` hängt nicht von Query-Constraints ab. Die einzige Fach-Query ist `where("sampleId", "==", …)` auf `testValues` (Einzelfeld-Index, automatisch). Die serverseitigen Member-Action-Abfragen auf `userMemberships` sind reine Gleichheitsabfragen (`companyId`, `employeeId`, `roleId`, `status`) und brauchen ebenfalls keinen Composite Index.
