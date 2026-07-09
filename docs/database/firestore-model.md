# Firestore-Datenmodell (Planung)

Status: **Planungsdokument – keine echte Firebase-Anbindung.**
Quelle: abgeleitet aus den bestehenden TypeScript-Types (`src/types/*.ts`) und Mock-Configs (`src/config/*.ts`) des UI-Prototyps, Stand aktueller Implementierung.

Dieses Dokument beschreibt, wie die heute rein clientseitigen Mock-Datenmodelle später als Firestore-Collections abgebildet werden könnten. Es ändert nichts an der bestehenden App – keine SDK-Anbindung, keine Security Rules, keine Cloud Functions.

---

## 1. Grundprinzip: Multi-Tenant unter `companies/{companyId}`

PrüfCheckPro ist mehrmandantenfähig (jede Firma = ein Tenant). Fast alle fachlichen Collections liegen deshalb als **Subcollections unter `companies/{companyId}`**, damit sich Firestore Security Rules zentral auf `companyId` stützen können und Exporte/Backups pro Firma möglich sind.

Zwei Collections liegen bewusst **außerhalb** des Company-Baums:

- `users/{uid}` – an die Firebase-Auth-UID gebunden, referenziert `companyId`. Nutzerprofile werden unabhängig vom Tenant-Baum verwaltet (Login funktioniert vor Zuordnung zu einer Firma, Nutzer könnten theoretisch firmenübergreifend eingeladen werden).
- Firebase-Auth selbst (E-Mail/Passwort, Google) – kein Firestore-Dokument, siehe `permissions.md`.

## 2. Collection-Baum (Übersicht)

```
users/{uid}                                            → AppUser (Login-Profil)

companies/{companyId}                                  → CompanyProfile
companies/{companyId}/locations/{locationId}            → CompanyLocationDetail
companies/{companyId}/employees/{employeeId}            → Employee
companies/{companyId}/invitations/{invitationId}        → Invitation
companies/{companyId}/roles/{roleId}                    → Role
companies/{companyId}/customers/{customerId}            → Customer
companies/{companyId}/projects/{projectId}              → Project
companies/{companyId}/devices/{deviceId}                → Device
companies/{companyId}/samples/{sampleId}                → Sample
companies/{companyId}/testValues/{testValueId}           → TestEntry + Messwerte
companies/{companyId}/calendarEvents/{eventId}           → CalendarEvent
companies/{companyId}/laborbook/{entryId}                → LaborbookEntry
companies/{companyId}/reports/{reportId}                 → Report
companies/{companyId}/integrations/{integrationId}       → Integration
companies/{companyId}/webhooks/{webhookId}               → Webhook
companies/{companyId}/auditLog/{entryId}                 → AuditLogEntry (siehe audit-log.md)

users/{uid}/aiChats/{chatId}                             → AiChat (persönlich, s. Abschnitt 4)
```

**Nicht als eigene Collection geplant** (siehe Abschnitt 5): `statistics`, `siteMode` (Baustellenmodus).

---

## 3. Collections im Detail

Feldnamen folgen bewusst den bestehenden TypeScript-Interfaces, damit eine spätere Anbindung ohne Umbenennungen im UI-Code auskommt.

### `companies/{companyId}`
Quelle: `CompanyProfile` (`types/company.ts`)

| Feld | Typ | Hinweis |
|---|---|---|
| name, logoInitials, email | string | |
| plan, billingCycle | string | Abrechnung (heute nicht angebunden) |
| licenseStatus | `"Aktiv" \| "Inaktiv" \| "Testphase"` | |
| licenseValidUntil | string (Datum) | |
| locationsCount, employeesCount | number | **abgeleitet** – in Firestore eher per Aggregationsquery statt gepflegtem Zählerfeld, oder via Cloud-Function-Trigger aktuell gehalten |
| storageUsedGb, storageTotalGb | number | |

### `companies/{companyId}/locations/{locationId}`
Quelle: `CompanyLocationDetail` (`types/location.ts`)

id, name, type (`Hauptstandort`/`Außenstelle`/`Baustellenbüro`), street, postalCode, city, country, contactPerson, phone, email, timezone, employeeCount, deviceCount, projectCount, status (`Aktiv`/`Inaktiv`), history[] (message, timestamp).

> `employeeCount`/`deviceCount`/`projectCount` sind heute gepflegte Mock-Zahlen. In Firestore: entweder per Countquery (`count()` Aggregation) live berechnen oder per Cloud Function bei Änderungen an `employees`/`devices`/`projects` nachführen.

### `companies/{companyId}/employees/{employeeId}`
Quelle: `Employee` (`types/employee.ts`)

id, name, initials, email, phone?, role (`EmployeeRole`), location (heute Freitext – siehe `relationships.md` für geplante `locationId`), status (`Aktiv`/`Gesperrt`/`Ausstehend`), lastLogin, invitationStatus, joinedAt?, history[].

> Empfehlung: `employeeId` = Firebase-Auth-UID, sobald ein Mitarbeiter sein Konto aktiviert hat. Vor Aktivierung existiert nur die `Invitation`.

### `companies/{companyId}/invitations/{invitationId}`
Quelle: `Invitation` (`types/invitation.ts`)

id, name, initials, email, role (`EmployeeRole`), location, status (`Offen`/`Angenommen`/`Abgelaufen`/`Widerrufen`), invitedBy, createdAt, expiresAt, lastReminder?, link, history[].

### `companies/{companyId}/roles/{roleId}`
Quelle: `Role` + `PermissionCategoryDef` (`types/role.ts`, `config/roles.ts`)

id, name, description, type (`System`/`Benutzerdefiniert`), color, status (`Aktiv`/`Archiviert`), userCount, createdAt, updatedAt, updatedBy, permissions (`Record<permissionKey, boolean>`).

> Die Permission-**Taxonomie** selbst (welche Keys es gibt, z. B. `proben.loeschen`) ist heute Code (`config/roles.ts:permissionCategories`), keine Nutzdaten. Empfehlung: Taxonomie als Konstante im Code belassen (Versionierung über Deploys), nur die **Zuordnung** (welche Rolle hat welchen Key) landet in Firestore. Siehe `permissions.md`.

### `companies/{companyId}/customers/{customerId}`
Quelle: `Customer` (`types/customer.ts`)

id, name, number, type (`CustomerType`), status (`Aktiv`/`Inaktiv`/`Archiviert`), contactPerson, contactPersonInitials, email, phone, street, postalCode, city, country?, billingAddressDifferent?, vatId?, website?, notes?, projects (string[] – siehe `relationships.md`), invoices[], deliveryNotes[], documentsCount, history[].

### `companies/{companyId}/projects/{projectId}`
Quelle: `Project` (`types/project.ts`)

id, name, number, customer, **customerId** (echte FK, bereits im Type vorbereitet), address, field (`ProjectField`), status (`ProjectStatus`), startDate, dueDate, sampleCount, testCount, progress, projectLead, projectLeadInitials, contactPerson?, phone?, email?, orderNumber?, notes?, documentsCount, deliveryNotes[], history[], overdue? (abgeleiteter Anzeigehinweis, kein Status).

### `companies/{companyId}/devices/{deviceId}`
Quelle: `Device` (`types/device.ts`)

id, inventoryNumber, name, type (`DeviceType`), manufacturer, model, serialNumber?, yearBuilt?, location, **locationId** (echte FK), status (`DeviceStatus`), responsiblePerson?, responsiblePersonInitials?, lastCalibration?, nextCalibration?, calibrationCertificate?, lastMaintenance?, nextMaintenance?, maintenanceInterval?, notes?, documents[], history[].

### `companies/{companyId}/samples/{sampleId}`
Quelle: `Sample` (`types/sample.ts`)

id, bezeichnung, fachbereich (`SampleField`), probenart (`SampleType`), pruefverfahren, kunde, **customerId**, projekt, **projectId**, standort?, entnahmedatum, pruefdatum, pruefalter, status (`SampleStatus`), pruefer, qrCode? (bool, rein optional), barcode? (bool, rein optional), pruefungen[] (`SamplePruefung`: id, name, status, faelligkeitsdatum, pruefer), anhaenge[], dokumente[], lieferscheine[], historie[].

> `pruefungen[]` ist heute eine eingebettete Zusammenfassung pro Probe. Die eigentlichen Messwerte (einzelne Eingabezeilen, z. B. je Würfel) landen separat in `testValues` (nächster Abschnitt), referenziert über `sampleId`.

### `companies/{companyId}/testValues/{testValueId}`
Quelle: `TestEntry` + `PruefartDefinition`/`PruefartRow` (`types/testValue.ts`)

Empfohlene Struktur eines `testValues`-Dokuments:

| Feld | Typ | Hinweis |
|---|---|---|
| sampleId | string | FK → `samples/{sampleId}` |
| titel, testType, kunde, projekt, fachbereich | string | Anzeige-Kopie wie bei Proben |
| pruefdatum, pruefalter, pruefer | string | |
| status | `TestEntryStatus` | Offen/Vorbereitung/In Bearbeitung/Abgeschlossen/Überfällig |
| pruefartKey | `PruefartKey` | z. B. `druckfestigkeit`, bestimmt Formel/Feldkatalog |
| rows | `PruefartRow[]` | einzelne Messwertzeilen (z. B. Würfel 1–3), je `{ id, label, values: Record<string,string>, status }` |
| ergebnis, mittelwert, standardabweichung, bewertung | string | **heute UI-Vorschau** – bei echter Anbindung durch serverseitige/geprüfte Berechnung ersetzen, nicht durch Client-Eingabe |

> Die Formel-/Norm-Katalogdaten (`PruefartDefinition`, `config/pruefarten.ts`) sind wie die Rollen-Taxonomie **Stammdaten/Code**, keine Firma-spezifischen Nutzdaten – bleiben als Konstante im Code oder wandern optional in eine globale (nicht Company-gebundene) `pruefarten/{key}`-Collection, falls sie später redaktionell pflegbar sein sollen.

### `companies/{companyId}/calendarEvents/{eventId}`
Quelle: `CalendarEvent` (`types/calendarEvent.ts`)

id, title, date, time, duration?, field (`CalendarField`), status (`CalendarEventStatus`), priority?, sampleId?, bezeichnung?, projekt?, kunde?, pruefer?, description?.

### `companies/{companyId}/laborbook/{entryId}`
Quelle: `LaborbookEntry` (`types/laborbook.ts`)

id, datum, uhrzeit, typ (`LaborbookType`), fachbereich?, titel, beschreibung, projekt?, **projectId**?, kunde?, **customerId**?, probeId?, geraet?, **deviceId**?, mitarbeiter, status (`Aktiv`/`Archiviert`), fotos[], dokumente[], historie[].

### `companies/{companyId}/reports/{reportId}`
Quelle: `Report` (`types/report.ts`)

id, titel, berichtsnummer, berichtstyp (`ReportTemplate`), format (`ReportFormat`), projekt, **projectId**?, kunde, **customerId**?, standort?, probeId?, fachbereich, pruefer, bearbeiter, ansprechpartner?, vorlage?, sprache?, erstelltAm, status (`ReportStatus`), pruefungen[] (`ReportPruefungRef`: id, name, included), fotos[], dokumente[], lieferscheine[], bemerkungen, unterschriften[] (`ReportUnterschrift`: rolle, name, signiert), historie[].

> Die eigentliche PDF-/Excel-**Datei** gehört nicht ins Firestore-Dokument, sondern in **Cloud Storage** (`companies/{companyId}/reports/{reportId}/{dateiname}`), das Dokument speichert nur Metadaten + Download-URL/Storage-Pfad.

### `companies/{companyId}/integrations/{integrationId}` & `.../webhooks/{webhookId}`
Quelle: `Integration`, `Webhook`, `ApiSettings` (`types/integration.ts`)

`integrations`: id, name, description, category, status (`Verbunden`/`Nicht verbunden`), lastSync?.
`webhooks`: id, url, event, status (`Aktiv`/`Inaktiv`), createdAt.

> **Sicherheitshinweis für später:** API-Keys (`ApiSettings.apiKey`) dürfen nicht im Klartext in einem client-lesbaren Firestore-Dokument liegen. Perspektivisch gehören sie in Secret Manager / eine serverseitig geschützte Collection mit eigenen Security Rules (kein `read` für normale Nutzer).

---

## 4. `users/{uid}` und persönliche Daten

Quelle: `AppUser` (`types/user.ts`)

id (= Firebase-Auth-UID), firstName?, lastName?, email, role (`UserRole`), plan (`SubscriptionPlan`), companyId?, laboratoryId?, language, theme, createdAt?, lastLogin?.

**KI-Chats** (`AiChat`, `types/ai.ts`) sind persönlich (ein Nutzer sieht nur seinen eigenen Verlauf) und werden deshalb als Subcollection unter dem Nutzer statt unter der Firma geplant:

```
users/{uid}/aiChats/{chatId}   → { id, title, category, mode, timestamp, companyId, messages: AiMessage[] }
```

`companyId` wird redundant mitgespeichert, damit Security Rules und ggf. unternehmensweite Auswertungen (z. B. „welche Normen werden im Team am häufigsten gefragt") möglich bleiben, ohne dass andere Nutzer den Chatinhalt lesen können.

---

## 5. Bewusst **keine** eigenen Collections

- **`statistics`** – hat kein eigenes TypeScript-Domänenmodell (`config/statistics.ts` enthält nur Aggregations-/Chart-Datentypen wie `KpiCardData`, `RangeData`). Statistiken werden aus `samples`, `testValues`, `projects`, `reports` **berechnet** (Client-Query mit Aggregationen oder eine geplante Cloud Function, die periodisch Rollup-Dokumente z. B. unter `companies/{companyId}/statsRollups/{period}` schreibt, um teure Live-Aggregationen zu vermeiden). Kein Verlust an Rohdaten, da alles aus den Quellcollections ableitbar ist.
- **`siteMode` (Baustellenmodus)** – ebenfalls kein eigenständiges Domänenmodell, sondern eine gefilterte Vorort-Ansicht auf `samples`, `devices` und `projects` (mit Offline-Eignung als UI-Anforderung). Keine eigene Collection nötig; bei echter Offline-Unterstützung würde Firestores eingebautes Offline-Persistence-Feature genutzt statt einer separaten Datenstruktur.

---

## 6. Offene Punkte für die echte Anbindung (nicht heute zu klären)

- Zähler-Felder (`employeeCount`, `deviceCount`, `sampleCount`, `testCount` …) live halten: Aggregationsquery vs. Cloud-Function-Trigger.
- Serverseitige Neuberechnung der Prüfwert-Ergebnisse/Bewertung (`bewertung`, `mittelwert`), damit Nutzer keine Ergebnisse manipulieren können.
- Cloud-Storage-Anbindung für Anhänge/Fotos/Dokumente/PDF-Dateien (heute nur `RecordListItem { id, title, date }` ohne echte Datei).
- Migrations-/Seed-Skript, das die bestehenden `config/*.ts`-Mockdaten 1:1 in eine Firestore-Emulator-Instanz überführt (praktisch für lokale Entwicklung nach der echten Anbindung).
