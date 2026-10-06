# Location-Firestore-Slice (Standorte)

Status: **Neunter Vertical Slice mit echter Firestore-Anbindung.** Beschreibt, wie der Tab „Standorte“ (`/company?tab=standorte`) und die standortbezogenen Teile der Company-Übersicht Daten lesen und schreiben. Analog zu `docs/firebase/laborbook-firestore-slice.md`.

---

## 1. Datenfluss

```
app/(app)/company/page.tsx
  → useLocations() (src/hooks/useLocations.ts)      ← EINE Instanz für die ganze Seite
    → locationService (src/lib/services/locationService.ts)
      ── isMockDataSource ──→ locationRepository (In-Memory, config/locations.ts)
      ── isFirestoreDataSource ──→ firestoreLocationService (Firestore SDK)
  → Übersicht: CompanyLocationsList, CompanyPrimaryLocationCard, Standortzahl im Kopf
  → Tab „Standorte“: CompanyLocationsView(locationsData) → Table, Drawer, Dialoge
  → NewLocationDialog (Anlegen: Seite, Bearbeiten: Tab)
```

- `useLocations()` wird **einmal** auf der Company-Seite aufgerufen und als `locationsData` an den Tab gereicht. Zwei Hook-Instanzen hätten zwei getrennte States, und Übersicht und Tab würden nach Änderungen auseinanderlaufen.
- Der lokale State ändert sich erst nach einem bestätigten Service-Ergebnis. Es gibt keine optimistischen Updates.

## 2. Collection-Pfad

```
companies/{companyId}/locations/{locationId}
```

Über `companyCollectionPaths.locations(companyId)` und `resolveCompanyId()`. **Dokument-ID = `CompanyLocationDetail.id`.** `id` wird nie als Datenfeld geschrieben (`withoutIdField`). Der Converter `locationConverter` (`createIdConverter`) existierte bereits und setzt die `id` beim Lesen.

## 3. Datenmodell

Alle bisherigen Felder sind unverändert: `name`, `type`, `street`, `postalCode`, `city`, `country`, `contactPerson`, `phone`, `email`, `timezone`, `employeeCount`, `deviceCount`, `projectCount`, `status`, `history`. Additiv: `createdAt?`, `updatedAt?` (ISO-String, nur bei Firestore- bzw. neu angelegten Datensätzen). Keine Breaking Changes.

### Zähler sind vorläufige Snapshot-Felder

`employeeCount`, `deviceCount`, `projectCount` sind **gespeicherte Momentaufnahmen**, keine Aggregation. Sie werden nicht aus Mitarbeitern, Geräten oder Projekten berechnet.

- Neue Standorte starten mit `0`.
- Der Bearbeiten-Dialog ändert die Zähler nicht; sie bleiben beim Update unangetastet.
- Die Summen im Tab „Standorte“ addieren diese Snapshot-Werte.
- Später sollen sie aus den echten Sammlungen abgeleitet werden. Das ist bewusst nicht Teil dieses Slices.

### „Notizen“ entfernt

Der alte Dialog hatte ein „Notizen“-Feld ohne Datenmodell, das nie gespeichert wurde. Es wurde entfernt, statt als Phantomfeld mitgeführt zu werden. Das Modell hat kein Notizfeld.

### Zeitzone

Der Dialog speichert Werte wie `Europe/Berlin`. Die Mockdaten verwenden `Europe/Berlin (UTC+1)`. Beim Bearbeiten bleibt ein bestehender, nicht in der Liste enthaltener Wert als Option „(bisheriger Wert)“ erhalten und wird nicht still überschrieben.

## 4. Historie

Jede Mutation hängt einen Eintrag an die bestehende `history` an, im vorhandenen Format (Datum `DD.MM.YYYY`):

| Aktion | Meldung |
|---|---|
| Anlegen | „Standort wurde angelegt.“ |
| Bearbeiten | „Standort wurde bearbeitet.“ |
| Deaktivieren | „Standort wurde deaktiviert.“ |
| Reaktivieren | „Standort wurde reaktiviert.“ |

Bei Firestore läuft das Update in einer **Transaktion**: Der aktuelle Stand (inkl. Historie) wird im selben Schreibvorgang gelesen und erweitert, sodass bei parallelen Änderungen kein Eintrag verloren geht. Der Mock hängt gleich an. Es gibt kein globales Audit-Log.

## 5. Mock-/Firestore-Facade

`locationService` verzweigt je Methode über `isFirestoreDataSource`. Mock: `locationRepository` (Seed aus `config/locations.ts`, Änderungen nur im Speicher). Firestore: `firestoreLocationService`. Beide durchlaufen dieselbe Hauptstandort-Regel (Abschnitt 8).

## 6. Anlegen, Bearbeiten, Deaktivieren, Reaktivieren

| Aktion | Hook | Firestore |
|---|---|---|
| Laden | `refreshLocations()` | `getDocs` |
| Anlegen | `createLocation(values)` | `addDoc` mit `status: "Aktiv"`, Zähler `0`, Historie, frisches `createdAt`/`updatedAt` |
| Bearbeiten | `updateLocation(id, values)` | Transaktion, `updatedAt` neu, `createdAt` unberührt |
| Deaktivieren | `deactivateLocation(id)` | Transaktion, `status: "Inaktiv"` |
| Reaktivieren | `reactivateLocation(id)` | Transaktion, `status: "Aktiv"` |

- **Update-Semantik:** `undefined` bedeutet „Feld entfernen“ (`deleteField()` über `buildUpdatePayload`). Der Standort-Dialog setzt alle Felder als Strings, `""` bleibt erhalten.
- **Dialog:** Pending-State mit Spinner, Fehleranzeige im Dialog, schließt nur bei Erfolg.
- **Erfolgsmeldungen** erscheinen erst nach bestätigtem Ergebnis. Beim Fehlschlag bleiben Dialog bzw. Drawer offen.
- **Auswahl über ID:** Drawer und Bearbeiten-Dialog halten nur die `locationId` und lesen den Datensatz aus der Liste. Nach einem Update zeigen sie immer den aktuellen Stand.

## 7. Kein Hard-Delete

Standorte werden nur deaktiviert, nie gelöscht. Es gibt weder eine Löschfunktion im Service noch in der UI. Deaktivierte Standorte bleiben mit Historie erhalten.

## 8. Hauptstandort-Regel

**Invariante:** Es gibt höchstens einen **aktiven** Standort vom Typ `Hauptstandort`.

Geprüft wird in der Facade, also für Mock und Firestore gleich, vor:
- Anlegen eines aktiven Hauptstandorts,
- Bearbeiten (Typ wird zu Hauptstandort),
- Reaktivieren eines Hauptstandorts.

Bei einem Konflikt wird gespeichert **nichts**. Es wird ein `LocationRuleError` geworfen, dessen Meldung im Dialog (Anlegen/Bearbeiten) bzw. als Hinweis-Toast (Reaktivieren) angezeigt wird: „Es existiert bereits ein aktiver Hauptstandort („…“). Bitte zuerst dessen Typ ändern oder ihn deaktivieren.“ Es gibt keine stille Umwandlung. Der eigene Datensatz zählt nicht als Konflikt, und inaktive Hauptstandorte dürfen bestehen.

**Einschränkung:** Bei Firestore ist die Prüfung nicht atomar mit dem Schreiben. Zwei gleichzeitige Anfragen aus verschiedenen Sitzungen könnten beide die Prüfung bestehen. Das ist ein bewusst einfacher Schutz für den normalen Bedienfall. Eine harte Garantie bräuchte eine Server-Funktion oder ein Singleton-Dokument.

## 9. Company-Übersicht nutzt dieselbe Quelle

`company/page.tsx` liest Standorte nicht mehr aus `companyRepository`, sondern aus `useLocations()`:

- **Standortliste (Übersicht):** aktive Standorte, Adresse als `Straße, PLZ Ort`. Leerer Zustand: „Noch keine aktiven Standorte angelegt.“
- **Primärer Standort (Tab „Einstellungen“):** der aktive Standort vom Typ `Hauptstandort`. Ohne einen zeigt die Karte einen Hinweis.
- **Standortzahl im Kopf:** Anzahl aktiver Standorte, sobald geladen.
- **Laden/Fehler:** Platzhalter bzw. Fehlerkarte mit „Erneut versuchen“, keine falschen Zahlen.

Unverändert bleiben Lizenz, Mitarbeiter, Aktivitäten und Firmeninformationen. **Auswirkung im Mock-Modus:** Die Übersicht zeigte zuvor eine eigene Liste (Stuttgart, München, Hamburg). Jetzt zeigt sie dieselben aktiven Standorte wie der Tab (Stuttgart, München, Remseck). Hamburg existierte nur in dieser Übersichtsliste.

`companyRepository.getOverviewLocations()` und `getPrimaryLocation()` sind nun ungenutzt.

## 10. Reihenfolge

Hauptstandort zuerst, aktive vor inaktiven, dann alphabetisch (`sortLocations`). Gleiche Reihenfolge für Mock und Firestore. Der Mock-Bestand erschien zuvor in Seed-Reihenfolge.

## 11. Seed

`scripts/seedLocations.ts`: schreibt `companyLocationDetails` nach `companies/{companyId}/locations`, Dokument-ID = bestehende `id` (`loc-stuttgart` …), `id` nicht als Feld, `sanitizeForFirestore()`. Emulator-only (`localhost:8080`, Platzhalter-Projekt), keine Secrets, keine `.env.local`. Idempotent, `--force` überschreibt.

Ausführen (Emulator vorher starten): `npx tsx scripts/seedLocations.ts`.

## 12. Rules

> **Update (Rules Phase 1):** Die Collection `locations` wird seit Phase 1 rollenbasiert geschützt (Permission statt nur Membership) – siehe `docs/firebase/role-permission-rules-phase1.md`. Die folgende Beschreibung gibt den Stand vor Phase 1 wieder.

`firestore.rules`: Block `companies/{companyId}/locations/{locationId}` mit `allow read, write: if belongsToCompany(companyId);`. Keine Rollen- oder Claims-Logik.

## 13. Verifikation

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: grün.
- Isoliert über die Mock-Facade geprüft: Regel blockiert Anlegen, Reaktivieren und Bearbeiten bei Fremd-Konflikt; eigener Hauptstandort bleibt änderbar; Herabstufen und anschließendes Befördern funktioniert; Historie wächst bei Bearbeiten, Deaktivieren, Reaktivieren; unbekannte ID liefert `undefined`; Sortierung; `undefined` wird zu `deleteField()`, `id` fehlt im Payload, `""` und `0` bleiben.
- **Nicht getestet:** Firestore-Pfade gegen den Emulator (Transaktion, Seed), die Oberfläche im Browser (`/company` liegt hinter der Firebase-Anmeldung).

## 14. Offene Punkte

- **Zähler** sind Snapshots (Abschnitt 3).
- **Hauptstandort-Regel** nicht atomar bei Firestore (Abschnitt 8).
- **Weitere Stellen lesen noch die Mock-Config direkt** und sind damit im Firestore-Modus eine zweite Standortquelle: `AdminView` (Standortzahl und -liste) und `config/employees.ts` (`locationNames` für Mitarbeiter-Dialoge). Sie liegen außerhalb dieses Slices.
- **Mitarbeiter anzeigen** ist weiterhin ein Platzhalter („wird später angebunden“).
- **Kein Hard-Delete**, kein globales Audit-Log, kein Realtime-Sync.
- **Keine Rollen-/Claims-Prüfung** in den Rules.
- **Historienzeitstempel** stammt vom lokalen Gerät und enthält nur das Datum.
- **Emulator- und Browser-Test** ausstehend.
