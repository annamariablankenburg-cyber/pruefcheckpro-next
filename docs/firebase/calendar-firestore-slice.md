# Calendar-Firestore-Slice (Smart-Kalender)

> **Update (Rules Phase 2):** `calendarEvents` prüft serverseitig nicht mehr nur die Membership, sondern kalender.ansehen / kalender.termine_erstellen / .bearbeiten / .loeschen (Tabelle, Tenant-Isolation, Service-Abhängigkeiten und Deployment-Hinweise: `docs/firebase/role-permission-rules-phase2.md`). Der Schlüssel zum Anlegen heißt (Legacy) `kalender.termine_erstellen`. `NewCalendarTaskDialog` lädt Proben (`proben.ansehen`), das Dashboard `useCalendar()` (`kalender.ansehen`). Aussagen unten, dass „jedes aktive Mitglied alles darf“, gelten nicht mehr.

> **Update (UI Gating Phase 2):** `/kalender` ist ohne `kalender.ansehen` gesperrt (auch die Dashboard-Karten laden dann keinen Kalender); Neu/Duplizieren = `kalender.termine_erstellen`, Bearbeiten/Verschieben = `kalender.bearbeiten`, Löschen = `kalender.loeschen`; die Probenauswahl erscheint nur mit `proben.ansehen` (optional). Details: `docs/firebase/ui-permission-gating-phase2.md`.

Status: **Siebter vollständiger Vertical Slice mit echter Firestore-Anbindung.** Beschreibt, wie `/kalender` Termine liest und schreibt, wie Termine mit Proben verknüpft werden, wie das Datum/die Woche berechnet wird und welche Punkte bewusst offen sind. Analog zu `docs/firebase/report-firestore-slice.md` (sechster Slice).

---

## 1. Datenfluss

```
app/(app)/kalender/page.tsx
  → useCalendar() (src/hooks/useCalendar.ts)
    → calendarService (src/lib/services/calendarService.ts)
      ── isMockDataSource ──→ calendarRepository (In-Memory, Ableitung aus Proben)
      ── isFirestoreDataSource ──→ firestoreCalendarService (Firestore SDK)
  → NewCalendarTaskDialog → useSamples() (read-only, Proben-Verknüpfung)
  → CalendarEventDrawer / CalendarMoveDialog / CalendarDeleteDialog
```

- `useCalendar()` ist die einzige Zugriffsstelle der Kalender-UI auf Termin-Daten. Views rufen weder Repository noch Firestore-Service direkt auf.
- `calendarService` ist eine Facade (je Methode `isFirestoreDataSource`), `ICalendarService` ist Promise-basiert.
- Der Hook lädt beim Mount, Mutationen übernehmen erst nach bestätigtem Service-Ergebnis in den lokalen State (kein optimistisches Update, keine Erfolgsmeldung bei Fehlern).

## 2. Collection-Pfad

```
companies/{companyId}/calendarEvents/{eventId}
```

Über `companyCollectionPaths.calendarEvents(companyId)` und `resolveCompanyId()`. Keine globale Collection.

## 3. Datenmodell

`CalendarEvent` (`src/types/calendarEvent.ts`):

| Feld | Typ | Bemerkung |
|---|---|---|
| `id` | string | **Dokument-ID.** Wird vom `calendarEventConverter` beim Lesen gesetzt; wird nie als Datenfeld geschrieben. |
| `title` | string | Pflicht |
| `date` | string | Format `DD.MM.YYYY` (bestehendes Anzeigeformat) |
| `time` | string | `HH:MM` |
| `duration?` | string | z. B. `"60 min"`; nicht aus dem Dialog setzbar, bleibt bei Bearbeitung erhalten |
| `field` | CalendarField | Beton/Asphalt/Geotechnik/Sonstiges |
| `status` | CalendarEventStatus | Standard `geplant`; Bearbeitung behält den Status |
| `priority?` | CalendarPriority | hoch/normal/niedrig |
| `sampleId?` | string | Verknüpfung zur Probe (= Probennummer) |
| `bezeichnung?` | string | aus der Probe übernommen |
| `projectId?` | string | **additiv**, aus der Probe übernommen |
| `projekt?` | string | aus der Probe übernommen |
| `kunde?` | string | aus der Probe übernommen |
| `pruefer?` | string | aus der Probe übernommen, bei Standalone frei eingebbar |
| `description?` | string | Notizen |
| `testValueId?` | string | **additiv**, Verweis auf den Prüfwert (Dokument-ID = `sampleId`) |
| `deviceId?` | string | **additiv**, Verweis auf ein Gerät; heute nicht aus der UI setzbar |
| `createdAt?`, `updatedAt?` | ISO-String | **additiv**, serverseitig gesetzt |

Keine Breaking Changes: alle bisherigen Felder und Optionalitäten sind unverändert.

## 4. Beziehungen

- **Probe (`sampleId`):** Wird im Dialog über die echte Probenliste (`useSamples`, nicht archivierte Proben) gewählt. Dann werden `bezeichnung`, `projectId`, `projekt`, `kunde`, `pruefer` und `field` (= Fachbereich der Probe) aus der Probe **abgeleitet** und im Formular schreibgeschützt angezeigt. Freitext-Widersprüche sind so nicht möglich.
- **Standalone-Termin:** Ohne Probe bleibt alles frei bzw. über den Fachbereich-Schalter wählbar; `pruefer` ist eingebbar. Das ist ausdrücklich erlaubt.
- **Projekt ohne Probe:** Nicht implementiert (kein sauber vorhandener Projektauswahl-Baustein im Dialog; kein Scope-Ausbau erzwungen). Projektbezug entsteht nur über eine Probe.
- **Prüfwert (`testValueId`):** Wird aus dem Mock-Bestand (`config/calendarEvents.ts`) gesetzt, wo der Prüfwert 1:1 über die `sampleId` existiert. Beim Verknüpfen einer anderen Probe im Dialog wird der Verweis gelöscht.
- **Gerät (`deviceId`):** Proben modellieren heute kein Gerät. Das Feld existiert im Modell, wird aber nicht befüllt und bei Bearbeitung unverändert übernommen.
- **Verknüpfte Probe/Prüfung:** Die Drawer-Aktionen navigieren nur dorthin (siehe Abschnitt 8).

## 5. Mock- vs. Firestore-Verhalten

Eine Entscheidung, keine zwei Quellen:

- **Mock (`NEXT_PUBLIC_DATA_SOURCE` = `mock` oder nicht gesetzt):** Das bestehende Verhalten bleibt erhalten. `config/calendarEvents.ts` erzeugt eigenständige Termine und zusätzlich Termine aus `config/samples.ts`. Die Woche bleibt auf dem Demo-Datum (`HEUTE` = `03.03.2026`).
- **Firestore:** Termine stammen **ausschließlich** aus `companies/{companyId}/calendarEvents`. Es findet keine clientseitige Ableitung aus `samples` statt.
- **Übergang:** Der Seed (Abschnitt 11) übernimmt die heute aus den Mock-Proben abgeleiteten Termine einmalig als echte Dokumente. Danach gibt es nur noch eine Quelle.

`src/config/calendarEvents.ts` bleibt die Mock-Quelle von `calendarRepository` (und damit von `useCalendar()` im Mock-Modus). Kalenderseite und Dashboard lesen Termine ausschließlich über `useCalendar()`; keine Komponente importiert mehr Termine oder Demo-Daten direkt aus der Config (siehe Abschnitt 5.1).

### 5.1 Kalenderbezogene Dashboard-Anzeigen

`src/app/(app)/dashboard/page.tsx` bezieht alle kalenderabhängigen Werte über `useCalendar()`, also aus derselben Terminquelle wie `/kalender`:

- Stat-Karten „Überfällige Aufgaben" und „Geplante Prüfungen"
- Listen „Heutige Prüfungen" und „Überfällige Prüfungen"
- Wochenvorschau (`CalendarPreviewCard`), `weekOverview` und `completedThisWeek` (Laborstatus)

Die Werte werden in `buildCalendarDashboardData(events, referenceDate)` abgeleitet, mit `buildWeekDays` aus `calendarDates.ts`. Die Woche folgt dem Bezugsdatum, nicht einer festen Demo-Woche.

- **Laden bzw. kein Bezugsdatum:** Die Stat-Karten zeigen `—`, die kalenderabhängigen Karten einen Lade-Platzhalter. Es erscheinen keine falschen Nullen oder „Keine Aufgaben“-Meldungen.
- **Fehler:** Die Karten zeigen „Kalenderdaten konnten nicht geladen werden.“ mit „Erneut versuchen“ (`refreshCalendarEvents`).
- **Mock-Modus:** Derselbe Bezugsdatum-Wert (`03.03.2026`) und dieselbe Woche wie bisher, daher bleiben die Demo-Werte unverändert.
- **Firestore-Modus:** Nur echte Termine aus `calendarEvents`. Es gibt keine zweite Quelle.

Nicht kalenderbezogen und bewusst unverändert: Proben, Projekte, AI-Karten, Schnellaktionen und die Auslastung. Das Dashboard hat keine eigene Datenquelle neben `useCalendar()` für Termine. Die Konstante `weekDates` in `config/calendarEvents.ts` wird seither von niemandem mehr gelesen. `HEUTE` und `weekDayLabels` werden weiterhin verwendet.

## 6. Datum- und Wochenlogik

Lokale, reine Funktionen in `src/lib/calendar/calendarDates.ts`:

- `formatDateDE` / `parseDateDE`: Umwandlung zwischen `Date` und `DD.MM.YYYY`.
- `dateDEToIsoInput` / `isoInputToDateDE`: Umwandlung für `<input type="date">` (`YYYY-MM-DD`).
- `getWeekDates(anchor)`: Woche beginnt **am Montag**, liefert 7 lokale Tage.
- `buildWeekDays(anchor, labels)`: Tagesdaten inkl. Monatsname (kein fest verdrahtetes „März" mehr) und `isToday`.
- `formatRangeLabel(days)`: Wochenbereich als Text; funktioniert über Monats- und Jahresgrenzen (z. B. „29. Dezember 2025 – 4. Januar 2026").
- `sortCalendarEvents`: sortiert nach Datum und Uhrzeit.

**Bezugsdatum (`useCalendar().referenceDate`):**
- Firestore: das echte lokale Datum. Es wird **erst nach dem Mount** gesetzt; bis dahin zeigt die Seite einen Lade-Platzhalter. Dadurch wird das Build-Datum der statisch prerenderten Seite nicht hydratisiert.
- Mock: das feste Demo-Datum `HEUTE`, damit die Mockdaten wie bisher sichtbar bleiben.

Die Kalenderansicht zeigt immer die Woche des Bezugsdatums. „Heute" setzt die Ansicht auf die Wochenansicht zurück.

Geprüft (isoliert, siehe Abschnitt 12): Montagsstart, Monats- und Jahreswechsel sowie die „Heute"-Markierung.

## 7. CRUD

| Aktion | Hook | Service (Firestore) | Lokaler State |
|---|---|---|---|
| Liste laden | `refreshCalendarEvents()` | `getDocs(...)` | ersetzt |
| Anlegen | `createEvent(input)` | `addDoc(...)`, `createdAt`/`updatedAt` gesetzt | nach Erfolg eingefügt |
| Bearbeiten | `updateEvent(id, changes)` | `updateDoc(...)` + `getDoc(...)` | nach Erfolg ersetzt |
| Verschieben | `updateEvent(id, { date, time })` | wie Bearbeiten | nach Erfolg ersetzt |
| Duplizieren | `duplicateEvent(event)` | `addDoc(...)` mit neuer Dokument-ID | nach Erfolg eingefügt |
| Löschen | `removeEvent(id)` | `deleteDoc(...)` | nach Erfolg entfernt |

**Duplizieren:** Die alte `id` und `createdAt`/`updatedAt` werden verworfen. Der Titel erhält „(Kopie)", der Status startet bei `geplant`.

**Bearbeiten/Verschieben und entfernte Felder:** Ein Feld mit dem Wert `undefined` bedeutet bei einem Update **„Feld entfernen"** (z. B. Probe-Verknüpfung lösen). Das ist wichtig, weil `sanitizeForFirestore()` `undefined` nur verwirft und ein Update den alten Wert sonst stehen ließe. Der Firestore-Service setzt solche Felder deshalb auf `deleteField()`. Beim Anlegen werden `undefined`-Felder einfach weggelassen.

**Fehlerverhalten:** Jede Mutation wirft bei Fehlern. Der Hook übernimmt nichts lokal, der Dialog bleibt offen und zeigt „Termin konnte nicht gespeichert werden.", die Seite zeigt keine Erfolgsmeldung.

## 8. Navigation

- **„Probe öffnen"** → `/probekoerper`. Die Probenseite liest heute **keinen** `sampleId`-Parameter, daher wird kein Deep-Link erfunden (siehe Abschnitt 13).
- **„Prüfwerte eintragen"** → `/pruefungen?sampleId=<sampleId>`. Diese Route unterstützt den Parameter bereits; sie legt die Prüfung bei Bedarf an.

## 9. Löschen – kein Cascade

`removeEvent` löscht ausschließlich das `calendarEvents`-Dokument. **Nicht** verändert werden: die verknüpfte Probe, der Prüfwert (`testValueId`) und das Gerät (`deviceId`). Der Löschdialog weist darauf hin. Ein Cascade ist bewusst nicht implementiert (siehe `TODO`-Hinweis in `firestoreCalendarService.ts`, sinngemäß wie beim Berichte-Slice).

## 10. AutoSchedulePreview

`src/components/shared/AutoSchedulePreview.tsx` enthält **statische Demo-Daten** (feste Datumsangaben 08.07.2026 ff.). Es gibt keine Planungslogik. Die Komponente bleibt bewusst eine **Vorschau** mit dem Hinweis „Noch keine echte Logik". Es wird keine Scheduling-Engine erfunden. Eine Ableitung aus echten Kalenderdaten ist ein offener Punkt (Abschnitt 13).

## 11. Firestore-Schreibsicherheit

- Gemeinsame Helfer aus `src/lib/firebase/firestoreSanitize.ts`: `sanitizeForFirestore` (entfernt `undefined`, lässt `false`/`0`/`""`/`null`/`[]` stehen) und `withoutIdField` (verhindert `id` als Datenfeld).
- `sampleId`, `projectId`, `testValueId` und `deviceId` werden **nicht** entfernt. Nur `id` wird entfernt.
- Der Converter `calendarEventConverter` (`createIdConverter`) setzt die `id` beim Lesen aus der Dokument-ID.

## 12. Verifikation

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: grün.
- Datumslogik isoliert geprüft (Montagsstart, Monats-/Jahreswechsel, Heute-Markierung, DD.MM.YYYY-Umwandlung).
- Schreiblogik isoliert geprüft: `undefined` → `deleteField()` bei Updates, `id` entfernt, `sampleId`/`projectId` erhalten, `""`/`false`/`0`/`null` erhalten, `undefined` aus Arrays entfernt.
- **Nicht durchgeführt:** Ausführung gegen den Firestore-Emulator und Test der Oberfläche im Browser. `/kalender` liegt hinter der Firebase-Anmeldung; eine Anmeldung war nicht möglich.

## 13. Seed

`scripts/seedCalendarEvents.ts` (gleiches Muster wie `seedReports.ts`):

- Schreibt die Liste aus `config/calendarEvents.ts` (eigenständige Termine + aus den Mock-Proben abgeleitete Termine) nach `companies/{companyId}/calendarEvents`.
- Dokument-ID = bestehende Termin-ID (`cal-01`, `cal-BET-2026-014`, …), `id` wird nicht als Feld geschrieben.
- Emulator-only (`localhost:8080`, Platzhalter-Projekt), keine Secrets, keine `.env.local`-Abhängigkeit.
- Idempotent: vorhandene Dokumente werden übersprungen; `--force` überschreibt.
- Nutzt `sanitizeForFirestore()`.

Ausführen (Emulator vorher starten): `npx tsx scripts/seedCalendarEvents.ts` – `--force` überschreibt bereits vorhandene Termine.

**Hinweis:** Die Seed-Termine liegen im März 2026. Die Woche folgt dem echten Datum, daher sieht man sie im Firestore-Modus nur, wenn das Systemdatum in dieser Woche liegt. Ein Wochenwechsel fehlt (siehe Abschnitt 14).

## 14. Offene Punkte

- **Keine Wochennavigation.** `CalendarToolbar` unterstützte Wochenwechsel vorher nicht; er wurde nicht ergänzt. Die Ansicht zeigt nur die aktuelle Woche.
- **Monatsansicht** bleibt „in Vorbereitung".
- **Probe-Deep-Link:** `/probekoerper` liest keinen `sampleId`-Parameter; „Probe öffnen" landet auf der Übersicht.
- **Projekt ohne Probe:** nicht umgesetzt (siehe Abschnitt 4).
- **`deviceId`** ist modelliert, aber nicht setzbar.
- **`testValueId` bei neu verknüpfter Probe** wird nicht gesetzt, weil nicht geprüft wird, ob ein Prüfwert existiert.
- **AutoSchedulePreview** ist eine statische Vorschau (Abschnitt 10).
- **Keine Rollen-/Claims-Prüfung:** `firestore.rules` prüft nur „angemeldet + eigene companyId" (wie bei den anderen Slices).
- **Kein Realtime-Sync:** `getDocs`/`getDoc` statt `onSnapshot`.
- **Kein Audit-Log** für Kalenderaktionen.
- **Kein Cascade-Delete** (Abschnitt 9) – bewusst.
- **Emulator- und Browser-Test ausstehend** (Abschnitt 12).
