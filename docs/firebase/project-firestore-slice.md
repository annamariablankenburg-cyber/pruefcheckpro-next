# Project-Firestore-Slice

Status: **Zweiter vollständiger Vertical Slice mit echter Firestore-Anbindung (Firestore Phase 2).** Beschreibt, wie `/projekte` heute Daten liest und schreibt, wie zwischen Mock- und Firestore-Modus umgeschaltet wird, wie die Kundenreferenz funktioniert, und welche Punkte bewusst noch offen sind. Analog zu `docs/firebase/customer-firestore-slice.md` (erster Slice).

---

## 1. Datenfluss

```
ProjectsView.tsx
  → useProjects() (src/hooks/useProjects.ts)
    → projectService (src/lib/services/projectService.ts)
      ── isMockDataSource ──→ projectRepository (src/config/projects.ts, In-Memory)
      ── isFirestoreDataSource ──→ firestoreProjectService (Firestore SDK)
```

- `useProjects` ist die **einzige** Zugriffsstelle für die Projekte-UI. `ProjectsView`, `ProjectTable`, `ProjectDetailDrawer`, `ProjectActionsMenu` und `NewProjectDialog` kennen weder `projectRepository` noch `firestoreProjectService` direkt.
- `projectService` (`src/lib/services/projectService.ts`) ist eine Facade: sie entscheidet pro Methode anhand von `isFirestoreDataSource` (`src/config/dataSource.ts`), ob Mock-Repository oder echte Firestore-Implementierung angesprochen wird. Beide implementieren dasselbe `IProjectService`-Interface (jetzt Promise-basiert, siehe Abschnitt 9).
- Der Hook lädt einmalig beim Mount über `refreshProjects()` und hält die Liste als lokalen React-State. Mutationen (`createProject`, `updateProject`, `pauseProject`, `continueProject`, `completeProject`, `reopenProject`, `archiveProject`, `reactivateProject`, `removeProject`) laufen über den Service und aktualisieren den lokalen State optimistisch mit dem vom Service zurückgegebenen Ergebnis (kein Realtime-Sync/`onSnapshot`).
- **Nur der Projekte-Slice wurde async gemacht** – `src/lib/interfaces/base.ts` (synchrone Signaturen für alle anderen Domänen) ist unverändert, keine Mass-Migration.

## 2. Collection-Pfad

```
companies/{companyId}/projects/{projectId}
```

Kein globales `/projects`. Der Pfad wird zentral über `companyCollectionPaths.projects(companyId)` (`src/lib/firebase/collections.ts`, bereits vorhanden) gebildet – nirgends im Code wird der String hartkodiert.

## 3. Project-Dokumentstruktur

Alle bestehenden Felder aus `src/types/project.ts` bleiben erhalten: `id`, `name`, `number`, `customer`, `customerId?`, `address`, `field`, `status`, `startDate`, `dueDate`, `sampleCount`, `testCount`, `progress`, `projectLead`, `projectLeadInitials`, `contactPerson?`, `phone?`, `email?`, `orderNumber?`, `notes?`, `documentsCount`, `deliveryNotes[]`, `history[]`, `overdue?`.

Neu ergänzt (additiv, Firestore-only, wie bei `Customer`):

```ts
createdAt?: string; // ISO-String
updatedAt?: string; // ISO-String
```

`projectConverter` (`src/lib/firebase/converters/projectConverter.ts`, bereits vorhanden über den generischen `createIdConverter<Project, "id">("id")`) mappt nur die Dokument-ID (`snapshot.id` ↔ `Project.id`) – **kein** Datenfeld geht dabei verloren, keine Änderung an diesem Converter nötig.

## 4. customerId / customerName

Ein Projekt gehört immer zu einem bestehenden Kunden:

- `Project.customerId` ist die echte Fremdschlüssel-Referenz auf `companies/{companyId}/customers/{customerId}`.
- `Project.customer` ist ein **Anzeige-Snapshot** (Kundenname zum Zeitpunkt des Speicherns) – entspricht dem in Abschnitt 7 des Task-Briefs beschriebenen „customerName". Der bestehende Feldname `customer` wurde **nicht** umbenannt, um keine unnötige Änderung an einem bereits funktionierenden, überall verwendeten Feld vorzunehmen (Tabelle, Drawer, Suche, Mock-Daten).
- `NewProjectDialog` lädt Kunden **read-only** über den bestehenden `useCustomers()`-Hook (kein eigener/paralleler Kunden-State, keine hartkodierte Liste). Das Dropdown zeigt `activeCustomers` (Status `Aktiv`/`Inaktiv`, **keine** archivierten Kunden). Inaktive Kunden werden mit Suffix `(Inaktiv)` gekennzeichnet, bleiben aber wählbar.
- Wird ein bestehendes Projekt bearbeitet, dessen verknüpfter Kunde inzwischen archiviert wurde, bleibt dieser eine Kunde als aktuelle Auswahl im Dropdown sichtbar (mit Suffix `(Archiviert)`), damit Bearbeiten ohne Kundenwechsel nicht fehlschlägt – für **neue** Zuordnungen ist er nicht auswählbar.
- Vor dem Speichern wird geprüft, ob die gewählte `customerId` tatsächlich zu einem geladenen Kunden gehört (`customers.find(...)`). Ohne gültige Zuordnung wird **nicht** gespeichert, stattdessen erscheint „Bitte einen gültigen Kunden auswählen." als Inline-Fehler.
- Können die Kunden nicht geladen werden (`useCustomers().error`), zeigt der Dialog statt des Dropdowns einen Fehlerzustand mit „Kunden konnten nicht geladen werden." und einem „Erneut versuchen"-Button; das Formular lässt sich in diesem Zustand nicht abschicken.
- Es werden **keine** Kundendaten dupliziert oder verändert – reiner Lesezugriff über den bestehenden Hook.

## 5. Mock-/Firestore-Umschaltung

Gesteuert über `NEXT_PUBLIC_DATA_SOURCE` (`.env.example`, lokal in `.env.local`), identisch zum Customer-Slice:

| Wert | Verhalten |
|---|---|
| `mock` (Standard) | `projectRepository` – In-Memory-Array aus `src/config/projects.ts`, keine Persistenz über Reloads hinweg |
| `firestore` | `firestoreProjectService` – echte Reads/Writes gegen `companies/{companyId}/projects` |
| fehlt / ungültiger Wert | fällt sicher auf `mock` zurück (`src/config/dataSource.ts`, unverändert) |

## 6. CRUD

| Aktion | Hook | Service (Firestore) |
|---|---|---|
| Liste laden | `refreshProjects()` | `getDocs(collection(...).withConverter(projectConverter))` |
| Anlegen | `createProject(input)` | `addDoc(...)`, setzt `createdAt`/`updatedAt` |
| Bearbeiten | `updateProject(id, changes)` | `updateDoc(...)`, setzt `updatedAt` neu |
| Löschen | `removeProject(id)` | `deleteDoc(...)` (heute ohne Cascade/Relationsprüfung, siehe Abschnitt 9) |

- `NewProjectDialog` deckt Create **und** Edit ab (ein Formular, `project`-Prop steuert den Modus): beim Bearbeiten werden alle vorhandenen Werte vorbefüllt (inkl. Kunde), beim Anlegen wird die Projektnummer gegen alle bestehenden Projekte auf Duplikate geprüft. Der Dialog schließt nur bei Erfolg; Firestore-/Validierungsfehler bleiben als Inline-Meldung im Dialog sichtbar.
- Nicht im Formular editierbare, abgeleitete/systemgepflegte Felder (`progress`, `sampleCount`, `testCount`, `documentsCount`, `deliveryNotes`, `history`, `overdue`) werden beim Bearbeiten **nicht** mitgesendet – `updateDoc`/`update()` sind Teil-Updates, diese Felder bleiben unangetastet erhalten.
- `removeProject` ist im Service/Hook vollständig implementiert, aber (wie zuvor) **nicht** über eine UI-Aktion erreichbar – es gab schon vor diesem Slice keinen „Löschen"-Menüpunkt in `ProjectActionsMenu`/`ProjectDetailDrawer`, und das Hinzufügen einer neuen Aktion wäre eine UI-Erweiterung außerhalb des Sprint-Scopes („keine neuen Ansichten").

## 7. Statusübergänge

Bestehende Statuswerte unverändert (`src/types/project.ts`, `ProjectStatus`): `Aktiv` · `Pausiert` · `Abgeschlossen` · `Archiviert`.

```
Aktiv ──pauseProject──► Pausiert ──continueProject──► Aktiv
Aktiv ──completeProject──► Abgeschlossen ──reopenProject──► Aktiv
Pausiert ──completeProject──► Abgeschlossen
(Aktiv | Pausiert | Abgeschlossen) ──archiveProject──► Archiviert ──reactivateProject──► Aktiv
```

`overdue` bleibt ein reiner Anzeige-Hinweis (kein eigener Status, keine Änderung an dieser Logik). Archivierte Projekte sind nicht in „Alle" sichtbar, sondern nur über den Filter „Archiviert" (`src/hooks/shared/useSearchAndFilter.ts`, `archivedFilterValue`, unverändert). Alle Statuswechsel laufen über `ConfirmActionDialog` mit `isLoading`-Guard gegen Doppelklick (Prop bereits im Customer-Slice ergänzt, hier wiederverwendet), sowohl in der Tabelle als auch im geöffneten `ProjectDetailDrawer` (beide werden nach einer Aktion synchron aktualisiert). Der Archivieren-Dialog zeigt zusätzlich den Hinweis „Verknüpfte Proben und Berichte werden nicht automatisch gelöscht."

## 8. Loading/Error/Empty

- **Loading:** `useProjects().loading` – `ProjectsView` zeigt einen Skeleton-Platzhalter für KPI-Kacheln und Tabelle, keine springende Tabelle (Layout bleibt stabil, nur Inhalt wird durch Platzhalter ersetzt) – identisches Muster zu `CustomersView`.
- **Error:** `useProjects().error` – Text „Projektdaten konnten nicht geladen werden.", Button „Erneut versuchen" ruft `refreshProjects()` erneut auf. Fehler aus Mutationen (Create/Edit/Statuswechsel) werden **nicht** global über `error` angezeigt, sondern lokal dort, wo sie ausgelöst wurden (Inline-Fehler im Dialog bzw. `FeedbackToast` bei Statuswechseln).
- **Empty State:** bestehender `EmptyState` (`src/components/shared/EmptyState.tsx`, via `ProjectTable`, unverändert), wenn Suche/Filter keine Treffer liefern.

## 9. Async-Umstellung des Interfaces

`IProjectService` (`src/lib/interfaces/IProjectService.ts`) nutzte zuvor die synchronen Bausteine aus `src/lib/interfaces/base.ts` (`GetAll`, `Update`, `StatusTransition`, …). Für diesen Slice wurde das Interface – analog zu `ICustomerService` – auf eigene, Promise-basierte Methodensignaturen umgestellt (`getProjects(): Promise<Project[]>`, …) plus `NewProjectInput = Omit<Project, "id">`. **Nur** `IProjectService`/`projectService`/`useProjects` wurden angefasst; `base.ts` und alle anderen Domänen (Geräte, Proben, Prüfwerte, Berichte, …) bleiben synchron und unverändert.

## 10. Emulator-Test

Firestore-Modus lokal gegen die Emulator Suite statt gegen ein echtes Projekt testen (gleicher Ablauf wie beim Customer-Slice, siehe `customer-firestore-slice.md` Abschnitt 8):

1. `firebase init emulators` (Firestore auswählen) bzw. `firebase emulators:start --only firestore --project demo-pruefcheckpro-emulator`.
2. `firestore.rules` (dieses Repo, jetzt mit `companies/{companyId}/projects`-Block) beim Init verknüpfen.
3. In `.env.local`: `NEXT_PUBLIC_DATA_SOURCE=firestore` setzen.
4. **Wichtig:** `connectFirestoreEmulator()` ist in der App selbst weiterhin **nicht** verdrahtet (siehe `docs/firebase/setup.md`) – für einen App-seitigen Emulator-Test müsste `src/lib/firebase/firebase.ts` vorübergehend ergänzt werden. Bewusst nicht Teil dieses Slices.
5. Unter `/projekte` ein Projekt anlegen/bearbeiten/pausieren/fortsetzen/abschließen/wieder öffnen/archivieren/reaktivieren und im Emulator-UI (`localhost:4000`) prüfen, ob das Dokument unter `companies/demo-company/projects/{id}` korrekt erscheint bzw. sich ändert.

## 11. Seed

`scripts/seedProjects.ts` (neu) schreibt die bestehenden Mock-Daten aus `src/config/projects.ts` nach `companies/{companyId}/projects` – aber **ausschließlich gegen den lokalen Emulator**, fest verdrahtet auf `localhost:8080` mit einer Platzhalter-`projectId` (`demo-pruefcheckpro-emulator`), unabhängig von `.env.local`. Das Skript kann dadurch nie versehentlich gegen das echte Firebase-Projekt laufen.

**Ablauf:**

1. Emulator mit passender Projekt-ID starten: `firebase emulators:start --only firestore --project demo-pruefcheckpro-emulator`.
2. **Rules-Hinweis:** Der Emulator setzt `firestore.rules` standardmäßig durch. Das Seed-Skript schreibt über den normalen Client-SDK (keine Admin-SDK-Bypass-Rechte, da `firebase-admin` keine bestehende Dependency ist und für diesen Sprint keine neue Library eingeführt werden soll) – ein unauthentifizierter Schreibzugriff würde also von `belongsToCompany()` abgelehnt. Für einen erfolgreichen Seed-Lauf lokal entweder:
   - **Option A (empfohlen für reines Seeden):** Emulator einmalig mit einer permissiven, nur lokalen Regel-Datei starten (z. B. `firebase emulators:start --only firestore --project demo-pruefcheckpro-emulator --rules firestore.seed.rules`, wobei `firestore.seed.rules` lokal `allow read, write: if true;` enthält, **nicht** eingecheckt/deployed wird), seeden, danach für Rules-Tests wieder mit der echten `firestore.rules` neu starten.
   - **Option B (realitätsnäher):** Vorher im Auth-Emulator einen Testnutzer anlegen und `users/{uid}` mit `companyId: "demo-company"` seeden, dann das Skript um eine Anmeldung (`signInWithEmailAndPassword` gegen den Auth-Emulator) ergänzen, sodass `belongsToCompany()` reguläre passiert.
3. Skript ausführen: `npx tsx scripts/seedProjects.ts` (lädt `tsx` nur temporär über npx, **keine** neue Dependency in `package.json`).
4. Ergebnis in der Konsole: Anzahl angelegter vs. übersprungener Projekte. **Kein blindes Überschreiben:** bereits vorhandene Dokumente (gleiche Projekt-ID wie in `config/projects.ts`) werden übersprungen, nicht überschrieben – erneutes Ausführen ist gefahrlos möglich.
5. Keine Secrets: das Skript verwendet keine echte `firebaseConfig`, nur eine Platzhalter-`projectId` für den Emulator.

## 12. Bekannte offene Punkte

- **Relationsprüfung vor dem Löschen:** `removeProject`/`firestoreProjectService.removeProject` löscht heute ohne zu prüfen, ob das Projekt noch von Proben, Berichten, Kalendereinträgen, Laborbuch-Einträgen oder dem Baustellenmodus referenziert wird (kein Cascade-Delete, keine Sperre) – siehe `docs/database/relationships.md` für die vollständige Beziehungsübersicht. Eine harte Relationsprüfung würde Lesezugriffe auf die jeweils anderen Module erfordern, was außerhalb des Scopes dieses Slices liegt („keine Änderungen an Proben, Berichten, Kalender, Laborbuch, Baustellenmodus"). Siehe `TODO(Firestore-Phase-3)`-Kommentar in `src/lib/firebase/services/firestoreProjectService.ts`.
- **Audit-Log-Anbindung:** Erstellen/Ändern/Statuswechsel/Löschen werden heute nicht in `companies/{companyId}/auditLog` protokolliert (siehe `docs/database/audit-log.md`). Nachzurüsten, sobald das Audit-Log-Modul an echte Schreibpfade angebunden wird.
- **Rollen-/Claims-Prüfung:** `firestore.rules` prüft heute nur „angemeldet + eigene companyId" (per `users/{uid}.companyId`-Lookup, gleiches Muster wie bei `customers`). Eine rollenabhängige Einschränkung (nur Admin/Laborleiter dürfen Projekte anlegen/bearbeiten/löschen, siehe `docs/database/permissions.md` Abschnitt 3) ist vorbereitet, aber nicht durchgesetzt – dafür fehlen die Custom Claims.
- **companyId-Context:** Noch kein globaler Auth-/User-Context; `resolveCompanyId()` (`src/lib/firebase/companyContext.ts`, unverändert, zentral wiederverwendet) nutzt weiterhin den dokumentierten `DEMO_COMPANY_ID`-Fallback.
- **Kein Realtime-Sync:** `getDocs`/`getDoc` statt `onSnapshot` – Änderungen durch andere Nutzer/Tabs erscheinen erst nach `refreshProjects()`.
- **Löschen nicht in der UI erreichbar:** `removeProject` existiert vollständig in Service/Hook, aber es gibt (wie schon vor diesem Slice) keine „Projekt löschen"-Aktion in `ProjectActionsMenu`/`ProjectDetailDrawer`. Bewusst nicht ergänzt, um keine neue UI-Aktion außerhalb des Sprint-Scopes einzuführen.
