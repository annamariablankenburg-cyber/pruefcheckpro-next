# Data-Access-Layer (Repository → Service → Hook → View)

Status: **Architekturdokument – keine echte Firebase-Anbindung.** Beschreibt, wie Datenzugriff heute (Mock-Daten) strukturiert ist und wie derselbe Aufbau später auf Firestore umgestellt wird, ohne Views/Hooks anfassen zu müssen.

---

## 1. Die vier Schichten

```
View/Komponente → Hook → Service → Repository → Mock-Config
```

### Repository (`src/lib/repositories/`)
- Kennt keine UI, kein React, keine Hooks, keinen Router, keine Toasts.
- Reiner Datenzugriff: `getAll`/`getById`/`create`/`update`/`remove` auf einer In-Memory-Kopie der Mock-Daten aus `src/config/*.ts`.
- Die meisten Repositories nutzen den gemeinsamen Baustein `createArrayRepository<T>` (`src/lib/repositories/base/`), ergänzt um domänenspezifische Statusmethoden (`archive`/`restore` o. Ä.), sofern die Domäne laut `docs/database/status-workflows.md` einen echten „Archiviert“-Status kennt.
- Arbeitet heute **synchron**.

### Service (`src/lib/interfaces/` + `src/lib/services/`)
- Kennt ebenfalls keine UI, kein React, keine Hooks, keinen Router, keine Toasts.
- Jede Domäne hat ein Interface (`I<Domäne>Service`) unter `src/lib/interfaces/` und eine Implementierung (`<domäne>Service`) unter `src/lib/services/`.
- Interfaces definieren eine **fachlich lesbare** API (`getCustomers`, `archiveCustomer`, `restoreProject`, …), unabhängig davon, wie die zugrunde liegende Datenquelle heißt oder arbeitet.
- Implementierungen nutzen heute ausschließlich die passenden Repositories – reines Durchreichen bzw. kleine Mappings (z. B. `setDeviceOutOfService(id)` → `deviceRepository.update(id, { status: "Außer Betrieb" })`).
- Kapselt Businesslogik, die über reinen Datenzugriff hinausgeht (z. B. `statisticsService.getStatisticsRange(zeitraum)`, das intern Zeitraum-Label auf Range-Key mappt, bevor es das Repository befragt).
- Bleibt heute ebenfalls **synchron** – bewusst, damit sich am Verhalten der aufrufenden Hooks nichts ändert.
- Ein kleiner gemeinsamer Baustein `src/lib/interfaces/base.ts` stellt wiederkehrende Funktionssignaturen (`GetAll<T>`, `GetById<T>`, `Create<T>`, `Update<T>`, `Remove`, `StatusTransition<T>`) bereit, die von den Interfaces mit domänenspezifischen Methodennamen zusammengesetzt werden. Es gibt bewusst **keine** gemeinsame Basis-Schnittstelle mit fest vorgegebenen Methodennamen, da jede Domäne fachlich passende Namen behalten soll.

### Hook (`src/hooks/`)
- Darf React nutzen, darf State halten, darf Filter/Suche kapseln (`src/hooks/shared/useEntityList.ts`, `src/hooks/shared/useSearchAndFilter.ts`).
- Lädt die initiale Liste ausschließlich über den passenden Service (z. B. `customerService.getCustomers()`), nie mehr direkt über ein Repository.
- Mutationen (`update`/`archive`/`restore`/`remove`/`create`) laufen heute weiterhin über lokalen React-State (`useEntityList`), nicht über die Service-Methoden – das war schon in der vorherigen Sprintstufe („State-Management-Vorbereitung“) bewusst so entschieden, um jede Verhaltensänderung zu vermeiden. Die entsprechenden Service-Methoden (`archiveCustomer`, `updateProject`, …) existieren bereits vollständig und funktionieren korrekt; sie werden verdrahtet, sobald echte Persistenz (Firestore) ansteht und jede Mutation tatsächlich zur Datenquelle durchgereicht werden muss.

### View/Komponente (`src/components/`, `src/app/`)
- Nutzt ausschließlich Hooks, nie Services oder Repositories direkt.
- Unverändert in Verhalten und Layout durch diesen Sprint.

---

## 2. Domänen-Übersicht

| Domäne | Interface | Service | Repository | Hook |
|---|---|---|---|---|
| Kunden | `ICustomerService` | `customerService` | `customerRepository` | `useCustomers` |
| Projekte | `IProjectService` | `projectService` | `projectRepository` | `useProjects` |
| Geräte | `IDeviceService` | `deviceService` | `deviceRepository` | `useDevices` |
| Proben | `ISampleService` | `sampleService` | `sampleRepository` | `useSamples` |
| Berichte | `IReportService` | `reportService` | `reportRepository` | `useReports` |
| Mitarbeiter | `IEmployeeService` | `employeeService` | `employeeRepository` | `useEmployees` |
| Rollen | `IRoleService` | `roleService` | `roleRepository` | `useRoles` |
| Standorte | `ILocationService` | `locationService` | `locationRepository` | `useLocations` |
| Einladungen | `IInvitationService` | `invitationService` | `invitationRepository` | `useInvitations` |
| Laborbuch | `ILaborbookService` | `laborbookService` | `laborbookRepository` | `useLaborbook` |
| Kalender | `ICalendarService` | `calendarService` | `calendarRepository` | `useCalendar` |
| Prüfwerte | `ITestValueService` | `testValueService` | `testValueRepository` | `useTestEntries` |
| Statistiken | `IStatisticsService` | `statisticsService` | `statisticsRepository` | `useStatistics` |
| PrüfCheck AI | `IAIService` | `aiService` | `aiRepository` | `useAI` |
| Unternehmen | `ICompanyService` | `companyService` | `companyRepository` | – (`/company` liest heute direkt aus dem Repository, siehe Abschnitt 3) |
| Integrationen | `IIntegrationService` | `integrationService` | `integrationRepository` | – (`/integrationen` liest heute direkt aus dem Repository, siehe Abschnitt 3) |

---

## 3. Bekannte Lücken (bewusst nicht in diesem Sprint geschlossen)

- **`company` und `integration`** haben vollständige Interfaces/Services, aber noch keinen eigenen Hook – `src/app/(app)/company/page.tsx` und `src/app/(app)/integrationen/page.tsx` lesen weiterhin direkt aus dem jeweiligen Repository. Das wurde in der vorherigen Sprintstufe („State-Management-Vorbereitung“) explizit außerhalb des Hook-Scopes belassen (kein `useCompany`/`useIntegrations` in der Aufgabenliste) und in diesem Sprint nicht rückwirkend geändert, um „keine UI-Änderungen“ strikt einzuhalten. Service/Interface existieren bereits vollständig – ein künftiger `useCompany`/`useIntegrations`-Hook kann direkt darauf aufsetzen.
- **Mutationen in Hooks** laufen wie in Abschnitt 1 beschrieben weiterhin über lokalen React-State statt über Service-Aufrufe. Die Services sind vollständig, aber für Schreiboperationen heute noch nicht die tatsächliche Quelle der Wahrheit im Hook.

---

## 4. Heutiger Mock-Datenfluss

```
View → Hook → Service → Repository → src/config/*.ts (In-Memory-Array)
```

Beispiel „Kunde archivieren“ (Ziel-Zustand, sobald Mutationen verdrahtet sind):

```
CustomersView.tsx
  → useCustomers().archiveCustomer(id)
    → (heute: lokaler React-State via useEntityList)
    → (Service bereits vorhanden: customerService.archiveCustomer(id))
      → customerRepository.archive(id)
        → In-Memory-Array in customers.ts
```

## 5. Späterer Firebase-Datenfluss

```
View → Hook → Service → Firestore
```

Beispiel, sobald Firestore angebunden ist:

```
CustomersView.tsx
  → useCustomers().archiveCustomer(id)
    → customerService.archiveCustomer(id)
      → updateDoc(doc(db, "companies/{companyId}/customers", id), { status: "Archiviert" })
```

Die Umstellung betrifft ausschließlich die **Service-Implementierungen** (`src/lib/services/*.ts`): Methoden werden `async`, nutzen Firestore-SDK-Aufrufe statt Repository-Aufrufe, ggf. mit `onSnapshot` für Echtzeit-Updates. Die **Interfaces** (`src/lib/interfaces/*.ts`) müssten dafür auf `Promise`-Rückgabetypen umgestellt werden; das ist der einzige Breaking Change, der bei echter Anbindung ansteht – Hooks müssten dann `await`/Ladezustände ergänzen. Views bleiben davon unberührt, solange die Hook-Rückgabewerte (Datenform, Funktionsnamen) gleich bleiben.

---

## 6. Warum das jetzt Firebase-tauglich ist

- Kein View und keine Komponente kennt `config/*.ts`, ein Repository oder Firestore – nur Hooks.
- Kein Hook kennt ein Repository mehr direkt – nur Services.
- Der Wechsel von Mock-Daten zu Firestore ist auf die Service-Schicht begrenzt; Interfaces geben vor, welche Methoden jede Domäne braucht, unabhängig von der Datenquelle.
- Repository-Schicht bleibt bestehen und kann für Tests/lokale Entwicklung weiterhin als Mock-Implementierung dienen, während `services/*.ts` bei Bedarf zwischen Repository- und Firestore-Implementierung wechselt.
