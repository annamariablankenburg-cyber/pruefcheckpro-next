# Beziehungen zwischen den Datenmodellen (Planung)

Status: **Planungsdokument – keine echte Firebase-Anbindung.**

Dieses Dokument beschreibt, wie die Collections aus `firestore-model.md` fachlich zusammenhängen: welches Dokument welches andere referenziert, mit welchem Feld, und was heute im UI-Prototyp davon schon vorbereitet ist.

Referenzen werden in Firestore als **Feld mit der ID des Zieldokuments** abgebildet (kein echter Fremdschlüssel-Zwang wie in SQL – Konsistenz muss die App bzw. spätere Cloud Functions sicherstellen).

---

## 1. Kernkette: Kunde → Projekt → Probe → Prüfwerte → Bericht

```
Customer (customers/{customerId})
   ↑ customerId
Project (projects/{projectId})
   ↑ projectId
Sample (samples/{sampleId})
   ↑ sampleId
TestEntry (testValues/{testValueId})

Report (reports/{reportId}) referenziert alle drei direkt:
   → customerId, projectId, probeId (= sampleId)
```

| Beziehung | Feld | Kardinalität | Status im UI-Prototyp |
|---|---|---|---|
| Projekt gehört zu Kunde | `Project.customerId` (+ `Project.customer` als Anzeige-Kopie) | 1 Projekt → 1 Kunde | ✅ bereits als Feld vorbereitet und beim Anlegen verknüpft |
| Probe gehört zu Projekt | `Sample.projectId` (+ `Sample.projekt`) | 1 Probe → 1 Projekt | ✅ vorbereitet |
| Probe gehört zu Kunde | `Sample.customerId` (+ `Sample.kunde`) | 1 Probe → 1 Kunde | ✅ vorbereitet (redundant zu Projekt→Kunde, siehe Hinweis unten) |
| Prüfwerte gehören zu Probe | `TestEntry.sampleId` | 1 Probe → n Prüfwert-Einträge | ✅ `sampleId` ist der Primärschlüssel der `TestEntry` |
| Bericht gehört zu Probe | `Report.probeId` | 1 Bericht → 1 Probe (optional, Sammelberichte möglich) | ✅ vorbereitet |
| Bericht gehört zu Projekt | `Report.projectId` (+ `Report.projekt`) | 1 Bericht → 1 Projekt | ✅ vorbereitet |
| Bericht gehört zu Kunde | `Report.customerId` (+ `Report.kunde`) | 1 Bericht → 1 Kunde | ✅ vorbereitet |

> **Hinweis zur Redundanz Kunde/Projekt:** `Sample.customerId` dupliziert im Normalfall `Sample.projectId → Project.customerId`. Das ist bewusst so vorbereitet, weil in der Praxis eine Probe theoretisch ohne festes Projekt (z. B. Einzelauftrag direkt für einen Kunden) existieren könnte. Bei echter Anbindung: `customerId` beim Anlegen automatisch aus dem gewählten Projekt vorbefüllen, aber als eigenständiges Feld editierbar lassen.

---

## 2. Kalendertermin – optionale Verknüpfung zu mehreren Modulen

`CalendarEvent` (`calendarEvents/{eventId}`) ist bewusst **lose** gekoppelt, da nicht jeder Termin an eine Probe hängt (z. B. „Laborbericht prüfen" als reine Aufgabe):

| Feld | Ziel | Pflicht? |
|---|---|---|
| `sampleId` | `samples/{sampleId}` | optional |
| `bezeichnung`, `projekt`, `kunde`, `pruefer` | Anzeige-Kopien, kein FK | – |

**Geplante Erweiterung für „optional zu Probe/Prüfung/Gerät/Projekt" (Vorgabe aus dem Sprint-Brief):** Heute referenziert `CalendarEvent` nur `sampleId`. Für die echte Anbindung sollten zusätzlich `testValueId?`, `deviceId?` und `projectId?` als optionale Felder ergänzt werden, analog zum bestehenden `sampleId`-Muster – ohne Breaking Change, da alle neuen Felder optional wären.

---

## 3. Laborbuch – Sammelpunkt für alle Module

`LaborbookEntry` (`laborbook/{entryId}`) ist das Modul mit den meisten optionalen Verknüpfungen, weil ein Eintrag „Prüfung“, „Gerät“, „Kalibrierung“, „Wartung“, „Notiz“ oder „Ereignis“ sein kann (`LaborbookType`):

| Feld | Ziel | Bereits vorbereitet? |
|---|---|---|
| `projectId` | `projects/{projectId}` | ✅ |
| `customerId` | `customers/{customerId}` | ✅ |
| `probeId` | `samples/{sampleId}` | ⚠️ heute nur als String-ID ohne eigenes `sampleId`-Feld – bei Bedarf in `sampleId` umbenennen für Konsistenz mit anderen Modulen |
| `deviceId` | `devices/{deviceId}` | ✅ |
| **Bericht** (`reportId`) | `reports/{reportId}` | ❌ noch nicht im Type vorhanden – geplante Ergänzung, siehe unten |

**Geplante Ergänzung:** Das Sprint-Brief fordert „Laborbuch-Eintrag kann zu … Bericht gehören“. `LaborbookEntry` hat aktuell kein `reportId`-Feld. Empfehlung: optionales `reportId?: string` ergänzen, wenn ein Laborbuch-Eintrag („Bericht exportiert“) direkt mit dem erzeugten Bericht verknüpft werden soll – rückwärtskompatibel, da optional.

---

## 4. Gerät gehört zu Standort

| Feld | Ziel | Status |
|---|---|---|
| `Device.locationId` | `locations/{locationId}` (+ `Device.location` als Anzeige-Kopie) | ✅ bereits vorbereitet |

## 5. Mitarbeiter gehört zu Standort

| Feld | Ziel | Status |
|---|---|---|
| `Employee.location` | – | ⚠️ heute **nur Freitext**, keine `locationId` |

**Geplante Ergänzung:** Analog zu `Device.locationId` sollte `Employee.locationId?: string` ergänzt werden, damit Mitarbeiter genauso wie Geräte einem echten Standort-Dokument zugeordnet werden können (heute matcht die App den Freitext-Namen gegen `config/locations.ts`, was bei echten Daten fehleranfällig wäre).

## 6. Einladung gehört zu Firma/Standort/Rolle

| Feld | Ziel | Status |
|---|---|---|
| Firma | implizit über `companies/{companyId}/invitations/{invitationId}` (Pfad) | ✅ |
| `Invitation.location` | `locations/{locationId}` | ⚠️ heute Freitext, gleiche Ergänzung wie bei `Employee` nötig |
| `Invitation.role` | `EmployeeRole` (Enum-Wert, keine Referenz auf `roles/{roleId}`) | ℹ️ siehe Hinweis unten |

> **Hinweis Rolle bei Einladungen:** `Invitation.role` ist heute vom Type `EmployeeRole` (fester String-Enum: Admin/Laborleiter/Prüfer/Azubi/Gast), nicht `roleId`. Das passt zu den 5 System-Rollen, verhindert aber, dass eine Einladung eine **benutzerdefinierte** Rolle (z. B. „Qualitätsmanager“, siehe `config/roles.ts`) referenzieren kann. Für volle Rollen-Flexibilität bei echten Daten: `Invitation.roleId?: string` ergänzen, das auf `roles/{roleId}` zeigt, `role: EmployeeRole` als Fallback/Anzeige-Label behalten.

## 7. Rolle gehört zu Firma oder ist Systemrolle

`Role.type: "System" | "Benutzerdefiniert"` ist bereits genau dafür vorgesehen:

- **System**-Rollen (Admin, Laborleiter, Prüfer, Azubi, Gast) sind fachlich identisch für alle Firmen, könnten aber trotzdem pro Firma als eigenes Dokument unter `companies/{companyId}/roles/{roleId}` liegen (damit eine Firma z. B. „Prüfer" umbenennen oder dessen Rechte leicht anpassen kann), **oder** global unter einer separaten `systemRoles/{roleId}`-Collection liegen und pro Firma nur referenziert werden.
  - **Empfehlung:** Pro Firma kopieren (heutiges UI-Verhalten: `config/roles.ts` liefert 5 System-Rollen + Beispiele für benutzerdefinierte Rollen wie „Qualitätsmanager“, „Baustellenleiter“ – jede Firma bekommt beim Anlegen eine Kopie der System-Rollen als Startpunkt). Das erlaubt spätere Firmenspezifische Anpassungen, ohne globale Rollen zu gefährden.
- **Benutzerdefinierte** Rollen sind immer schon firmengebunden (`companies/{companyId}/roles/{roleId}`, `type: "Benutzerdefiniert"`).
- Löschschutz: Rollen mit `type: "System"` dürfen laut bestehender UI-Logik (`RolesView.tsx`) nicht gelöscht werden – nur archiviert. Siehe `permissions.md` und `status-workflows.md`.

---

## 8. Gesamtübersicht als Diagramm

```
                     ┌───────────────┐
                     │   Company     │
                     └───────┬───────┘
              ┌──────────────┼───────────────────────────────┐
              ▼              ▼                                ▼
        ┌──────────┐   ┌──────────┐                     ┌──────────┐
        │ Location │   │  Role    │                     │Integration│
        └────┬─────┘   └────┬─────┘                     └──────────┘
             │              │
      ┌──────┴──────┐       │
      ▼             ▼       ▼
 ┌─────────┐   ┌─────────┐  │
 │ Device  │   │Employee │◄─┘ (role)
 └────┬────┘   └────┬────┘
      │              │
      │        ┌─────┴─────┐
      │        ▼           ▼
      │   ┌─────────┐  ┌────────────┐
      │   │Invitation│  │ (führt Prüfungen/Einträge aus – kein FK-Feld, nur Anzeige "pruefer"/"mitarbeiter") │
      │   └─────────┘  └────────────┘
      │
      ▼
 ┌──────────┐        ┌──────────┐
 │ Customer │───────►│ Project  │
 └────┬─────┘        └────┬─────┘
      │                   │
      │      ┌────────────┴─────────────┐
      │      ▼                          │
      │ ┌──────────┐                    │
      └►│  Sample  │◄───────────────────┘
        └────┬─────┘
             │
      ┌──────┴──────┬───────────────┬───────────────┐
      ▼             ▼               ▼                ▼
 ┌──────────┐ ┌───────────┐  ┌─────────────┐  ┌──────────────┐
 │TestValue │ │  Report   │  │CalendarEvent│  │LaborbookEntry│
 └──────────┘ └───────────┘  └─────────────┘  └──────────────┘
                     ▲                                │
                     └────────────────────────────────┘
                     (geplant: LaborbookEntry.reportId)
```

---

## 9. Zusammenfassung: heute vorbereitet vs. noch offen

| Beziehung | Feld existiert bereits? |
|---|---|
| Projekt → Kunde | ✅ `customerId` |
| Probe → Projekt | ✅ `projectId` |
| Probe → Kunde | ✅ `customerId` |
| Prüfwert → Probe | ✅ `sampleId` |
| Bericht → Probe/Projekt/Kunde | ✅ `probeId`/`projectId`/`customerId` |
| Laborbuch → Projekt/Kunde/Gerät | ✅ `projectId`/`customerId`/`deviceId` |
| Laborbuch → Probe | ⚠️ nur als Freitext `probeId` (String), kein dokumentierter FK-Typ |
| Laborbuch → Bericht | ❌ noch zu ergänzen (`reportId?`) |
| Kalendertermin → Probe | ✅ `sampleId` |
| Kalendertermin → Prüfung/Gerät/Projekt | ❌ noch zu ergänzen (`testValueId?`, `deviceId?`, `projectId?`) |
| Gerät → Standort | ✅ `locationId` |
| Mitarbeiter → Standort | ❌ noch zu ergänzen (`locationId?`) |
| Einladung → Standort | ❌ noch zu ergänzen (`locationId?`) |
| Einladung → Rolle | ⚠️ nur als Enum-Wert, kein `roleId` für benutzerdefinierte Rollen |
| Rolle → Firma/System | ✅ `type: "System" \| "Benutzerdefiniert"` |
