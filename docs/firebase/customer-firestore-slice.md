# Customer-Firestore-Slice

Status: **Erster vollständiger Vertical Slice mit echter Firestore-Anbindung.** Beschreibt, wie `/kunden` heute Daten liest und schreibt, wie zwischen Mock- und Firestore-Modus umgeschaltet wird, und welche Punkte bewusst noch offen sind.

---

## 1. Datenfluss

```
CustomersView.tsx
  → useCustomers() (src/hooks/useCustomers.ts)
    → customerService (src/lib/services/customerService.ts)
      ── isMockDataSource ──→ customerRepository (src/config/customers.ts, In-Memory)
      ── isFirestoreDataSource ──→ firestoreCustomerService (Firestore SDK)
```

- `useCustomers` ist die **einzige** Zugriffsstelle für die Kunden-UI. `CustomersView`, `CustomerTable`, `CustomerDetailDrawer`, `CustomerActionsMenu` und `NewCustomerDialog` kennen weder `customerRepository` noch `firestoreCustomerService` direkt.
- `customerService` (`src/lib/services/customerService.ts`) ist eine Facade: sie entscheidet pro Methode anhand von `isFirestoreDataSource` (`src/config/dataSource.ts`), ob Mock-Repository oder echte Firestore-Implementierung angesprochen wird. Beide Implementieren dasselbe `ICustomerService`-Interface.
- Der Hook lädt einmalig beim Mount über `refreshCustomers()` und hält die Liste als lokalen React-State. Mutationen (`createCustomer`, `updateCustomer`, `archiveCustomer`, `restoreCustomer`, `deactivateCustomer`, `reactivateCustomer`, `removeCustomer`) laufen über den Service und aktualisieren den lokalen State optimistisch mit dem vom Service zurückgegebenen Ergebnis (kein Realtime-Sync/`onSnapshot`).

## 2. Collection-Pfad

```
companies/{companyId}/customers/{customerId}
```

Kein globales `/customers`. Der Pfad wird zentral über `companyCollectionPaths.customers(companyId)` (`src/lib/firebase/collections.ts`) gebildet – nirgends im Code wird der String hartkodiert.

## 3. companyId

`resolveCompanyId()` (`src/lib/firebase/companyContext.ts`) liefert die aktive `companyId`:

- Es gibt heute noch **keinen** React-Context, der den eingeloggten `AppUser` (inkl. `companyId`, siehe `src/types/user.ts`) global bereitstellt.
- Bis dahin liefert `resolveCompanyId()` einen zentralen, dokumentierten Fallback: `DEMO_COMPANY_ID = "demo-company"`.
- Sobald ein echter Auth-/User-Context existiert, muss **nur** `resolveCompanyId()` angepasst werden (z. B. um die `companyId` des eingeloggten Nutzers zu übergeben) – alle Aufrufer (`customerService`) bleiben unverändert, da sie bereits `resolveCompanyId()` statt eines hartkodierten Strings verwenden.

## 4. Mock-/Firestore-Umschaltung

Gesteuert über `NEXT_PUBLIC_DATA_SOURCE` (`.env.example`, lokal in `.env.local`):

| Wert | Verhalten |
|---|---|
| `mock` (Standard) | `customerRepository` – In-Memory-Array aus `src/config/customers.ts`, keine Persistenz über Reloads hinweg |
| `firestore` | `firestoreCustomerService` – echte Reads/Writes gegen `companies/{companyId}/customers` |
| fehlt / ungültiger Wert | fällt sicher auf `mock` zurück (`src/config/dataSource.ts`) |

`.env.local` ist über `.gitignore` (`.env*` mit Ausnahme `!.env*.example`) von Git ausgeschlossen und taucht nicht in `git status` auf.

## 5. CRUD

| Aktion | Hook | Service (Firestore) |
|---|---|---|
| Liste laden | `refreshCustomers()` | `getDocs(collection(...).withConverter(customerConverter))` |
| Anlegen | `createCustomer(input)` | `addDoc(...)`, setzt `createdAt`/`updatedAt` |
| Bearbeiten | `updateCustomer(id, changes)` | `updateDoc(...)`, setzt `updatedAt` neu |
| Deaktivieren | `deactivateCustomer(id)` | `updateDoc(..., { status: "Inaktiv" })` |
| Reaktivieren (aus Inaktiv) | `reactivateCustomer(id)` | `updateDoc(..., { status: "Aktiv" })` |
| Reaktivieren (aus Archiviert) | `restoreCustomer(id)` | `updateDoc(..., { status: "Aktiv" })` |
| Archivieren | `archiveCustomer(id)` | `updateDoc(..., { status: "Archiviert" })` |
| Löschen | `removeCustomer(id)` | `deleteDoc(...)` (heute ohne Cascade/Relationsprüfung, siehe Abschnitt 8) |

- `customerConverter` (`src/lib/firebase/converters/customerConverter.ts`) mappt nur die Dokument-ID (`snapshot.id` ↔ `Customer.id`) – **kein** Datenfeld geht dabei verloren.
- Schreibzugriffe (`updateDoc`) laufen bewusst **ohne** Converter, da `updateDoc` Teil-Updates erwartet; ein `Partial<Customer>` ohne `id` entspricht bereits 1:1 der Firestore-Feldstruktur.
- `NewCustomerDialog` deckt Create **und** Edit ab (ein Formular, `customer`-Prop steuert den Modus): beim Bearbeiten werden alle vorhandenen Werte vorbefüllt, beim Anlegen wird die Kundennummer gegen alle bestehenden Kunden (inkl. archivierter) auf Duplikate geprüft. Der Dialog schließt nur bei Erfolg; Firestore-/Validierungsfehler bleiben als Inline-Meldung im Dialog sichtbar.
- Statuswechsel (Deaktivieren/Reaktivieren/Archivieren) laufen über `ConfirmActionDialog` mit `isLoading`-Guard gegen Doppelklick, sowohl in der Tabelle als auch im geöffneten `CustomerDetailDrawer` (beide werden nach einer Aktion synchron aktualisiert).

## 6. Statusmodell

`Aktiv` → `Inaktiv`/`Archiviert`, `Inaktiv` → `Aktiv`/`Archiviert`, `Archiviert` → `Aktiv` (siehe `src/types/customer.ts`, `CustomerStatus`). Archivierte Kunden sind nicht in „Alle" sichtbar, sondern nur über den Filter „Archiviert" (`src/hooks/shared/useSearchAndFilter.ts`, `archivedFilterValue`).

## 7. Loading/Error

- **Loading:** `useCustomers().loading` – `CustomersView` zeigt einen Skeleton-Platzhalter für KPI-Kacheln und Tabelle, keine springende Tabelle (Layout bleibt stabil, nur Inhalt wird durch Platzhalter ersetzt).
- **Error:** `useCustomers().error` – Text „Kundendaten konnten nicht geladen werden.", Button „Erneut versuchen" ruft `refreshCustomers()` erneut auf. Fehler aus Mutationen (Create/Edit/Statuswechsel) werden **nicht** global über `error` angezeigt, sondern lokal dort, wo sie ausgelöst wurden (Inline-Fehler im Dialog bzw. `FeedbackToast` bei Statuswechseln).
- **Empty State:** bestehender `EmptyState` (`src/components/shared/EmptyState.tsx`), wenn Suche/Filter keine Treffer liefern.

## 8. Emulator-Test

Firestore-Modus lokal gegen die Emulator Suite statt gegen ein echtes Projekt testen:

1. Firebase CLI vorhanden voraussetzen (`npm i -g firebase-tools` oder `npx firebase-tools`).
2. Da noch kein `firebase.json`/`.firebaserc` im Projekt existiert: `firebase init emulators` (Firestore auswählen, Standardport `8080`) im Projektroot ausführen, oder Emulator direkt mit `firebase emulators:start --only firestore --project demo-company` starten.
3. `firestore.rules` (dieses Dokument, Abschnitt 10 im Task-Brief) beim Init als Rules-Datei verknüpfen, damit der Emulator dieselben Regeln durchsetzt wie später produktiv.
4. In `.env.local`: `NEXT_PUBLIC_DATA_SOURCE=firestore` setzen.
5. **Wichtig:** `connectFirestoreEmulator()` ist heute noch **nicht** verdrahtet (siehe `docs/firebase/setup.md`, Abschnitt 4) – `src/lib/firebase/firebase.ts` verbindet sich sonst mit dem echten Firebase-Projekt aus `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. Für einen echten Emulator-Test müsste `firebase.ts` vorübergehend um `connectFirestoreEmulator(db, "localhost", 8080)` ergänzt werden (abhängig von `NEXT_PUBLIC_FIREBASE_USE_EMULATOR`). Das ist bewusst **nicht** Teil dieses Slices (keine Änderung an der bestehenden Firebase-Initialisierung ohne expliziten Auftrag).
6. Unter `/kunden` einen Kunden anlegen/bearbeiten/archivieren/reaktivieren und im Emulator-UI (`localhost:4000`) prüfen, ob das Dokument unter `companies/demo-company/customers/{id}` korrekt erscheint bzw. sich ändert.

## 9. Bekannte offene Punkte

- **Relationsprüfung vor dem Löschen:** `removeCustomer`/`firestoreCustomerService.removeCustomer` löscht heute ohne zu prüfen, ob der Kunde noch in Projekten/Berichten referenziert wird (kein Cascade-Delete, keine Sperre). Siehe `TODO(Firestore-Phase-2)`-Kommentar in `src/lib/firebase/services/firestoreCustomerService.ts`.
- **Audit-Log-Anbindung:** Erstellen/Ändern/Statuswechsel/Löschen werden heute nicht in `companies/{companyId}/auditLog` protokolliert (siehe `docs/database/audit-log.md` für das geplante Modell). Nachzurüsten, sobald das Audit-Log-Modul an echte Schreibpfade angebunden wird.
- **Rollen-/Claims-Prüfung:** `firestore.rules` prüft heute nur „angemeldet + eigene companyId" (per `users/{uid}.companyId`-Lookup, da noch keine Custom Claims existieren). Eine rollenabhängige Einschränkung (nur Admin/Laborleiter dürfen anlegen/bearbeiten/löschen, siehe `docs/database/permissions.md`, Abschnitt 3) ist vorbereitet, aber nicht durchgesetzt – dafür fehlen die Custom Claims (siehe `permissions.md`, Abschnitt 5).
- **companyId-Context:** Noch kein globaler Auth-/User-Context; `resolveCompanyId()` nutzt den dokumentierten `DEMO_COMPANY_ID`-Fallback (siehe Abschnitt 3).
- **Kein Realtime-Sync:** `getDocs`/`getDoc` statt `onSnapshot` – Änderungen durch andere Nutzer/Tabs erscheinen erst nach `refreshCustomers()`.
