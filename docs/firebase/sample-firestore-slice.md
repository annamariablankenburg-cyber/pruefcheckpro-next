# Sample-Firestore-Slice

Status: **Vierter vollständiger Vertical Slice mit echter Firestore-Anbindung (Firestore Phase 4).** Beschreibt, wie `/probekoerper` (Probenmanager) heute Daten liest und schreibt, wie zwischen Mock- und Firestore-Modus umgeschaltet wird, und welche Punkte bewusst noch offen sind. Analog zu `docs/firebase/customer-firestore-slice.md`, `docs/firebase/project-firestore-slice.md` und `docs/firebase/device-firestore-slice.md` (erster bis dritter Slice).

---

## 1. Datenfluss

```
app/(app)/probekoerper/page.tsx
  → useSamples() (src/hooks/useSamples.ts)
    → sampleService (src/lib/services/sampleService.ts)
      ── isMockDataSource ──→ sampleRepository (src/config/samples.ts, In-Memory)
      ── isFirestoreDataSource ──→ firestoreSampleService (Firestore SDK)
```

- Anders als bei Customer/Project/Device gibt es keine separate `SamplesView.tsx` – die Seite `probekoerper/page.tsx` war schon vorher die View-Komponente und wurde direkt angepasst (keine neue Seite, keine neue Hauptansicht).
- `useSamples` ist die **einzige** Zugriffsstelle für die Proben-UI. Die Seite, `SampleTable`, `SampleDetailDrawer`, `SampleActionsMenu` und `NewSampleDialog` kennen weder `sampleRepository` noch `firestoreSampleService` direkt.
- `sampleService` (`src/lib/services/sampleService.ts`) ist eine Facade: sie entscheidet pro Methode anhand von `isFirestoreDataSource` (`src/config/dataSource.ts`, unverändert), ob Mock-Repository oder echte Firestore-Implementierung angesprochen wird. Beide implementieren dasselbe `ISampleService`-Interface (jetzt Promise-basiert).
- Der Hook lädt einmalig beim Mount über `refreshSamples()` und hält die Liste als lokalen React-State. Die Tabellenauswahl für die Massenerfassung (`selectedIds`/`selectedSamples`) lebt ebenfalls im Hook, damit sie nach Archivieren/Löschen zentral bereinigt wird.
- **Nur der Proben-Slice wurde async gemacht** – `src/lib/interfaces/base.ts` (synchrone Signaturen für alle anderen Domänen) ist unverändert, keine Mass-Migration.

## 2. Collection-Pfad

```
companies/{companyId}/samples/{sampleId}
```

Kein globales `/samples`. Der Pfad wird zentral über `companyCollectionPaths.samples(companyId)` (`src/lib/firebase/collections.ts`, bereits vorhanden) gebildet. `companyId` ausschließlich über die bestehende `resolveCompanyId()` (`src/lib/firebase/companyContext.ts`, unverändert) – keine neue/parallele Tenant-Logik.

## 3. Sample-Dokumentstruktur

Alle bestehenden Felder aus `src/types/sample.ts` bleiben erhalten: `id`, `bezeichnung`, `fachbereich`, `probenart`, `pruefverfahren`, `kunde`, `customerId?`, `projekt`, `projectId?`, `standort?`, `entnahmedatum`, `pruefdatum`, `pruefalter`, `status`, `pruefer`, `qrCode?`, `barcode?`, `pruefungen[]`, `anhaenge[]`, `dokumente[]`, `lieferscheine[]`, `historie[]`.

Neu ergänzt (additiv, Firestore-only, wie bei `Customer`/`Project`/`Device`): `createdAt?: string`, `updatedAt?: string` (ISO-Strings).

`sampleConverter` (`src/lib/firebase/converters/sampleConverter.ts`, bereits vorhanden über den generischen `createIdConverter<Sample, "id">("id")`) mappt nur die Dokument-ID (`snapshot.id` ↔ `Sample.id`) – **kein** Datenfeld geht dabei verloren, keine Änderung an diesem Converter nötig.

**Besonderheit gegenüber Customer/Project/Device:** `Sample.id` ist nicht nur eine technische ID, sondern die vom Nutzer im Dialog eingegebene, fachlich sichtbare **Probennummer** (z. B. `BET-2026-015`, Feld „Probennummer" in `NewSampleDialog`). Anders als bei den vorherigen Slices vergibt daher **nicht** Firestore die Dokument-ID über `addDoc`, sondern `firestoreSampleService.createSample` nutzt `setDoc(doc(..., sample.id), ...)` mit der vom Nutzer gewählten ID. Um ein stilles Überschreiben zu verhindern, prüft `createSample` vorab per `getDoc`, ob die Probennummer bereits existiert, und wirft andernfalls einen Fehler. Im Bearbeiten-Modus ist das Feld „Probennummer" deshalb schreibgeschützt (eine Firestore-Dokument-ID lässt sich nicht per `updateDoc` umbenennen – das würde Löschen + Neuanlegen unter neuer ID bedeuten, was außerhalb des Scopes dieses Slices liegt).

## 4. projectId/projectName und customerId/customerName

Eine Probe gehört immer zu einem bestehenden Projekt, das wiederum den Kunden bestimmt:

- `Sample.projectId` referenziert `companies/{companyId}/projects/{projectId}`, `Sample.projekt` ist der Anzeige-Snapshot (Projektname).
- `Sample.customerId`/`Sample.kunde` werden **automatisch aus dem gewählten Projekt abgeleitet** (`project.customerId`/`project.customer`), nicht separat vom Nutzer ausgewählt – entspricht der Vorgabe „Projekt bestimmt normalerweise den Kunden". Das Kunde-Feld im Dialog ist deshalb ein schreibgeschütztes Anzeigefeld, kein eigenes Dropdown.
- `NewSampleDialog` lädt Projekte **read-only** über den bestehenden `useProjects()`-Hook und Kunden **read-only** über `useCustomers()` (nur um den Kundennamen zur gewählten `customerId` aufzulösen) – keine eigene/parallele Liste, keine Schreibzugriffe auf Projekt-/Kundendaten.
- Das Projekt-Dropdown zeigt `activeProjects` (nicht archiviert); pausierte/abgeschlossene Projekte bleiben wählbar, aber mit Status-Suffix gekennzeichnet (`" (Pausiert)"`/`" (Abgeschlossen)"`). Ist das Projekt der aktuell bearbeiteten Probe inzwischen archiviert, bleibt es als vorhandene Auswahl sichtbar (sonst würde Bearbeiten ohne Projektwechsel fehlschlagen), ist aber für neue Zuordnungen nicht wählbar.
- Vor dem Speichern wird geprüft: Projekt gültig geladen → Projekt hat eine `customerId` → zugehöriger Kunde ist geladen. Fehlt eine dieser Voraussetzungen, wird **nicht** gespeichert, sondern ein passender Inline-Fehler angezeigt (z. B. „Das gewählte Projekt hat keinen zugeordneten Kunden.").
- Können Projekte oder Kunden nicht geladen werden, zeigt der Dialog statt des Dropdowns einen Fehlerzustand mit „Erneut versuchen"-Button; das Formular lässt sich in diesem Zustand nicht abschicken.
- **Projektwechsel beim Bearbeiten:** Da Kunde/Kunden-ID direkt aus dem im Formular gewählten Projekt abgeleitet werden, aktualisiert ein Projektwechsel die Kundenzuordnung automatisch – keine separate Logik nötig.

## 5. Mock-/Firestore-Umschaltung

Gesteuert über `NEXT_PUBLIC_DATA_SOURCE` (`.env.example`, lokal in `.env.local`), identisch zu den vorherigen Slices:

| Wert | Verhalten |
|---|---|
| `mock` (Standard) | `sampleRepository` – In-Memory-Array aus `src/config/samples.ts`, keine Persistenz über Reloads hinweg |
| `firestore` | `firestoreSampleService` – echte Reads/Writes gegen `companies/{companyId}/samples` |
| fehlt / ungültiger Wert | fällt sicher auf `mock` zurück (`src/config/dataSource.ts`, unverändert) |

## 6. CRUD

| Aktion | Hook | Service (Firestore) |
|---|---|---|
| Liste laden | `refreshSamples()` | `getDocs(collection(...).withConverter(sampleConverter))` |
| Anlegen | `createSample(sample)` | `setDoc` unter der vom Nutzer vergebenen Probennummer (siehe Abschnitt 3), setzt `createdAt`/`updatedAt` |
| Bearbeiten | `updateSample(id, changes)` | `updateDoc(...)`, setzt `updatedAt` neu |
| Löschen | `removeSample(id)` | `deleteDoc(...)` (heute ohne Cascade/Relationsprüfung, siehe Abschnitt 10) |

- `NewSampleDialog` deckt Create **und** Edit über eine einzige, dauerhaft gemountete Dialog-Instanz ab (`sample`-Prop steuert den Modus). Beim Bearbeiten werden alle vorhandenen Werte vollständig vorbefüllt; beim Anlegen wird die Probennummer gegen alle bestehenden Proben auf Duplikate geprüft (zusätzlich zur serverseitigen Existenzprüfung in `firestoreSampleService.createSample`). Der Dialog schließt nur bei Erfolg; Fehler bleiben als Inline-Meldung sichtbar.
- Beim Bearbeiten werden **nur** die im Formular vorhandenen Felder gesendet (Bezeichnung, Projekt/Kunde-Referenz, Fachbereich, Probenart, Daten, Standort, Prüfer, QR-/Barcode) – `pruefungen`, `anhaenge`, `dokumente`, `lieferscheine`, `historie` und `pruefverfahren` bleiben unangetastet (Teil-Update via `updateDoc`/`update()`), damit bestehende Prüfungen/Anhänge/Historie nicht versehentlich überschrieben werden.
- `pruefverfahren` (im Domain-Typ ein Pflichtfeld, im UI-Formular aber ohne eigenes Eingabefeld) wird **nur beim Anlegen** aus dem gewählten Prüfalter abgeleitet (z. B. `"28 Tage"` → `"28-Tage-Prüfung"`), beim Bearbeiten nicht verändert.
- Zwei UI-Felder aus dem bisherigen Dialog-Mockup (**Probennehmer**, **Lagerort**) sowie **Notizen** haben im `Sample`-Type kein Gegenstück und wurden – wie schon vor diesem Slice – nicht mit echten Daten verknüpft (jetzt sichtbar als deaktivierte Felder statt stillschweigend wirkungslos). Siehe „Bekannte offene Punkte".

## 7. Statusübergänge

Bestehende Statuswerte unverändert (`src/types/sample.ts`, `SampleStatus`): `Offen` · `Vorbereitung` · `In Prüfung` · `Überfällig` · `Abgeschlossen` · `Archiviert`.

```
(Offen | Vorbereitung) ──startSample──► In Prüfung
(In Prüfung | Überfällig) ──completeSample──► Abgeschlossen ──reopenSample──► In Prüfung
(alle Status außer Archiviert) ──archiveSample──► Archiviert ──reactivateSample──► Abgeschlossen
```

`Überfällig` ist im bestehenden Domain-Typ (`SampleStatus`) ein echter Status (nicht nur ein Anzeige-Hinweis wie `Project.overdue`) – unverändert übernommen, keine neue Statuslogik erfunden. Alle Statuswechsel laufen über `ConfirmActionDialog` mit `isLoading`-Guard gegen Doppelklick, sowohl in der Tabelle als auch im geöffneten `SampleDetailDrawer` (beide werden nach einer Aktion synchron aktualisiert), plus `FeedbackToast`-Erfolgsmeldung.

## 8. Duplizieren

`duplicateSample(id)` (Hook → Service → `firestoreSampleService.duplicateSample`/Mock-Zweig):

1. Lädt die Original-Probe.
2. Ermittelt über `deriveUniqueSampleId()` (exportiert aus `firestoreSampleService.ts`, von beiden Datenquellen genutzt) eine noch nicht vergebene Probennummer nach dem Muster `{id}-KOPIE`, bei Kollision `{id}-KOPIE-2`, `{id}-KOPIE-3`, … – verhindert doppelte Probennummern auch bei mehrfachem Duplizieren derselben Probe.
3. Setzt den Status auf `"Offen"` (sinnvoller Startstatus, wie im bisherigen UI-Verhalten).
4. **Übernimmt `pruefungen` bewusst nicht** (leeres Array) – bestehende Messwerte/Prüfungen gelten nicht blind als abgeschlossen auf einer neuen Probe.
5. Übernimmt `anhaenge`/`dokumente`/`lieferscheine` unverändert (das bisherige UI-Verhalten hat sie bereits per Spread übernommen).
6. Ergänzt einen neuen Historie-Eintrag (`"Dupliziert von {original-id}."`) und setzt `createdAt`/`updatedAt` neu.
7. Legt die Kopie unter der neuen ID an (Firestore: `setDoc`; Mock: `sampleRepository.create`).

Die Seite zeigt die tatsächlich vom Service erzeugte neue Probennummer im `FeedbackToast` an (nicht mehr wie zuvor lokal geraten).

## 9. Bulk-Aktionen

`bulkUpdateSamples`/`bulkArchiveSamples`/`bulkRemoveSamples` (Hook → Service → Firestore `writeBatch` bzw. Mock-Schleife über `sampleRepository`) decken alle bestehenden Massenerfassungs-Aktionen ab:

| UI-Aktion | Hook-Aufruf |
|---|---|
| Prüfer für Auswahl ändern | `bulkUpdateSamples(ids, { pruefer: value })` |
| Status für Auswahl ändern | `bulkUpdateSamples(ids, { status: value })` |
| Archivieren | `bulkArchiveSamples(ids)` |
| Löschen | `bulkRemoveSamples(ids)` |
| Export | weiterhin nur `FeedbackToast`-Platzhalter (kein echter Export in diesem Sprint) |

Alle drei Methoden geben ein `BulkResult` (`{ succeededIds, failedIds }`, `src/lib/interfaces/ISampleService.ts`) zurück statt eines einfachen Booleans, damit die UI bei Teilfehlern **keine falsche Erfolgsmeldung** zeigt (z. B. „3 von 5 Proben archiviert, 2 fehlgeschlagen."). Im Firestore-Modus laufen die Schreibungen über `writeBatch` – Firestore-Batches sind atomar, entweder gelingen alle Schreibungen einer Batch oder keine; ein Teilfehler kann also nur zwischen mehreren Aufrufen auftreten, nicht innerhalb einer Batch. **Bewusst kein Chunking** über das 500-Operationen-Limit einer Firestore-Batch hinaus (siehe „Bekannte offene Punkte") – in der Praxis liegt eine Massenauswahl weit darunter.

Vor „Ausgewählte Proben löschen?" zeigt `ConfirmActionDialog` den Hinweis „Verknüpfte Prüfwerte und Berichte werden nicht automatisch gelöscht." (in die bestehende Beschreibung integriert). Alle Bulk-Dialoge (`ConfirmActionDialog`, `BulkFieldDialog`) haben einen `isLoading`-Guard gegen Doppelklick; die Auswahl wird nach erfolgreicher Aktion für die tatsächlich erfolgreichen IDs bereinigt (`dropFromSelection` im Hook).

## 10. Löschen und Rollenhinweis

`removeSample`/`firestoreSampleService.removeSample` löscht das Dokument vollständig (kein Cascade-Delete). `DeleteSampleDialog` bleibt inhaltlich unverändert (Text zum Azubi-Hinweis „Löschen ist später nur für Rollen außer Azubi erlaubt." bleibt erhalten) und hat jetzt zusätzlich einen `isLoading`-Guard gegen Doppelklick. Eine echte Rollenprüfung wird in diesem Sprint **nicht** implementiert (kein Auth-/Claims-Context) – siehe Abschnitt 12 und `firestore.rules`.

Messreihen innerhalb einer Prüfung (`SamplePruefung`, eingebettet in `Sample.pruefungen`) sind vom Löschen der gesamten Probe getrennt zu betrachten und nicht Teil dieses Slices (Prüfwert-CRUD bleibt unverändert, siehe Scope-Schutz).

## 11. Loading/Error/Empty

- **Loading:** `useSamples().loading` – die Seite zeigt einen Skeleton-Platzhalter für die 6 KPI-Kacheln und die Tabelle, keine springende Tabelle (identisches Muster zu Customer/Project/Device).
- **Error:** `useSamples().error` – Text „Probendaten konnten nicht geladen werden.", Button „Erneut versuchen" ruft `refreshSamples()` erneut auf.
- **Empty State:** bestehender `EmptyState` (via `SampleTable`, unverändert), wenn Suche/Filter keine Treffer liefern.

## 12. Emulator-Test

Gleicher Ablauf wie bei den vorherigen Slices (siehe `project-firestore-slice.md` Abschnitt 10):

1. `firebase emulators:start --only firestore --project demo-pruefcheckpro-emulator`, `firestore.rules` (jetzt mit `companies/{companyId}/samples`-Block) verknüpft.
2. In `.env.local`: `NEXT_PUBLIC_DATA_SOURCE=firestore` setzen.
3. `connectFirestoreEmulator()` ist in der App selbst weiterhin **nicht** verdrahtet – bewusst nicht Teil dieses Slices.
4. Unter `/probekoerper` eine Probe anlegen/bearbeiten/starten/abschließen/wieder öffnen/archivieren/reaktivieren/duplizieren, Massenaktionen ausführen, und im Emulator-UI (`localhost:4000`) prüfen, ob die Dokumente unter `companies/demo-company/samples/{id}` korrekt erscheinen bzw. sich ändern.

## 13. Seed

`scripts/seedSamples.ts` (neu, gleiches Muster wie `scripts/seedProjects.ts`) schreibt die bestehenden Mock-Daten aus `src/config/samples.ts` nach `companies/{companyId}/samples` – ausschließlich gegen den lokalen Emulator (fest verdrahtet auf `localhost:8080`, Platzhalter-`projectId`), unabhängig von `.env.local`.

**Ablauf:**

1. Emulator mit passender Projekt-ID starten: `firebase emulators:start --only firestore --project demo-pruefcheckpro-emulator`.
2. **Rules-Hinweis** (siehe `project-firestore-slice.md` Abschnitt 11, Option A/B): Der Emulator setzt `firestore.rules` standardmäßig durch; ein unauthentifizierter Schreibzugriff des Client-SDK würde von `belongsToCompany()` abgelehnt. Für einen erfolgreichen Seed-Lauf entweder temporär mit permissiven, nur lokalen Regeln starten oder vorab einen Auth-Emulator-Testnutzer mit passendem `users/{uid}.companyId` anlegen.
3. Skript ausführen: `npx tsx scripts/seedSamples.ts` (optional `--force`, um bestehende Dokumente bewusst zu überschreiben statt zu überspringen – z. B. nach einer Feldänderung am Sample-Type).
4. Ergebnis in der Konsole: Anzahl angelegter/überschriebener/übersprungener Proben. **Kein blindes Überschreiben** ohne `--force`: bereits vorhandene Dokumente (gleiche Probennummer) werden standardmäßig übersprungen – erneutes Ausführen ist ohne Flag gefahrlos möglich (idempotent).
5. Keine Secrets: das Skript verwendet keine echte `firebaseConfig`, nur eine Platzhalter-`projectId` für den Emulator.

## 14. Bekannte offene Punkte

- **Relationsprüfung vor dem Löschen:** `removeSample`/`firestoreSampleService.removeSample` löscht heute ohne zu prüfen, ob die Probe noch von Prüfwerten, Berichten, Kalendereinträgen, Laborbuch-Einträgen oder dem Baustellenmodus referenziert wird (kein Cascade-Delete, keine Sperre) – siehe `docs/database/relationships.md`. Siehe `TODO(Firestore-Phase-5)`-Kommentar in `src/lib/firebase/services/firestoreSampleService.ts`. Gleiches gilt für Bulk-Löschen.
- **Audit-Log-Anbindung:** Erstellen/Ändern/Statuswechsel/Duplizieren/Löschen (einzeln und in Bulk) werden heute nicht in `companies/{companyId}/auditLog` protokolliert (siehe `docs/database/audit-log.md`).
- **Rollen-/Claims-Prüfung:** `firestore.rules` prüft heute nur „angemeldet + eigene companyId" (per `users/{uid}.companyId`-Lookup, gleiches Muster wie bei `customers`/`projects`/`devices`). Die fachliche Regel „Azubis dürfen keine Probe endgültig löschen" (siehe `docs/database/permissions.md`, Regel 1) ist im UI vorbereitet (`DeleteSampleDialog`-Hinweistext), aber **nicht** serverseitig durchgesetzt – dafür fehlen die Custom Claims (Rolle im Auth-Token). Keine neue Rollenprüfung in diesem Sprint implementiert, wie im Auftrag vorgegeben.
- **QR-/Barcode-Felder:** `qrCode?`/`barcode?` bleiben reine optionale boolesche Kennzeichnungen (keine echte QR-/Barcode-Generierung oder -Anzeige, wie schon vor diesem Slice) – niemals Pflichtfelder.
- **Probennehmer/Lagerort/Notizen ohne Datenfeld:** Der bisherige UI-Mock hatte Eingabefelder für „Probennehmer" und „Lagerort" sowie ein Notizfeld, die im `Sample`-Type kein Gegenstück haben und daher nie funktional waren. In diesem Slice bewusst nicht um neue Felder erweitert (kein Redesign, keine Erweiterung des Domain-Typs über die im Auftrag genannten Felder hinaus) – die drei Felder sind jetzt sichtbar deaktiviert statt stillschweigend wirkungslos. Bei Bedarf: `Sample.collector?`/`Sample.storageLocation?`/`Sample.notes?` als optionale Felder ergänzen (additiv, kein Breaking Change).
- **`pruefverfahren` ohne eigenes Formularfeld:** Wird beim Anlegen aus dem Prüfalter abgeleitet (siehe Abschnitt 6), da der bestehende Dialog dafür kein Eingabefeld vorsieht. Für eine präzisere Erfassung (z. B. „Marshall-Prüfung" bei Asphalt-Bohrkernen, siehe Mock-Daten) wäre ein eigenes Eingabefeld sinnvoll – außerhalb des Scopes „kein Redesign" dieses Slices.
- **Kein Chunking über das Firestore-Batch-Limit hinaus:** Bulk-Aktionen mit mehr als 500 ausgewählten Proben würden die Batch-Grenze überschreiten (siehe Abschnitt 9) – in der Praxis nicht erwartet, aber nicht abgefangen.
- **Kein Realtime-Sync:** `getDocs`/`getDoc` statt `onSnapshot` – Änderungen durch andere Nutzer/Tabs erscheinen erst nach `refreshSamples()`.
