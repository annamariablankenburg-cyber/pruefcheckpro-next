# Report-Firestore-Slice (Berichte & Exporte)

> **Update (Rules Phase 2):** `reports` prüft serverseitig nicht mehr nur die Membership, sondern berichte.ansehen / .erstellen / .bearbeiten / .loeschen (Tabelle, Tenant-Isolation, Service-Abhängigkeiten und Deployment-Hinweise: `docs/firebase/role-permission-rules-phase2.md`). Der Wechsel in „PDF exportiert“/„Excel exportiert“ braucht zusätzlich `pdf.exportieren`; `berichte.loeschen` ist ein Admin-only-Löschrecht. Aussagen unten, dass „jedes aktive Mitglied alles darf“, gelten nicht mehr.

> **Update (UI Gating Phase 2):** `/pdf-export` ist ohne `berichte.ansehen` gesperrt; Export (PDF/Excel) nur mit `berichte.bearbeiten` + `pdf.exportieren`, Duplizieren = `berichte.erstellen`, Löschen = `berichte.loeschen`; Neuer Bericht braucht zusätzlich `proben.ansehen`. Details: `docs/firebase/ui-permission-gating-phase2.md`.

Status: **Sechster vollständiger Vertical Slice mit echter Firestore-Anbindung (Firestore Phase 6).** Beschreibt, wie `/pdf-export` heute Daten liest und schreibt, wie Berichte aus Proben abgeleitet werden, und welche Punkte bewusst noch offen sind. Analog zu `docs/firebase/customer-firestore-slice.md`, `docs/firebase/project-firestore-slice.md`, `docs/firebase/device-firestore-slice.md`, `docs/firebase/sample-firestore-slice.md` und `docs/firebase/test-values-firestore-slice.md` (erster bis fünfter Slice).

---

## 1. Datenfluss

```
app/(app)/pdf-export/page.tsx
  → ReportsView (src/components/shared/ReportsView.tsx)
    → useReports() (src/hooks/useReports.ts)
      → reportService (src/lib/services/reportService.ts)
        ── isMockDataSource ──→ reportRepository (src/lib/repositories/reportRepository.ts, In-Memory)
        ── isFirestoreDataSource ──→ firestoreReportService (Firestore SDK)
```

- `useReports` ist die **einzige** Zugriffsstelle für die Berichte-UI. `ReportsView`, `ReportTable`, `ReportEditorDrawer`, `NewReportDialog`, `SendReportEmailDialog` kennen weder `reportRepository` noch `firestoreReportService` direkt.
- `reportService` ist eine Facade: branch je Methode anhand von `isFirestoreDataSource` (`src/config/dataSource.ts`, unverändert). Beide Implementierungen erfüllen dasselbe `IReportService`-Interface (jetzt Promise-basiert statt des synchronen Basis-Interfaces aus `src/lib/interfaces/base.ts`).
- Der Hook lädt einmalig beim Mount über `refreshReports()`. Mutationen laufen über den Service und aktualisieren den lokalen State mit dem vom Service zurückgegebenen Ergebnis (nie optimistisch vor dem Await).
- **`pruefungen/page.tsx` hing vorher direkt an `reportRepository`** (`handleCreateReport` prüfte per `reportRepository.getAll().some(...)`, ob für eine Probe schon ein Bericht existiert). Das wurde entfernt – die Seite nutzt jetzt `useReports().reports` (read-only) und funktioniert dadurch unabhängig vom aktiven `NEXT_PUBLIC_DATA_SOURCE`.
- **Nur der Berichte-Slice wurde async gemacht** – `src/lib/interfaces/base.ts` bleibt unverändert, keine Mass-Migration anderer Domänen.

## 2. Collection-Pfad

```
companies/{companyId}/reports/{reportId}
```

Kein globales `/reports`. Pfad über `companyCollectionPaths.reports(companyId)` (bereits vorhanden). `companyId` ausschließlich über die bestehende `resolveCompanyId()` (`src/lib/firebase/companyContext.ts`, unverändert).

## 3. Dokumentstruktur

`Report.id` ist ein normaler, vom Service generierter Primärschlüssel – **keine Doppelrolle** wie `TestEntry.sampleId` (siehe `docs/firebase/test-values-firestore-slice.md`, Abschnitt 3). Im Mock-Modus erzeugt `generateMockReportId()` eine lokale ID, im Firestore-Modus übernimmt `addDoc()` die automatisch generierte Dokument-ID – `IReportService.createReport` nimmt dafür bewusst ein `NewReportInput = Omit<Report, "id">` an, damit nie eine vom Aufrufer erfundene ID in die Collection geschrieben werden kann.

`reportConverter = createIdConverter<Report, "id">("id")` (gleiches Muster wie bei Customer/Project/Device/Sample) mappt Dokument-ID ↔ `id` für Lesezugriffe. Für Schreibzugriffe (`updateDoc`) wird bewusst kein Converter verwendet (siehe Kommentar in `firestoreReportService.ts`) – `createReport`/`updateReport` entfernen ein etwaiges `id`-Feld stattdessen explizit selbst (siehe Abschnitt 4).

Alle bestehenden Felder bleiben erhalten und werden verlustfrei behandelt: `titel`, `berichtsnummer`, `berichtstyp`, `format`, `projekt`, `projectId?`, `kunde`, `customerId?`, `standort?`, `probeId?`, `fachbereich`, `pruefer`, `bearbeiter`, `ansprechpartner?`, `vorlage?`, `sprache?`, `erstelltAm`, `status`, `pruefungen`, `fotos`, `dokumente`, `lieferscheine`, `bemerkungen`, `unterschriften`, `historie`, `emailStatus`, `emailSentTo?`, `emailSentAt?`, `emailSentBy?`, `emailSubject?`, `emailAttachmentCount?`, `emailHistory`.

Neu ergänzt (additiv, nur bei Firestore-Datensätzen gesetzt): `createdAt?`, `updatedAt?` (ISO-Strings, serverseitig in `firestoreReportService.ts` gesetzt). Mock-Daten führen diese Felder nicht – rein additiv, bricht bestehende UI nicht.

## 4. Firestore-Write-Sanitization (Pre-Commit-Review-Fix)

Zwei Probleme in der Write-Pipeline wurden nach einem Review behoben, bevor dieser Slice committet wurde – beide Fixes leben in `src/lib/firebase/firestoreSanitize.ts` (bewusst ohne Firebase-App-Import, keine Seiteneffekte) und werden von `firestoreReportService.ts` **und** `scripts/seedReports.ts` genutzt:

- **`undefined`-Werte:** `NewReportDialog` setzt optionale Felder bewusst explizit auf `undefined` statt leerem String (`ansprechpartner: form.ansprechpartner || undefined`, ebenso `vorlage`). `ReportsView.handleDuplicate` und die Mock-Seed-Daten (`config/reports.ts`, `emailOverrides`) tun dasselbe für `emailSentTo`/`emailSentAt`/`emailSentBy`/`emailSubject`/`emailAttachmentCount` sowie verschachtelt für `ReportEmailHistoryEntry.cc`/`.bcc`. Firestore lehnt `undefined`-Feldwerte bei `addDoc()`/`updateDoc()`/`setDoc()` ab. `sanitizeForFirestore()` entfernt diese rekursiv (inkl. verschachtelter Arrays/Objekte wie `emailHistory[]`), lässt aber `false`/`0`/`""`/`[]`/`null` unverändert – das sind gültige, bewusst gesetzte Werte, kein Lösch-Signal.
- **`id` als Datenfeld:** `updateReport(id, changes)` bekommt an mehreren Call-Sites (`ReportsView.handleConfirmAction`: `{ ...subject, status: nextStatus }`) einen vollständigen `Report` inkl. `id` übergeben. Ohne Gegenmaßnahme würde `id` zusätzlich als normales Feld im Dokument landen – obwohl `Report.id` ausschließlich die Firestore-Dokument-ID ist (vom `reportConverter` beim Lesen injiziert). `withoutIdField()` entfernt ein etwaiges `id`-Feld jetzt zuverlässig in `createReport` **und** `updateReport`, unabhängig davon, was der Aufrufer übergibt. Die Dokument-ID selbst (`reportId`-Parameter) bleibt davon unberührt. `probeId`/`projectId`/`customerId` sind davon nicht betroffen – das sind normale Relationsfelder (siehe Abschnitt 3), keine IDs, und werden nie herausgefiltert.
- **Seed-Skript:** `scripts/seedReports.ts` entfernte `id` schon vorher per Destrukturierung (unverändert) – ergänzt wurde dieselbe `sanitizeForFirestore()`-Semantik, da `config/reports.ts` für Berichte ohne E-Mail-Verlauf ebenfalls `undefined`-Werte erzeugt (s. o.) und `setDoc()` sonst fehlschlagen würde.

## 5. Beziehungen – probeId/projectId/customerId

- Jeder Bericht gehört zu einer bestehenden Probe (`probeId`). `projectId`/`customerId` sowie die Anzeige-Snapshots `projekt`/`kunde`/`standort`/`fachbereich`/`pruefungen` werden **aus der Probe übernommen**, nicht frei vom Nutzer eingegeben – read-only Zugriff über `useSamples()`/`activeSamples` (nicht archivierte Proben). Keine Änderung am Sample-Slice.
- **`NewReportDialog`:** zeigt eine Probenauswahl (`<Select>` über `activeSamples`, mit eigenem Loading-/Error-/Retry-Zustand analog zu `NewTestEntryDialog`) statt freier Text-Eingabefelder für Projekt/Kunde. Beim Anlegen werden `projekt`, `projectId`, `kunde`, `customerId`, `standort`, `probeId`, `fachbereich`, `pruefer`, `bearbeiter`, `pruefungen` direkt aus der gewählten Probe abgeleitet – es entstehen keine widersprüchlichen IDs/Namen. `berichtsnummer` wird clientseitig generiert (`generateBerichtsnummer()`), `status` startet immer bei `"Entwurf"`, `emailStatus` bei `"Noch nicht versendet"`, `emailHistory` leer.
- **`ReportEditorDrawer`:** `titel`, `probeId`, `projekt`, `kunde`, `projectId`, `customerId` sind dort **nicht editierbar** (nur Format/Berichtstyp/Ansprechpartner/Bemerkungen/Prüfungsauswahl/Unterschriften) – das war schon im bisherigen UI-Prototyp so. `NewReportDialog` deckt daher ausschließlich das Anlegen ab, nie das Bearbeiten der Beziehung.
- **Verbindung von `/pruefungen` aus:** „Bericht erstellen" in `pruefungen/page.tsx` prüft über `useReports().reports` (statt vorher `reportRepository.getAll()`), ob für die `sampleId` der Prüfung bereits ein Bericht existiert (`report.probeId === entry.sampleId`). Existiert einer, wird zu `/pdf-export` navigiert; sonst zeigt ein `FeedbackToast`, dass die automatische Berichtserstellung ab einer Prüfung später angebunden wird (unverändertes Verhalten, nur die Datenquelle wurde ausgetauscht).

## 6. Mock-/Firestore-Umschaltung

Gesteuert über `NEXT_PUBLIC_DATA_SOURCE`, identisch zu den vorherigen Slices. `mock` → `reportRepository` (In-Memory, `src/lib/repositories/reportRepository.ts`, Seed-Daten aus `src/config/reports.ts`). `firestore` → `firestoreReportService`. Fehlt/ungültig → `mock`.

## 7. CRUD

| Aktion | Hook | Service (Firestore) |
|---|---|---|
| Liste laden | `refreshReports()` | `getDocs(...)` |
| Anlegen | `createReport(input: NewReportInput)` | `addDoc(...)`, liefert die neu generierte Dokument-ID zurück |
| Bearbeiten | `updateReport(id, changes)` | `updateDoc(...)` + `getDoc(...)` für den frischen Stand |
| Archivieren | `archiveReport(id)` | delegiert an `updateReport(id, { status: "Archiviert" })` |
| Reaktivieren | `restoreReport(id)` | delegiert an `updateReport(id, { status: "Fertig" })` |
| Löschen | `removeReport(id)` | `deleteDoc(...)` (siehe Abschnitt 9) |

`ReportsView` nutzt für alle Statuswechsel (Entwurf speichern, als fertig markieren, PDF/Excel-Export markieren, archivieren, reaktivieren) einheitlich `updateReport(id, { ...aktuellerBearbeitungsstand, status: neuerStatus })` über einen gemeinsamen `ConfirmActionDialog`-Mechanismus – der volle Bearbeitungsstand (`buildSnapshot()` aus dem offenen `ReportEditorDrawer`) wird mitgeschickt, damit zuvor im Drawer vorgenommene, noch ungespeicherte Änderungen nicht verloren gehen, wenn direkt eine Statusaktion ausgelöst wird. Der dabei mitgeschickte `id`-Wert aus `subject` wird von `updateReport` serverseitig verworfen (siehe Abschnitt 4).

## 8. Ehrliches Erfolgs-/Fehler-Feedback

Alle Mutationen in `ReportsView.tsx` (Statuswechsel, Duplizieren, Löschen, E-Mail-Entwurf speichern, E-Mail "senden") sind `async`/`await`-basiert mit `try/catch`: Ein Erfolgs-Toast (`FeedbackToast`) wird **ausschließlich** angezeigt, wenn der awaited Service-Aufruf tatsächlich ein definiertes Ergebnis zurückgibt; bei `undefined`/Exception erscheint stattdessen eine Fehlermeldung, und der lokale State bleibt unverändert. Dasselbe gilt für `ReportEditorDrawer`s eigenen „Speichern"-Button (`handleSave`, awaited `onSave`, zeigt „Änderungen gespeichert." nur bei Erfolg) und für `NewReportDialog` (Fehlermeldung statt Dialog-Schluss bei fehlgeschlagenem `createReport`). `actionPending`/`deletePending`/`isSaving`/`isSubmitting`/`isDuplicating`-Guards verhindern doppelt ausgelöste Aktionen während ein Request läuft (`ConfirmActionDialog`s `isLoading`-Prop deaktiviert währenddessen die Buttons und das Wegklicken).

## 9. Löschen – keine Relationsprüfung

`removeReport(id)` löscht das `Report`-Dokument vollständig. **Nicht** geprüft oder verändert wird: die referenzierte Probe (`probeId`, kein Cascade in die andere Richtung) oder andere Module, die künftig auf einen Bericht verweisen könnten. Kein Cascade-Delete, keine Sperre bei bestehenden Referenzen – siehe `TODO(Firestore-Phase-7)`-Kommentar in `firestoreReportService.ts`. `ConfirmActionDialog` zeigt den Warntext, dass der Bericht dauerhaft entfernt wird.

## 10. Export (PDF/Excel) und E-Mail-Versand – bewusst nur Platzhalter

Dieser Slice deckt ausschließlich Berichts-**Metadaten**/CRUD ab:

- **Kein echter PDF-/Excel-Export:** „PDF exportieren"/„Excel exportieren" (`ExportOptionsPanel`, `ExcelPreviewPanel`, Statuswerte `"PDF exportiert"`/`"Excel exportiert"`) setzen weiterhin nur den `status`-Feld des Berichts – es wird keine echte Datei erzeugt und keine Cloud-Storage-Anbindung eingeführt. Die Vorschau (`ReportPreview`) bleibt eine reine UI-Darstellung.
- **Kein echter E-Mail-Versand:** `SendReportEmailDialog`/`EmailComposeWorkspace` simulieren weiterhin nur lokal. „Als Entwurf speichern" und „E-Mail senden" (nach Bestätigung im eigenen `ConfirmActionDialog`) persistieren lediglich `emailStatus`/`emailSentTo`/`emailSentAt`/`emailSentBy`/`emailSubject`/`emailAttachmentCount`/`emailHistory` am Bericht – es wird keine echte E-Mail verschickt. „Test-E-Mail senden" zeigt unverändert nur einen Hinweis, dass der Versand später über eine sichere Server-Funktion angebunden wird.
- Diese Platzhalter sind vom Auftrag ausdrücklich als Non-Goal für diesen Slice markiert und bleiben unverändert bestehen.

## 11. Loading/Error/Empty

- **Loading:** `useReports().loading` – Skeleton-Platzhalter für die 6 KPI-Kacheln und die Tabelle (identisches Muster zu den vorherigen Slices).
- **Error:** Text „Berichte konnten nicht geladen werden.", Button „Erneut versuchen" (`refreshReports()`).
- **Empty State:** bestehender `EmptyState` (via `ReportTable`, unverändert).

## 12. Emulator-Test

Gleicher Ablauf wie bei den vorherigen Slices: `firebase emulators:start --only firestore --project demo-pruefcheckpro-emulator`, `firestore.rules` (jetzt mit `companies/{companyId}/reports`-Block) verknüpft, `NEXT_PUBLIC_DATA_SOURCE=firestore` in `.env.local`, `connectFirestoreEmulator()` in der App selbst weiterhin **nicht** verdrahtet (bewusst außerhalb des Scopes). Unter `/pdf-export` einen Bericht anlegen/bearbeiten/archivieren/reaktivieren/duplizieren/löschen und im Emulator-UI (`localhost:4000`) prüfen.

## 13. Seed

`scripts/seedReports.ts` (neu, gleiches Muster wie `scripts/seedSamples.ts`): schreibt die vollständig abgeleiteten `config/reports.ts`-Mockdaten (inkl. `pruefungen`/`fachbereich`/`standort` aus der jeweiligen Probe sowie Beispiel-E-Mail-Verlauf) nach `companies/{companyId}/reports`, ausschließlich gegen den lokalen Emulator (fest verdrahtet, keine `.env.local`-Abhängigkeit). `probeId`/`projectId`/`customerId` bleiben als normale Felder erhalten (nur die Dokument-ID `id` wird beim Schreiben herausgerechnet, analog zu `seedSamples.ts` – kein Query-Feld, siehe Abschnitt 3). Nutzt dieselbe `sanitizeForFirestore()`-Hilfsfunktion wie `firestoreReportService.ts` (siehe Abschnitt 4), da die Mock-Seeds ebenfalls `undefined`-Werte enthalten können. Idempotent ohne Flag (überspringt vorhandene Dokumente), `--force` überschreibt bewusst. Keine Secrets. Rules-Hinweis identisch zu den vorherigen Seed-Skripten: Emulator setzt `firestore.rules` durch, für einen reinen Seed-Lauf entweder temporär permissive lokale Regeln oder ein vorbereiteter Auth-Testnutzer nötig.

## 14. Bekannte offene Punkte

- **Kein echter Export/Versand:** wie in Abschnitt 10 beschrieben, bewusst nicht implementiert.
- **Keine Relationsprüfung beim Löschen:** wie in Abschnitt 9 beschrieben – kein Cascade-Delete, keine Sperre.
- **Audit-Log-Anbindung:** Aktionen werden nicht in `companies/{companyId}/auditLog` protokolliert (nur die bestehende, berichtsinterne `historie`).
- **Rollen-/Claims-Prüfung:** `firestore.rules` prüft nur „angemeldet + eigene companyId" – keine rollenabhängige Einschränkung (dafür fehlen Custom Claims, siehe `docs/database/permissions.md`).
- **Kein Realtime-Sync:** `getDocs`/`getDoc` statt `onSnapshot`.
- **Keine Mehrfachauswahl/Bulk-Aktionen:** es existiert keine Mehrfachauswahl-UI in `ReportTable` – nicht Teil dieses Slices.
