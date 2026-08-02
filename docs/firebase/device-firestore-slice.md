# Device-Firestore-Slice

Status: **Dritter vollständiger Vertical Slice mit echter Firestore-Anbindung (Firestore Phase 3).** Beschreibt, wie `/geraete` heute Daten liest und schreibt, wie zwischen Mock- und Firestore-Modus umgeschaltet wird, und welche Punkte bewusst noch offen sind. Analog zu `docs/firebase/customer-firestore-slice.md` und `docs/firebase/project-firestore-slice.md` (erster und zweiter Slice).

---

## 1. Datenfluss

```
DevicesView.tsx
  → useDevices() (src/hooks/useDevices.ts)
    → deviceService (src/lib/services/deviceService.ts)
      ── isMockDataSource ──→ deviceRepository (src/config/devices.ts, In-Memory)
      ── isFirestoreDataSource ──→ firestoreDeviceService (Firestore SDK)
```

- `useDevices` ist die **einzige** Zugriffsstelle für die Geräte-UI. `DevicesView`, `DeviceTable`, `DeviceDetailDrawer`, `DeviceActionsMenu` und `NewDeviceDialog` kennen weder `deviceRepository` noch `firestoreDeviceService` direkt.
- `deviceService` (`src/lib/services/deviceService.ts`) ist eine Facade: sie entscheidet pro Methode anhand von `isFirestoreDataSource` (`src/config/dataSource.ts`, unverändert), ob Mock-Repository oder echte Firestore-Implementierung angesprochen wird. Beide implementieren dasselbe `IDeviceService`-Interface (jetzt Promise-basiert, siehe Abschnitt 8).
- Der Hook lädt einmalig beim Mount über `refreshDevices()` und hält die Liste als lokalen React-State. Mutationen (`createDevice`, `updateDevice`, `archiveDevice`, `reactivateDevice`, `removeDevice`) laufen über den Service und aktualisieren den lokalen State optimistisch mit dem vom Service zurückgegebenen Ergebnis (kein Realtime-Sync/`onSnapshot`).
- **Nur der Geräte-Slice wurde async gemacht** – `src/lib/interfaces/base.ts` (synchrone Signaturen für alle anderen Domänen) ist unverändert, keine Mass-Migration.

## 2. Collection-Pfad

```
companies/{companyId}/devices/{deviceId}
```

Kein globales `/devices`. Der Pfad wird zentral über `companyCollectionPaths.devices(companyId)` (`src/lib/firebase/collections.ts`, bereits vorhanden) gebildet – nirgends im Code wird der String hartkodiert.

## 3. companyId

Ausschließlich über die bestehende `resolveCompanyId()` (`src/lib/firebase/companyContext.ts`, unverändert) – keine neue/parallele Logik. Nutzt weiterhin den zentral dokumentierten `DEMO_COMPANY_ID`-Fallback, bis ein echter Auth-/User-Context existiert.

## 4. Mock-/Firestore-Umschaltung

Gesteuert über `NEXT_PUBLIC_DATA_SOURCE` (`.env.example`, lokal in `.env.local`), identisch zum Customer- und Project-Slice:

| Wert | Verhalten |
|---|---|
| `mock` (Standard) | `deviceRepository` – In-Memory-Array aus `src/config/devices.ts`, keine Persistenz über Reloads hinweg |
| `firestore` | `firestoreDeviceService` – echte Reads/Writes gegen `companies/{companyId}/devices` |
| fehlt / ungültiger Wert | fällt sicher auf `mock` zurück (`src/config/dataSource.ts`, unverändert) |

## 5. Gerätedokument

Alle bestehenden Felder aus `src/types/device.ts` bleiben erhalten: `id`, `inventoryNumber`, `name`, `type`, `manufacturer`, `model`, `serialNumber?`, `yearBuilt?`, `location`, `locationId?`, `status`, `responsiblePerson?`, `responsiblePersonInitials?`, `lastCalibration?`, `nextCalibration?`, `calibrationCertificate?`, `lastMaintenance?`, `nextMaintenance?`, `maintenanceInterval?`, `notes?`, `documents[]`, `history[]`.

Neu ergänzt (additiv, Firestore-only, wie bei `Customer`/`Project`): `createdAt?: string`, `updatedAt?: string` (ISO-Strings).

`deviceConverter` (`src/lib/firebase/converters/deviceConverter.ts`, bereits vorhanden über den generischen `createIdConverter<Device, "id">("id")`) mappt nur die Dokument-ID (`snapshot.id` ↔ `Device.id`) – **kein** Datenfeld geht dabei verloren, keine Änderung an diesem Converter nötig.

## 6. CRUD

| Aktion | Hook | Service (Firestore) |
|---|---|---|
| Liste laden | `refreshDevices()` | `getDocs(collection(...).withConverter(deviceConverter))` |
| Anlegen | `createDevice(input)` | `addDoc(...)`, setzt `createdAt`/`updatedAt` |
| Bearbeiten | `updateDevice(id, changes)` | `updateDoc(...)`, setzt `updatedAt` neu |
| Außer Betrieb setzen | `updateDevice(id, { status: "Außer Betrieb" })` | wie „Bearbeiten" – kein eigener Firestore-Methodenname nötig, siehe Abschnitt 7 |
| Archivieren | `archiveDevice(id)` | `updateDoc(..., { status: "Archiviert" })` |
| Reaktivieren | `reactivateDevice(id)` | `updateDoc(..., { status: "Einsatzbereit" })` |
| Löschen | `removeDevice(id)` | `deleteDoc(...)` (heute ohne Cascade/Relationsprüfung, siehe Abschnitt 9) |

- `NewDeviceDialog` deckt Create **und** Edit über eine einzige, dauerhaft gemountete Dialog-Instanz ab (`device`-Prop steuert den Modus, gesteuert über einen Dialog-State in `DevicesView` statt zwei separater Dialog-Instanzen wie zuvor) – beim Bearbeiten werden alle vorhandenen Werte vollständig vorbefüllt (Formular wird bei jedem Öffnen neu aus dem übergebenen Gerät synchronisiert, nicht nur beim ersten Mount). Beim Anlegen wird die Inventarnummer gegen alle bestehenden Geräte auf Duplikate geprüft. Der Dialog schließt nur bei Erfolg; Firestore-/Validierungsfehler bleiben als Inline-Meldung im Dialog sichtbar.
- Pflichtfelder (Inventarnummer, Gerätename, Standort, Hersteller, Modell) werden vor dem Speichern geprüft; fehlt eines, wird **nicht** gespeichert, sondern ein Inline-Fehler angezeigt.
- `removeDevice` ist im Service/Hook vollständig implementiert, aber (wie bei Customer/Project) **nicht** über eine UI-Aktion erreichbar – es gab schon vorher keinen „Löschen"-Menüpunkt in `DeviceActionsMenu`/`DeviceDetailDrawer`.

## 7. Statuslogik

Bestehende Statuswerte unverändert (`src/types/device.ts`, `DeviceStatus`): `Einsatzbereit` · `Kalibrierung fällig` · `Wartung fällig` · `Außer Betrieb` · `Archiviert`. Die UI bietet weiterhin genau drei Aktionen (unverändert gegenüber dem bisherigen UI-Prototyp):

- **Außer Betrieb setzen** (bei allen Status außer „Außer Betrieb"/„Archiviert") → `updateDevice(id, { status: "Außer Betrieb" })`. Kein eigener `IDeviceService`-Methodenname, da es sich um einen einfachen Teil-Update handelt (kein separates `setDeviceOutOfService` mehr im async Interface – bewusst vereinfacht gegenüber der vorherigen synchronen Fassung, die diese Methode zusätzlich zu `archiveDevice`/`restoreDevice` hatte).
- **Reaktivieren** (bei „Außer Betrieb" oder „Archiviert") → `reactivateDevice(id)`, setzt immer `"Einsatzbereit"` – eine einzelne Zielaktion für beide Ausgangszustände, identisch zum bisherigen UI-Verhalten (`canReactivate = status === "Außer Betrieb" || status === "Archiviert"`).
- **Archivieren** (bei allen Status außer „Archiviert") → `archiveDevice(id)`.

„Kalibrierung fällig"/„Wartung fällig" werden weiterhin nicht per Nutzeraktion gesetzt (siehe `docs/database/status-workflows.md`) – unverändert außerhalb dieses Slice-Scopes. Alle Statuswechsel laufen über `ConfirmActionDialog` mit `isLoading`-Guard gegen Doppelklick (Prop bereits im Customer-Slice ergänzt, hier wiederverwendet), sowohl in der Tabelle als auch im geöffneten `DeviceDetailDrawer` (beide werden nach einer Aktion synchron aktualisiert), plus `FeedbackToast`-Erfolgsmeldung.

## 8. Async-Umstellung des Interfaces

`IDeviceService` (`src/lib/interfaces/IDeviceService.ts`) nutzte zuvor die synchronen Bausteine aus `src/lib/interfaces/base.ts` (`GetAll`, `Update`, `StatusTransition`, …) plus `setDeviceOutOfService`/`restoreDevice` als zusätzliche StatusTransition-Methoden. Für diesen Slice wurde das Interface – analog zu `ICustomerService`/`IProjectService` – auf eigene, Promise-basierte Methodensignaturen umgestellt: `getDevices`, `getDeviceById`, `createDevice`, `updateDevice`, `archiveDevice`, `reactivateDevice`, `removeDevice` (plus `NewDeviceInput = Omit<Device, "id">`). `setDeviceOutOfService` und `restoreDevice` wurden nicht als eigene Methoden übernommen, da ihr Verhalten vollständig durch `updateDevice`/`reactivateDevice` abgedeckt ist (siehe Abschnitt 7) – das entspricht der im Task-Brief vorgegebenen Methodenliste für `firestoreDeviceService`. **Nur** `IDeviceService`/`deviceService`/`useDevices` wurden angefasst; `base.ts` und alle anderen Domänen (Proben, Prüfwerte, Berichte, …) bleiben synchron und unverändert.

## 9. Loading/Error/Empty

- **Loading:** `useDevices().loading` – `DevicesView` zeigt einen Skeleton-Platzhalter für KPI-Kacheln und Tabelle, keine springende Tabelle (identisches Muster zu `CustomersView`/`ProjectsView`).
- **Error:** `useDevices().error` – Text „Gerätedaten konnten nicht geladen werden.", Button „Erneut versuchen" ruft `refreshDevices()` erneut auf.
- **Empty State:** bestehender `EmptyState` (`src/components/shared/EmptyState.tsx`, via `DeviceTable`, unverändert), wenn Suche/Filter keine Treffer liefern.

## 10. Emulator-Test

Gleicher Ablauf wie bei Customer-/Project-Slice (siehe `customer-firestore-slice.md` Abschnitt 8 bzw. `project-firestore-slice.md` Abschnitt 10):

1. `firebase emulators:start --only firestore --project <projekt-id>`, `firestore.rules` (jetzt mit `companies/{companyId}/devices`-Block) verknüpft.
2. In `.env.local`: `NEXT_PUBLIC_DATA_SOURCE=firestore` setzen.
3. `connectFirestoreEmulator()` ist in der App selbst weiterhin **nicht** verdrahtet (siehe `docs/firebase/setup.md`) – bewusst nicht Teil dieses Slices.
4. Unter `/geraete` ein Gerät anlegen/bearbeiten/außer Betrieb setzen/reaktivieren/archivieren und im Emulator-UI (`localhost:4000`) prüfen, ob das Dokument unter `companies/demo-company/devices/{id}` korrekt erscheint bzw. sich ändert.

## 11. Bekannte offene Punkte

- **Relationsprüfung vor dem Löschen:** `removeDevice`/`firestoreDeviceService.removeDevice` löscht heute ohne zu prüfen, ob das Gerät noch von Proben, Prüfwerten oder dem Laborbuch referenziert wird (kein Cascade-Delete, keine Sperre) – siehe `docs/database/relationships.md`. Siehe `TODO(Firestore-Phase-4)`-Kommentar in `src/lib/firebase/services/firestoreDeviceService.ts`.
- **Audit-Log-Anbindung:** Erstellen/Ändern/Statuswechsel/Löschen werden heute nicht in `companies/{companyId}/auditLog` protokolliert (siehe `docs/database/audit-log.md`).
- **Rollen-/Claims-Prüfung:** `firestore.rules` prüft heute nur „angemeldet + eigene companyId" (per `users/{uid}.companyId`-Lookup, gleiches Muster wie bei `customers`/`projects`). Eine rollenabhängige Einschränkung (nur Admin/Laborleiter dürfen Geräte bearbeiten, siehe `docs/database/permissions.md` Abschnitt 3) ist vorbereitet, aber nicht durchgesetzt – dafür fehlen die Custom Claims.
- **Automatische Statusableitung:** „Kalibrierung fällig"/„Wartung fällig" werden weiterhin manuell in den Mock-Daten gepflegt statt automatisch aus `nextCalibration`/`nextMaintenance` berechnet (siehe `docs/database/status-workflows.md`, Vorschlag: tägliche Cloud-Function-Prüfung). Nicht Teil dieses Slices.
- **Standort weiterhin Freitext im Dialog:** `NewDeviceDialog` nutzt für „Standort" weiterhin die bestehende statische `locationNames`-Liste (`config/employees.ts`), kein Firestore-Dropdown wie bei der Kundenreferenz im Project-Slice – im Task-Brief für diesen Slice nicht gefordert, daher unverändert belassen.
- **Kein Realtime-Sync:** `getDocs`/`getDoc` statt `onSnapshot` – Änderungen durch andere Nutzer/Tabs erscheinen erst nach `refreshDevices()`.
