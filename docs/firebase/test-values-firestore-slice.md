# Test-Values-Firestore-Slice (Prüfwerte/Prüfungen)

> **Update (Rules Phase 2):** `testValues` prüft serverseitig nicht mehr nur die Membership, sondern pruefungen.ansehen / .erstellen / .bearbeiten / .loeschen (Tabelle, Tenant-Isolation, Service-Abhängigkeiten und Deployment-Hinweise: `docs/firebase/role-permission-rules-phase2.md`). Prüfwerte gehören zu den Prüfungen (`pruefungen.*`). Das Prüfwert-Dokument liegt unter der Probennummer: beim Anlegen muss `sampleId` der Dokument-ID entsprechen, danach ist es unveränderlich (kein Cross-Read). Aussagen unten, dass „jedes aktive Mitglied alles darf“, gelten nicht mehr.

> **Update (UI Gating Phase 2):** `/pruefungen` ist ohne `pruefungen.ansehen` gesperrt; Neue Prüfung braucht zusätzlich `proben.ansehen`; Messwerte/Status = `pruefungen.bearbeiten` (sonst schreibgeschützter Workspace), Löschen = `pruefungen.loeschen`; Proben/Berichte werden nur mit ihrem Leserecht geladen. Details: `docs/firebase/ui-permission-gating-phase2.md`.

Status: **Fünfter vollständiger Vertical Slice mit echter Firestore-Anbindung (Firestore Phase 5).** Beschreibt, wie `/pruefungen` heute Daten liest und schreibt, wie Messreihen/Entwürfe/Ergebnisse persistiert werden, und welche Punkte bewusst noch offen sind. Analog zu `docs/firebase/customer-firestore-slice.md`, `docs/firebase/project-firestore-slice.md`, `docs/firebase/device-firestore-slice.md` und `docs/firebase/sample-firestore-slice.md` (erster bis vierter Slice).

---

## 1. Datenfluss

```
app/(app)/pruefungen/page.tsx
  → useTestEntries() (src/hooks/useTestEntries.ts)
    → testValueService (src/lib/services/testValueService.ts)
      ── isMockDataSource ──→ testValueRepository (src/config/testValues.ts, In-Memory)
      ── isFirestoreDataSource ──→ firestoreTestValueService (Firestore SDK)
```

- Wie bei Samples gibt es keine separate `TestValuesView.tsx` – `pruefungen/page.tsx` war schon vorher die View-Komponente und wurde direkt angepasst (keine neue Seite, keine neue Hauptansicht).
- `useTestEntries` ist die **einzige** Zugriffsstelle für die Prüfwerte-UI. Die Seite, `TestEntryTable`, `TestValueDrawer`/`MeasurementWorkspacePanel` und `NewTestEntryDialog` kennen weder `testValueRepository` noch `firestoreTestValueService` direkt.
- `testValueService` ist eine Facade: branch je Methode anhand von `isFirestoreDataSource` (`src/config/dataSource.ts`, unverändert). Beide Implementierungen erfüllen dasselbe `ITestValueService`-Interface (jetzt Promise-basiert).
- Der Hook lädt einmalig beim Mount über `refreshTestEntries()`. Der geöffnete Workspace-Datensatz (`activeTestEntry`) lebt im Hook, damit er nach jeder Mutation synchron mit der Liste bleibt.
- **Nur der Prüfwerte-Slice wurde async gemacht** – `src/lib/interfaces/base.ts` bleibt unverändert, keine Mass-Migration.

## 2. Collection-Pfad

```
companies/{companyId}/testValues/{testValueId}
```

Kein globales `/testValues`. Pfad über `companyCollectionPaths.testValues(companyId)` (bereits vorhanden). `companyId` ausschließlich über die bestehende `resolveCompanyId()` (`src/lib/firebase/companyContext.ts`, unverändert).

## 3. Dokumentstruktur – sampleId als Primärschlüssel

**Wichtige Besonderheit (wie im Auftrag gefordert dokumentiert):** `TestEntry.sampleId` war bereits **vor** diesem Slice der Primärschlüssel (`testValueRepository` war mit `(entry) => entry.sampleId` indiziert, `testValueConverter = createIdConverter<TestEntry, "sampleId">("sampleId")`). Das wurde **nicht geändert** – eine Umstellung auf eine neue, von `sampleId` getrennte ID hätte u. a. `TestEntryTable`, `TestValueCard`, `TestValueDrawer`, `MeasurementWorkspacePanel` und sämtliche Call-Sites angefasst, ohne fachlichen Mehrwert (heute gilt strikt 1 Probe → höchstens 1 Prüfung).

Stattdessen wurde additiv ein `id?: string`-Feld ergänzt, das beim Anlegen stets gleich `sampleId` gesetzt wird (Dokument-ID = `sampleId` = `id`). Das bereitet eine spätere 1:n-Beziehung (eine Probe mit mehreren Prüfungen, siehe `docs/database/relationships.md`, das schon "1 Probe → n Prüfwert-Einträge" vorsieht) vor, ohne heute etwas umzustellen: `getTestEntriesBySampleId()` ist bereits als echte `where("sampleId", "==", …)`-Query implementiert (liefert heute 0..1 Treffer), nicht als einfacher `getDoc` – Aufrufer müssten bei einer künftigen 1:n-Erweiterung nicht geändert werden.

Alle bestehenden Felder bleiben erhalten: `sampleId`, `bezeichnung`, `titel`, `testType`, `kunde`, `projekt`, `fachbereich`, `pruefdatum`, `pruefalter`, `pruefer`, `status`, `ergebnis`.

Neu ergänzt (additiv):

| Feld | Zweck |
|---|---|
| `id?` | Spiegelt `sampleId` (siehe oben) |
| `projectId?`, `customerId?` | Anzeige-Snapshot-FKs, aus der Probe übernommen (siehe Abschnitt 4) |
| `notes?` | Prüfkommentar (Details-Tab) – vorher rein lokaler State, nie gespeichert |
| `activePruefart?` | Zuletzt aktive Prüfart, Workspace setzt beim Wiederöffnen dort fort |
| `rowsByPruefart?` | Messreihen je Prüfart, eingebettetes Objekt (siehe Abschnitt 8) |
| `resultsByPruefart?` | Rein rechnerische Ergebnis-Snapshots je Prüfart (siehe Abschnitt 9, `TestValueResultSnapshot`) |
| `history?` | Echte Verlaufshistorie (ersetzt die vorher pro Render synthetisierten Einträge) |
| `createdAt?`, `updatedAt?`, `draftSavedAt?`, `completedAt?` | Zeitstempel wie bei den vorherigen Slices |

`testValueConverter` (unverändert, `createIdConverter<TestEntry, "sampleId">("sampleId")`) mappt weiterhin nur `sampleId` ↔ Dokument-ID – kein bestehendes Feld geht verloren.

## 4. Probenreferenz (sampleId/sampleNumber, projectId/projectName, customerId/customerName)

- Jede Prüfung gehört zu einer bestehenden Probe (`sampleId`, zugleich Primärschlüssel – siehe Abschnitt 3). Da `Sample.id` selbst die fachliche Probennummer ist (siehe `docs/firebase/sample-firestore-slice.md`), deckt `sampleId` bereits das im Auftrag genannte "sampleNumber" ab – kein zusätzliches Feld nötig.
- `projectId`/`customerId` sowie die Anzeige-Snapshots `projekt`/`kunde` werden **aus der Probe übernommen** (`sample.projectId`, `sample.projekt`/`projekt`-Analogon, `sample.customerId`, `sample.kunde`), nicht separat vom Nutzer gepflegt – read-only Zugriff über `useSamples()`/`config/samples.ts`. Keine Änderung am Sample-Slice.
- `fachbereich` wird 1:1 von der Probe übernommen (`sample.fachbereich`).
- **Erstellung über `NewTestEntryDialog`:** Ein kompakter Auswahl-Dialog (bewusst so schlank wie `BulkFieldDialog`, kein volles Formular) zeigt nur Proben, die (a) nicht archiviert sind (`useSamples().activeSamples`) und (b) noch keine Prüfung haben (Abgleich gegen die geladene `testEntries`-Liste). Alle übrigen Felder werden über `buildTestEntryFromSample()` (`src/config/testValues.ts`) aus der Probe abgeleitet.
- **Erstellung über Deep-Link (`/pruefungen?sampleId=…`):** `probekoerper/page.tsx` verlinkt jetzt mit der echten `sampleId` (`onEnterValues`, vorher wurde das Sample-Argument ignoriert). `pruefungen/page.tsx` prüft beim Laden: existiert bereits eine Prüfung zu dieser `sampleId` → öffnen; sonst Probe validieren (muss existieren und nicht archiviert sein) und per `createTestEntry(buildTestEntryFromSample(sample))` neu anlegen. Eine ungültige/archivierte `sampleId` wird abgelehnt (`FeedbackToast`, keine Prüfung angelegt).

## 5. Mock-/Firestore-Umschaltung

Gesteuert über `NEXT_PUBLIC_DATA_SOURCE`, identisch zu den vorherigen Slices. `mock` → `testValueRepository` (In-Memory, `src/config/testValues.ts`). `firestore` → `firestoreTestValueService`. Fehlt/ungültig → `mock`.

## 6. CRUD

| Aktion | Hook | Service (Firestore) |
|---|---|---|
| Liste laden | `refreshTestEntries()` | `getDocs(...)` |
| Nach Probe laden | – (intern genutzt) | `getTestEntriesBySampleId()`, echte `where("sampleId", "==", …)`-Query |
| Anlegen | `createTestEntry(entry)` | `setDoc` unter `sampleId` (kein `addDoc`, siehe Abschnitt 3), Existenzprüfung vorab (keine doppelte Probe+Prüfung-Kombination – siehe Abschnitt 3: heute ohnehin höchstens 1 Prüfung pro Probe) |
| Bearbeiten | `updateTestEntry(sampleId, changes)` | `updateDoc(...)` |
| Löschen | `removeTestEntry(sampleId)` | `deleteDoc(...)` (siehe Abschnitt 13) |

Edit-Verhalten (Workspace): Beim Öffnen werden Messreihen (`rowsByPruefart`), Notizen (`notes`) und die zuletzt aktive Prüfart (`activePruefart`) vollständig aus der Prüfung geladen; Messreihen/Historie werden bei Teil-Updates (`updateDoc`) nie überschrieben, da nur die tatsächlich geänderten Felder gesendet werden.

## 7. Entwurf speichern

`saveDraft(sampleId, changes)` (Hook → Service → `firestoreTestValueService.saveDraft`/Mock-Zweig):

- Speichert `rowsByPruefart` (nur die aktive Prüfart wird überschrieben, andere Prüfarten bleiben unangetastet), `notes`, `activePruefart`, einen neuen `history`-Eintrag, sowie `draftSavedAt` + `updatedAt` (beide serverseitig in `firestoreTestValueService.saveDraft` gesetzt).
- UI-Verhalten (`MeasurementWorkspacePanel`/`TestValueDrawer`): Workspace bleibt offen, Speichern-Button zeigt einen Lade-Indikator und ist währenddessen deaktiviert (Doppelklick-Schutz), `FeedbackToast` zeigt „Entwurf gespeichert.“ bei Erfolg bzw. eine Fehlermeldung bei Fehlschlag (Dirty-State bleibt dann erhalten, siehe Abschnitt 10).
- Undo-Historie (`historyByPruefart`, lokaler Undo-Stack für die letzten 20 Änderungen) bleibt bewusst **rein lokal** und wird nicht persistiert (siehe Abschnitt 11).

## 8. Messreihen als eingebettetes Array

`TestEntry.rowsByPruefart: Partial<Record<PruefartKey, PruefartRow[]>>` – **keine Subcollection**, wie im Auftrag gefordert. Eine Prüfung kann innerhalb ihres Fachbereichs mehrere Prüfarten mit jeweils eigenen Messreihen haben (z. B. Beton: Druckfestigkeit UND Rohdichte) – das war schon im bisherigen UI-Prototyp so angelegt (linke Navigation listet alle Prüfarten des Fachbereichs mit eigenem Dirty-Indikator), deshalb ein Objekt je Prüfart statt eines einzigen flachen Arrays.

- **Startwerte:** Fehlt ein Prüfart-Key in `rowsByPruefart` (noch nie gespeichert), greift der Workspace auf die Beispieldaten aus `config/pruefarten.ts` (`pruefartRows`) zurück – das entspricht dem bisherigen Verhalten (jede Prüfung startete mit denselben Beispiel-Messreihen). Nach dem ersten „Entwurf/Ergebnis speichern" hält `rowsByPruefart` echte, individuelle Daten.
- **Zeile hinzufügen/duplizieren/löschen:** unverändert gegenüber dem bisherigen UI-Code (`TestValueDrawer.tsx`), jetzt aber auf echten, aus der Prüfung geladenen Startdaten statt auf einer global geteilten Mock-Variable.
- **Reihenfolge/IDs:** `PruefartRow.id` bleibt stabil (`row-{pruefart}-{timestamp}` beim Anlegen), Reihenfolge ist Array-Reihenfolge – unverändert.
- **Validierungsfehler:** bleiben rein UI-lokal (`src/lib/measurementValidation.ts`, `touchedFields`), werden nie mitgespeichert.
- **Berechnete Felder:** werden mitgespeichert, weil `PruefartRow.values` (inkl. `kind: "calculated"`-Feldern) bereits im bisherigen Modell ein einziges flaches `Record<string, string>` ist – es gibt keine separate Trennung zwischen eingegebenen und berechneten Werten auf Zeilenebene, daher auch keine zusätzliche Filterung nötig.

## 9. Ergebnis speichern

`saveResult(sampleId, changes)`:

- Berechnet **ausschließlich rein rechnerisch** Mittelwert/Minimum/Maximum/Standardabweichung aus den eingetragenen Messwerten (`computeStatsFromValues()`, neu in `src/lib/measurementValidation.ts`, von `MeasurementWorkspacePanel` **und** `TestValueDrawer.handleSaveResult` gemeinsam genutzt – Live-Vorschau und gespeichertes Ergebnis können dadurch nie auseinanderlaufen).
- Persistiert diese Kennzahlen als `TestValueResultSnapshot` (`count`, `mittelwert`, `minimum`, `maximum`, `standardabweichung`, `bewertung`, `bewertungsHinweis`, `savedAt`) unter `resultsByPruefart[aktivePruefart]`.
- **Wichtig (wie im Auftrag gefordert):** `bewertung`/`bewertungsHinweis` werden **unverändert aus der statischen `PruefartDefinition`** (`config/pruefarten.ts`) übernommen – das sind feste Konfigurationswerte, **keine neu berechnete, verbindliche Normbewertung**. Es wird an keiner Stelle neue Logik eingeführt, die aus den Messwerten ein Bestanden/Nicht-bestanden-Urteil ableitet. Der bestehende Hinweis „Berechnungen dienen der rechnerischen Unterstützung und müssen fachlich geprüft werden." (`MeasurementWorkspacePanel.tsx`) bleibt unverändert sichtbar.
- Aktualisiert zusätzlich `entry.ergebnis` (die in der Tabelle sichtbare Kurzanzeige) mit dem formatierten Mittelwert, analog zum bisherigen Mock-Format (z. B. „23,20 N/mm²").
- `calculationPreview` wird **nicht** separat persistiert – sie ist vollständig aus `rowsByPruefart` + der Prüfart-Definition ableitbar und wird bei jedem Öffnen neu berechnet (vermeidet veraltete/widersprüchliche Doppeldaten).

## 10. Statusübergänge

Bestehende Statuswerte unverändert (`TestEntryStatus`): `Offen` · `Vorbereitung` · `In Bearbeitung` · `Überfällig` · `Abgeschlossen`.

```
(Offen | Vorbereitung | Überfällig) ──startTest──► In Bearbeitung
(In Bearbeitung | Überfällig) ──completeTest──► Abgeschlossen (setzt completedAt)
Abgeschlossen ──reopenTest──► In Bearbeitung (entfernt completedAt via deleteField())
```

Alle drei laufen über `ConfirmActionDialog` mit `isLoading`-Guard gegen Doppelklick, plus `FeedbackToast`. `completedAt` wird bei `reopenTest` über Firestores `deleteField()`-Sentinel vollständig entfernt (nicht nur auf einen Platzhalter gesetzt), im Mock-Modus auf `undefined` – beides macht „kein Abschlussdatum" eindeutig statt unklar.

## 11. Unsaved Changes / Undo / Reset

- **Unsaved-Changes-Dialog** (`UnsavedChangesDialog`, inhaltlich unverändert, jetzt mit `isLoading`-Prop): wird ausgelöst (a) beim Wechsel der Prüfart mit ungespeicherten Messreihen (bestehendes Verhalten) **und neu** (b) beim Schließen des gesamten Workspace mit ungespeicherten Messreihen (`TestValueDrawer` fängt das Schließen über eine `forwardRef`/`useImperativeHandle`-Brücke zur Workspace-Komponente ab, da der Dirty-State dort lebt). „Entwurf speichern" in diesem Dialog wartet jetzt auf den echten Service-Aufruf (Buttons währenddessen deaktiviert); bei Fehler bleibt der Dialog offen und der Workspace schließt nicht (keine falsche Erfolgsmeldung).
- **Undo** (`historyByPruefart`, letzte 20 Änderungen je Prüfart): bleibt bewusst **rein lokal**, wie im Auftrag gefordert – keine Firestore-Schreibung, kein `undo`-Feld im Domain-Modell.
- **Reset** („Messreihe zurücksetzen"/„Prüfung zurücksetzen"): ändert ausschließlich lokalen State, setzt auf den Stand zurück, mit dem der Workspace in der aktuellen Sitzung geöffnet wurde (`initialRowsRef`, selbst wieder aus `entry.rowsByPruefart` bzw. den Beispieldaten abgeleitet – siehe Abschnitt 8). Erst ein anschließendes „Entwurf/Ergebnis speichern" schreibt den zurückgesetzten Stand nach Firestore. Kein automatischer, destruktiver Schreibzugriff beim bloßen Klick auf Reset.
- `unsavedChanges` ist bewusst **kein persistiertes Feld**: Es beschreibt den Unterschied zwischen aktuellem In-Memory-State und dem zuletzt gespeicherten Stand – ein rein clientseitiges Konzept, das keinen Sinn als Server-Feld hätte.

## 12. Loading/Error/Empty

- **Loading:** `useTestEntries().loading` – Skeleton-Platzhalter für die 5 KPI-Kacheln und die Tabelle (identisches Muster zu den vorherigen Slices). Zusätzlich ein transienter `isPreparingEntry`-Zustand (ebenfalls über denselben Skeleton dargestellt) während eine Prüfung über „?sampleId=" neu angelegt wird, bevor der Workspace öffnet – kein Workspace mit leeren Platzhalterwerten.
- **Error:** Text „Prüfdaten konnten nicht geladen werden.", Button „Erneut versuchen" (`refreshTestEntries()`).
- **Empty State:** bestehender `EmptyState` (via `TestEntryTable`, unverändert).

## 13. Löschen

`removeTestEntry(sampleId)` löscht das `TestEntry`-Dokument vollständig. **Nicht** gelöscht werden: die referenzierte Probe (keine Rückwirkung auf `samples`) und verknüpfte Berichte (kein Cascade-Delete). `ConfirmActionDialog` zeigt den Warntext „Die Prüfung wird gelöscht. Verknüpfte Berichte werden nicht automatisch entfernt." Eine „Löschen"-Aktion gab es im bisherigen `TestEntryActionsMenu` noch nicht – additiv ergänzt (gleiche Position/Stil wie bei den anderen Slices).

## 14. Emulator-Test

Gleicher Ablauf wie bei den vorherigen Slices: `firebase emulators:start --only firestore --project demo-pruefcheckpro-emulator`, `firestore.rules` (jetzt mit `companies/{companyId}/testValues`-Block) verknüpft, `NEXT_PUBLIC_DATA_SOURCE=firestore` in `.env.local`, `connectFirestoreEmulator()` in der App selbst weiterhin **nicht** verdrahtet (bewusst außerhalb des Scopes). Unter `/pruefungen` eine Prüfung öffnen/Entwurf speichern/Ergebnis speichern/Status wechseln/löschen und im Emulator-UI (`localhost:4000`) prüfen.

## 15. Seed

`scripts/seedTestValues.ts` (neu, gleiches Muster wie `scripts/seedSamples.ts`): schreibt `config/testValues.ts`-Mockdaten nach `companies/{companyId}/testValues`, ausschließlich gegen den lokalen Emulator (fest verdrahtet, keine `.env.local`-Abhängigkeit). `sampleId`-Referenzen bleiben erhalten (Dokument-ID = `sampleId`, Feld `id` wird beim Seed ebenfalls gesetzt). Idempotent ohne Flag (überspringt vorhandene Dokumente), `--force` überschreibt bewusst. Keine Secrets. Rules-Hinweis identisch zu den vorherigen Seed-Skripten (siehe `project-firestore-slice.md`, Abschnitt 11): Emulator setzt `firestore.rules` durch, für einen reinen Seed-Lauf entweder temporär permissive lokale Regeln oder ein vorbereiteter Auth-Testnutzer nötig.

## 16. Bekannte offene Punkte

- **Relationsprüfung zu Berichten:** `removeTestEntry` prüft nicht, ob die Prüfung noch von einem Bericht referenziert wird (kein Cascade-Delete, keine Sperre) – siehe `TODO(Firestore-Phase-6)`-Kommentar in `firestoreTestValueService.ts`. Eine harte Prüfung würde Änderungen am Berichte-Modul erfordern (außerhalb des Scopes).
- **Audit-Log-Anbindung:** Aktionen werden nicht in `companies/{companyId}/auditLog` protokolliert (nur die neue, Prüfung-interne `history`, siehe Abschnitt 3/7).
- **Rollen-/Claims-Prüfung:** `firestore.rules` prüft nur „angemeldet + eigene companyId" – keine rollenabhängige Einschränkung (dafür fehlen Custom Claims, siehe `docs/database/permissions.md`).
- **Keine echte Normbewertung:** wie in Abschnitt 9 beschrieben, bewusst nicht implementiert – `bewertung` bleibt ein Konfigurationswert, keine serverseitig berechnete, rechtsverbindliche Aussage.
- **`bulkUpdateTestEntries`/`duplicateTestEntry` nicht umgesetzt:** im Auftrag als optional markiert; es existiert aktuell keine Mehrfachauswahl-UI in `TestEntryTable` und keine „Prüfung duplizieren"-Aktion im bisherigen UI-Prototyp – beides hinzuzufügen wäre eine UI-Erweiterung außerhalb von „kein Redesign".
- **Kein Realtime-Sync:** `getDocs`/`getDoc` statt `onSnapshot`.
- **1:1 Probe↔Prüfung bleibt bestehen:** Die Vorbereitung auf 1:n (siehe Abschnitt 3) ändert nichts am heutigen Verhalten – `createTestEntry` lehnt eine zweite Prüfung für dieselbe `sampleId` weiterhin ab.
