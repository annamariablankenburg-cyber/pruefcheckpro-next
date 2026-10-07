# Laborbook-Firestore-Slice (Laborbuch)

> **Update (Rules Phase 2):** `laborbook` prüft serverseitig nicht mehr nur die Membership, sondern laborbuch.ansehen / .erstellen / .bearbeiten / .loeschen (Tabelle, Tenant-Isolation, Service-Abhängigkeiten und Deployment-Hinweise: `docs/firebase/role-permission-rules-phase2.md`). Archivieren/Wiederherstellen laufen in einer Transaktion mit `transaction.get` (braucht zusätzlich `laborbuch.ansehen`); `laborbuch.loeschen` ist ein Admin-only-Löschrecht. `NewLaborbookEntryDialog` lädt Proben, Projekte, Kunden und Geräte. Aussagen unten, dass „jedes aktive Mitglied alles darf“, gelten nicht mehr.

> **Update (UI Gating Phase 2):** `/laborbuch` ist ohne `laborbuch.ansehen` gesperrt; Bearbeiten/Archivieren nur mit `laborbuch.bearbeiten` **und** `laborbuch.ansehen` (Transaktion mit `transaction.get`); Proben/Projekte/Kunden/Geräte werden nur mit ihrem Leserecht geladen (optional). Details: `docs/firebase/ui-permission-gating-phase2.md`.

Status: **Achter vollständiger Vertical Slice mit echter Firestore-Anbindung.** Beschreibt, wie `/laborbuch` Einträge liest und schreibt, welche Verknüpfungen gelten, wie Updates und Löschungen Felder behandeln, und welche Punkte bewusst offen sind. Analog zu `docs/firebase/calendar-firestore-slice.md`.

---

## 1. Datenfluss

```
app/(app)/laborbuch/page.tsx
  → useLaborbook() (src/hooks/useLaborbook.ts)
    → laborbookService (src/lib/services/laborbookService.ts)
      ── isMockDataSource ──→ laborbookRepository (In-Memory, config/laborbook.ts)
      ── isFirestoreDataSource ──→ firestoreLaborbookService (Firestore SDK)
  → NewLaborbookEntryDialog → useSamples() / useProjects() / useCustomers() / useDevices()
  → LaborbookDetailDrawer, LaborbookTable, LaborbookTimeline
```

- `useLaborbook()` ist die einzige Zugriffsstelle der Laborbuch-Seite auf Einträge. Die Seite, Tabelle, Timeline und der Drawer kennen weder Repository noch Firestore-Service.
- `laborbookService` ist eine Facade (je Methode `isFirestoreDataSource`). `ILaborbookService` ist Promise-basiert.
- Der lokale State wird erst nach einem bestätigten Service-Ergebnis geändert. Es gibt keine optimistischen Updates.

## 2. Collection-Pfad

```
companies/{companyId}/laborbook/{entryId}
```

Über `companyCollectionPaths.laborbook(companyId)` (bereits vorhanden) und `resolveCompanyId()`.

**Dokument-ID = `LaborbookEntry.id`.** `id` wird nie als Datenfeld geschrieben (`withoutIdField` in `firestoreSanitize.ts`). Der Converter `laborbookConverter` (`createIdConverter`, bereits vorhanden) setzt die `id` beim Lesen aus der Dokument-ID. Ein eigener `laborbookEntryConverter` war nicht nötig.

## 3. Datenmodell

| Feld | Typ | Bemerkung |
|---|---|---|
| `id` | string | Dokument-ID, nie als Feld geschrieben |
| `datum` | string | `DD.MM.YYYY` (bestehendes Anzeigeformat) |
| `uhrzeit` | string | `HH:MM` |
| `typ` | LaborbookType | Prüfung, Gerät, Kalibrierung, Wartung, Notiz, Ereignis |
| `fachbereich?` | LaborbookField | Beton/Asphalt/Geotechnik; bei Probe aus der Probe |
| `titel` | string | Kurzbezeichnung; Standard: die ersten 60 Zeichen der Beschreibung |
| `beschreibung` | string | Pflicht |
| `projekt?` | string | Anzeigetext, aus dem gewählten Projekt bzw. der Probe |
| `projectId?` | string | Verknüpfung zu `projects` |
| `kunde?` | string | Anzeigetext, aus Kunde bzw. Probe/Projekt |
| `customerId?` | string | Verknüpfung zu `customers` |
| `probeId?` | string | Verknüpfung zu `samples` (Probennummer) |
| `geraet?` | string | Anzeigetext `Name (Inventarnummer)` |
| `deviceId?` | string | Verknüpfung zu `devices` |
| `mitarbeiter` | string | Pflicht, Freitext |
| `status` | LaborbookStatus | Aktiv oder Archiviert |
| `fotos`, `dokumente` | RecordListItem[] | **nur Metadaten** (siehe Abschnitt 9) |
| `historie` | LaborbookHistoryEntry[] | Verlauf, siehe Abschnitt 7 |
| `createdAt?`, `updatedAt?` | ISO-String | **additiv**, serverseitig gesetzt |

Keine Breaking Changes: alle bisherigen Felder und Optionalitäten sind unverändert.

## 4. Relationen

Der Dialog wählt Verknüpfungen aus **echten Datensätzen** statt Freitext. Die Anzeigetexte entstehen aus demselben Objekt wie die ID, daher sind IDs und Texte nie widersprüchlich.

- **Probe gewählt** → `probeId`, `fachbereich`, `projectId`, `projekt`, `customerId`, `kunde` werden aus der Probe übernommen. Diese Felder sind dann schreibgeschützt; Projekt und Kunde werden nicht separat gewählt.
- **Ohne Probe:** Projekt wird aus `projects` gewählt (`projectId` + `projekt` = Projektname). Hat das Projekt einen Kunden (`customerId`), wird der Kunde daraus übernommen und ist schreibgeschützt. Sonst wird der Kunde aus `customers` gewählt. Projekt und Kunde ohne Probe sind ausdrücklich erlaubt.
- **Gerät** wird aus `devices` gewählt; `geraet` = `Name (Inventarnummer)`, `deviceId` = Geräte-ID.
- Archivierte Datensätze bleiben wählbar, wenn ein Eintrag bereits darauf verweist. Unbekannte IDs werden als „(nicht verfügbar)“ angezeigt und blockieren das Speichern.

**Altdaten ohne ID:** Ein Eintrag, der nur Freitext (z. B. `projekt`) ohne `projectId` hat, wird im Dialog als „Bisheriger Eintrag: …“ angezeigt. Speichert man ohne Umstellung, bleibt der Text erhalten. Nur eine bewusste Auswahl ersetzt ihn oder „Keine Angabe“ entfernt ihn. Die Mockdaten haben keine solchen Fälle; der Fall wird defensiv behandelt.

Solange Verknüpfungsdaten laden, deaktiviert der Dialog die Auswahl und blockiert das Speichern. Ein Laden- oder Fehlerzustand wird angezeigt, mit „Erneut versuchen“. So kann nie eine Verknüpfung verloren gehen, weil eine Liste noch fehlt.

## 5. Mock- vs. Firestore-Facade

- **Mock (`NEXT_PUBLIC_DATA_SOURCE` = `mock` oder nicht gesetzt):** `laborbookRepository` (In-Memory, Seed aus `config/laborbook.ts`). Die Mutationen wirken nur im aktuellen Speicher.
- **Firestore:** `firestoreLaborbookService` mit `companies/{companyId}/laborbook`.
- Beide Seiten halten dieselbe Historienregel (Abschnitt 7).

## 6. CRUD

| Aktion | Hook | Service (Firestore) | Lokaler State |
|---|---|---|---|
| Liste laden | `refreshLaborbookEntries()` | `getDocs(...)` | ersetzt, sortiert |
| Anlegen | `createEntry(values)` | `addDoc(...)`, `createdAt`/`updatedAt` frisch, Historie „Eintrag angelegt.“ | nach Erfolg eingefügt |
| Bearbeiten | `updateEntry(id, values)` | Transaktion: `updateDoc`-Payload, Historie „Eintrag bearbeitet.“ | nach Erfolg ersetzt |
| Archivieren | `archiveEntry(id)` | Transaktion: `status: "Archiviert"`, Historie „Eintrag archiviert.“ | nach Erfolg ersetzt |
| Reaktivieren | `restoreEntry(id)` | Transaktion: `status: "Aktiv"`, Historie „Eintrag reaktiviert.“ | nach Erfolg ersetzt |
| Löschen | `removeEntry(id)` | `deleteDoc(...)` | nach Erfolg entfernt |

Fehler werden geworfen und nicht verschluckt. Die UI zeigt Erfolgsmeldungen nur nach bestätigtem Ergebnis.

## 7. Update- und Löschsemantik

**Update:** Ein Feld mit dem Wert `undefined` bedeutet **„Feld entfernen“**. Der Dialog setzt alle Verknüpfungsschlüssel immer explizit (auch als `undefined`), daher löst das Entfernen einer Verknüpfung in Firestore tatsächlich das alte Feld. `buildUpdatePayload` (`firestoreUpdatePayload.ts`) setzt dafür `deleteField()`. `sanitizeForFirestore()` allein würde `undefined` nur verwerfen und den alten Wert stehen lassen.

Dasselbe gilt für Projekt, Kunde, Probe, Fachbereich und Gerät. Der Test prüft: `projectId`, `fachbereich` und `deviceId` werden zu `deleteField()`.

**Bei Update nie überschrieben:** `createdAt`, `id` und `status`/`fotos`/`dokumente`, sofern sie nicht Teil der Änderung sind (der Dialog setzt sie nicht). `updatedAt` wird bei jeder Änderung neu gesetzt.

**Historie:** Der neue Eintrag wird im selben Schreibvorgang an die bestehende Historie angehängt. Firestore liest dazu den aktuellen Dokumentstand in einer Transaktion. So geht bei parallelen Änderungen kein Eintrag verloren. Die bestehende Historie bleibt vollständig erhalten. Keine Audit-Engine, kein globales Audit-Log.

**Löschen:** `deleteDoc` entfernt nur den Laborbuch-Eintrag. **Kein Cascade:** Probe, Projekt, Kunde, Gerät und Prüfwert bleiben unverändert.

**Fehlerverhalten Löschen:** Schlägt das Löschen fehl, bleibt der Bestätigungsdialog offen und zeigt eine Fehlermeldung. Der Drawer schließt sich nur bei Erfolg, denn er verschwindet erst, wenn der Eintrag aus der Liste fällt.

## 8. Datums- und Wochenlogik

- Das Bezugsdatum kommt aus `useReferenceDate` (`src/hooks/shared/useReferenceDate.ts`), derselbe Hook wie beim Kalender.
- **Firestore:** das echte lokale Datum, erst nach dem Mount gesetzt (kein Hydration-Mismatch).
- **Mock:** das Demo-Datum `03.03.2026` aus `config/laborbook.ts`, damit die Mockdaten sichtbar bleiben.
- Die KPIs „Heute“ und „Diese Woche“ nutzen `formatDateDE` und `getWeekDates` aus `calendarDates.ts` (Woche beginnt am Montag). Solange das Bezugsdatum fehlt, zeigt die KPI „—“.
- Es gibt keine zweite Datumslogik.

**Sortierung:** `compareLaborbookEntries` (`src/lib/laborbook/laborbookEntries.ts`) sortiert nach Datum absteigend, bei gleichem Datum nach Uhrzeit absteigend. Der Hook sortiert beim Laden und nach jeder Änderung. Tabelle und Timeline erhalten die Liste in dieser Reihenfolge, daher sind beide konsistent.

## 9. Fotos und Dokumente

Nur **Metadaten**: `fotos` und `dokumente` sind Arrays aus `{id, title, date}`. Es gibt keinen Datei-Upload und kein Cloud Storage. Die Schaltflächen „Foto hinzufügen“ und „Dokument hochladen“ bleiben als späte Funktion markiert (Hinweis „Datei-Upload folgt später“).

## 10. Mutations- und Erfolgsmeldungen

- Erfolgsmeldungen (`FeedbackToast`) nur nach bestätigtem Service-Ergebnis: „Eintrag angelegt.“, „Änderungen gespeichert.“, „Eintrag archiviert.“, „Eintrag reaktiviert.“, „Eintrag gelöscht.“
- Fehlerfälle: Dialoge bleiben offen und zeigen einen Hinweis. Bestätigungen zeigen eine Fehlermeldung statt eines Erfolgs.
- Pending-State: Bestätigungsdialoge (Archivieren, Reaktivieren, Löschen) sperren ihre Buttons während der Anfrage; der Speichern-Button des Formulars zeigt einen Spinner.

## 11. Loading, Error, Retry

- **Loading:** Skeleton für die KPIs und die Liste.
- **Error:** Karte mit der Fehlermeldung und „Erneut versuchen“ (`refreshLaborbookEntries`).
- Der Button „Neuer Eintrag“ ist während Laden oder Fehler deaktiviert.

## 12. Seed

`scripts/seedLaborbook.ts`:

- Schreibt die Mock-Einträge aus `config/laborbook.ts` nach `companies/{companyId}/laborbook`.
- Dokument-ID = bestehende `id` (`LOG-2026-001` …). `id` wird nicht als Feld geschrieben.
- Verknüpfungen (`probeId`, `projectId`, `customerId`, `deviceId`) bleiben erhalten.
- `sanitizeForFirestore()` entfernt `undefined`; `false`/`0`/`""`/`null`/Arrays bleiben.
- Emulator-only (`localhost:8080`, Platzhalter-Projekt), keine Secrets, keine `.env.local`-Abhängigkeit.
- Idempotent: vorhandene Dokumente werden übersprungen; `--force` überschreibt.

Ausführen (Emulator vorher starten): `npx tsx scripts/seedLaborbook.ts`.

## 13. Rules

`firestore.rules`: Block `companies/{companyId}/laborbook/{entryId}` mit `allow read, write: if belongsToCompany(companyId);`, derselbe Standard wie bei den übrigen Slices. Keine Rollen- oder Claims-Logik.

## 14. Verifikation

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: grün.
- Isoliert getestet (Mock-Facade, ohne Emulator): Sortierung inklusive Gleichtag, Historienformat, Historie bei Bearbeiten, Archivieren und Reaktivieren (wächst jeweils), `undefined` → `deleteField()` für Verknüpfungen, Erhalt von `""`/`0`/`false`/`null`/Arrays, `id` nicht im Payload, Mutation eines fehlenden Eintrags liefert `undefined`.
- **Nicht getestet:** die Firestore-Transaktion und die übrigen Firestore-Pfade gegen den Emulator; die Oberfläche im Browser (`/laborbuch` liegt hinter der Firebase-Anmeldung).

## 15. Offene Punkte

- **Keine Notizen-Persistenz:** Das Feld „Notizen“ im alten Dialog war nie angebunden und ist entfernt. Die Beschreibung ist das Notizfeld.
- **Keine Datei-Uploads:** `fotos`/`dokumente` nur Metadaten.
- **Keine Mitarbeiter-Verknüpfung:** `mitarbeiter` bleibt Freitext (kein Auswahlbaustein im Slice).
- **Kein Realtime-Sync:** `getDocs`/`getDoc` statt `onSnapshot`.
- **Kein globales Audit-Log:** nur die berichtsinterne Historie.
- **Keine Rollen-/Claims-Prüfung** in den Rules.
- **Kein Löschen-Cascade** (bewusst).
- **Keine Wochennavigation** für KPIs; sie folgen dem Bezugsdatum.
- **Emulator- und Browser-Tests** ausstehend (Abschnitt 14).
- **Historienzeitstempel** entsteht aus dem lokalen Gerät (keine Serverzeit).
