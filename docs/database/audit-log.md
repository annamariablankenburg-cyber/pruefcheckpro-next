# Audit-Log (Planung)

Status: **Planungsdokument – keine echte Firebase-Anbindung.** Heute gibt es kein persistentes Audit-Log; mehrere UI-Texte kündigen es aber bereits explizit an (z. B. Lösch-Dialoge: „Diese Aktion kann später im Audit-Log dokumentiert werden.“). Dieses Dokument plant die Datenstruktur, damit diese Ankündigungen bei der echten Anbindung eingelöst werden können.

---

## 1. Collection-Pfad

```
companies/{companyId}/auditLog/{entryId}
```

Firmengebunden (wie fast alle Collections, siehe `firestore-model.md`), damit Security Rules zentral auf `companyId` prüfen können und ein Export/Backup pro Firma möglich ist. Einträge werden **nur geschrieben, nie geändert oder gelöscht** (Immutable Log) – Security Rules sollten `update`/`delete` grundsätzlich verbieten, auch für Admins.

## 2. Dokumentstruktur `AuditLogEntry`

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | string | Dokument-ID (= `entryId`) |
| `timestamp` | Timestamp | Serverseitig gesetzt (`serverTimestamp()`), nie clientseitig, damit die Zeit nicht manipulierbar ist |
| `actorId` | string | Firebase-Auth-UID des Handelnden (`users/{uid}`) |
| `actorName` | string | Anzeige-Kopie des Namens zum Zeitpunkt der Aktion (bleibt lesbar, auch wenn der Mitarbeiter später gesperrt/umbenannt wird) |
| `actorRole` | string | Rolle des Handelnden zum Zeitpunkt der Aktion (z. B. `Prüfer`) – wichtig, falls sich die Rolle später ändert |
| `module` | string | Betroffenes Modul, z. B. `samples`, `testValues`, `reports`, `employees`, `roles`, `projects`, `customers`, `devices`, `laborbook`, `calendarEvents`, `invitations`, `locations` |
| `entityId` | string | ID des betroffenen Datensatzes (z. B. `sampleId`) |
| `entityLabel` | string | Anzeige-Kopie zur besseren Lesbarkeit im UI (z. B. Proben-Bezeichnung), ohne dass für die Anzeige des Logs der Originaldatensatz nachgeladen werden muss |
| `action` | `AuditAction` | Art der Aktion, siehe Enum unten |
| `previousValue` | `Record<string, unknown> \| null` | Feldwerte **vor** der Änderung (nur die geänderten Felder, nicht das ganze Dokument) |
| `newValue` | `Record<string, unknown> \| null` | Feldwerte **nach** der Änderung |
| `metadata` | `Record<string, unknown>` (optional) | Zusätzlicher Kontext, z. B. `{ format: "PDF" }` bei einem Export |

```ts
type AuditAction =
  | "created"
  | "updated"
  | "statusChanged"
  | "archived"
  | "reactivated"
  | "deleted"
  | "exported"
  | "invited"
  | "revoked"
  | "loginFailed"; // sicherheitsrelevant, siehe Abschnitt 5
```

`previousValue`/`newValue` bewusst als **Differenz**, nicht als volle Dokumentkopie – hält Einträge klein und macht Änderungen direkt lesbar (z. B. bei einem Statuswechsel nur `{ status: "Aktiv" }` → `{ status: "Archiviert" }`, nicht das komplette Projekt-Dokument zweimal).

## 3. Beispiel-Einträge (passend zu den im Sprint-Brief genannten Beispielen)

```json
{
  "id": "log-0001",
  "timestamp": "2026-03-03T09:12:00Z",
  "actorId": "uid-anna-neumann",
  "actorName": "Anna Neumann",
  "actorRole": "Laborleiter",
  "module": "samples",
  "entityId": "BET-2026-014",
  "entityLabel": "Beton C25/30",
  "action": "created",
  "previousValue": null,
  "newValue": { "status": "Offen", "projekt": "Neubau Wohnanlage Parkblick" }
}
```

```json
{
  "id": "log-0002",
  "module": "testValues",
  "entityId": "tv-0042",
  "entityLabel": "Druckfestigkeit – Würfel 1",
  "action": "updated",
  "previousValue": { "values": { "bruchlast": "520.1" } },
  "newValue": { "values": { "bruchlast": "523.4" } }
}
```

```json
{
  "id": "log-0003",
  "module": "reports",
  "entityId": "RPT-2026-001",
  "entityLabel": "Prüfbericht – Betonwürfel Druckfestigkeit",
  "action": "exported",
  "previousValue": { "status": "Fertig" },
  "newValue": { "status": "PDF exportiert" },
  "metadata": { "format": "PDF" }
}
```

```json
{
  "id": "log-0004",
  "module": "employees",
  "entityId": "emp-0007",
  "entityLabel": "Thomas Weber",
  "action": "statusChanged",
  "previousValue": { "status": "Aktiv" },
  "newValue": { "status": "Gesperrt" }
}
```

```json
{
  "id": "log-0005",
  "module": "roles",
  "entityId": "role-pruefer",
  "entityLabel": "Prüfer",
  "action": "updated",
  "previousValue": { "permissions": { "proben.loeschen": false } },
  "newValue": { "permissions": { "proben.loeschen": true } }
}
```

```json
{
  "id": "log-0006",
  "module": "projects",
  "entityId": "proj-parkblick",
  "entityLabel": "Neubau Wohnanlage Parkblick",
  "action": "archived",
  "previousValue": { "status": "Abgeschlossen" },
  "newValue": { "status": "Archiviert" }
}
```

## 4. Wer schreibt das Audit-Log?

**Nie der Client direkt.** Wenn Nutzer:innen selbst ins Audit-Log schreiben dürften, könnten sie ihre eigenen Spuren verändern oder löschen. Empfehlung:

- Schreibzugriff auf `auditLog` ausschließlich für **Cloud Functions** (Trigger auf `onCreate`/`onUpdate`/`onDelete` der jeweiligen Collections, oder ein serverseitig aufgerufenes „Callable Function"-Muster für Aktionen wie Export).
- Firestore Security Rules für `auditLog`: `allow read: if <Rolle darf Audit-Log einsehen>`, `allow write: if false` (nur Admin-SDK/Cloud Functions, die die Rules umgehen).
- Lesezugriff: mindestens Admin und Laborleiter (analog zur `administration.*`-Rechte-Gruppe aus `permissions.md`); ob Prüfer eigene Aktionen einsehen dürfen, ist eine spätere Produktentscheidung.

## 5. Sicherheitsrelevante Ereignisse (Ergänzung über das Sprint-Brief hinaus)

Neben den fachlichen Änderungen (create/update/delete) sollte das Audit-Log später auch sicherheitsrelevante Auth-Ereignisse aufnehmen, da sie für Nachvollziehbarkeit genauso wichtig sind:

- fehlgeschlagene Login-Versuche (`loginFailed`)
- Rollenwechsel eines Mitarbeiters
- Widerruf von Zugriff/Sessions bei Sperrung (siehe `permissions.md`, Regel 5)
- Änderungen an den Systemeinstellungen/Branding/Abrechnung (Admin-only-Bereiche)

Diese Ereignisse würden am ehesten über Firebase-Auth-Trigger bzw. Cloud Functions auf Änderungen an `companies/{companyId}/employees/{employeeId}` bzw. Custom Claims erzeugt.

## 6. Aufbewahrung & Volumen

Kein Löschen einzelner Einträge, aber eine Aufbewahrungsstrategie ist sinnvoll, damit die Collection nicht unbegrenzt wächst:

- Firestore TTL-Policy (Time-to-live) auf `timestamp`, z. B. Einträge nach X Jahren automatisch löschen – abhängig von späteren rechtlichen/vertraglichen Aufbewahrungspflichten (nicht heute festzulegen).
- Für Auswertungen/Reporting über sehr lange Zeiträume: periodischer Export nach BigQuery statt unbegrenztem Firestore-Wachstum (Firestore ist für „aktuelle" Abfragen optimiert, nicht für große historische Analysen).

## 7. UI-Texte, die bereits auf das Audit-Log verweisen (heute nur Hinweistext, keine echte Funktion)

Zur Orientierung, wo im bestehenden Prototyp bereits mit dem künftigen Audit-Log geworben wird und später eine echte Verknüpfung entstehen sollte:

- `DeleteSampleDialog`: „Diese Aktion kann später im Audit-Log dokumentiert werden. Löschen ist später nur für Rollen außer Azubi erlaubt.“
- `CalendarDeleteDialog`, `ReportsView` (Löschen), `laborbuch/page.tsx` (Löschen): vergleichbare Hinweistexte.
- `RolesView`: „Diese Aktion kann später im Audit-Log dokumentiert werden. Systemrollen können nicht gelöscht werden.“
- `AuditTrailPreview`-Komponente (`components/shared/AuditTrailPreview.tsx`): zeigt bereits heute eine **lokale, probenbezogene** Änderungshistorie (z. B. „hat Werte eingetragen“) im Prüfwert-Workspace an – das ist konzeptionell ein Vorläufer/UI-Baustein für das zentrale Audit-Log, heute aber nur Mock-Daten ohne echte Quelle. Bei echter Anbindung könnte diese Komponente direkt gefilterte Einträge aus `auditLog` (nach `entityId`) anzeigen, statt eigener Mockdaten.
