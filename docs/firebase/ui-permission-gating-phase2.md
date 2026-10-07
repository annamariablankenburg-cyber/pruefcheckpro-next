# UI Permission Gating Phase 2 (Fachseiten)

Status: **Implementiert.** Die UI der acht Fachbereiche (Kunden, Projekte, Geräte, Proben, Prüfungen, Berichte, Kalender, Laborbuch) respektiert dieselben Permissions wie die Firestore Rules Phase 2 (`docs/firebase/role-permission-rules-phase2.md`). Nutzer bekommen Aktionen ohne Recht gar nicht erst angeboten und lösen keine unnötigen Firestore-Abfragen aus.

> **UI-Gating ist UX, keine Sicherheit.** Die Firestore Rules bleiben die Sicherheitsgrenze; ein manipulierter Client umgeht das Gating. `firestore.rules` und die Server-Member-Actions wurden in diesem Slice **nicht** geändert (Rules-Suite 1786/1786).

Vorarbeit: `docs/firebase/ui-permission-gating.md` (Company-Verwaltung, `usePermissions()`).

---

## 1. Architektur

| Baustein | Aufgabe |
| --- | --- |
| `src/lib/permissions/domainAccess.ts` (rein) | zentrale Policy: Schlüsseltabelle, `getDomainAccess` (roh, 1:1 Rules), `getDomainActions` (angeboten, mit Service-Abhängigkeiten), Dialog-Helfer, Seiten-Policies (`getProjectUiAccess`, `getSampleUiAccess`, `getTestEntryUiAccess`, `getReportUiAccess`, `getCalendarUiAccess`, `getLaborbookUiAccess`), Navigation (`filterNavGroups`) |
| `src/components/shared/DomainAccessGate.tsx` | sperrt eine Seite ohne `*.ansehen` (auch bei direktem URL-Aufruf); vier Zustände: Rechte laden / Rechte-Fehler / kein Recht / Zugriff. **Die Inhalte (und damit Hooks und Firestore-Queries) werden erst nach erfolgreicher Prüfung gerendert.** |
| `src/hooks/useDomainPermissions.ts` | fail-closed Rechte für Komponenten außerhalb des Gates (Navigation, Dashboard): leere Map, solange die Rechte laden oder fehlschlagen |
| Hooks `useCustomers/Projects/Devices/Samples/Reports/Calendar(enabled)` | `enabled=false` → keine Abfrage, leere Daten, kein Ladezustand/Fehler (für Referenzlisten und Dashboard) |

Muster pro Fachseite: `export function XView() { return <DomainAccessGate domain label>{(actions, permissions) => <XContent access={getXUiAccess(permissions)} />}</DomainAccessGate>; }`. Die Komponenten (Tabelle, Aktionsmenü, Drawer, Bulk-Toolbar) erhalten ein `access`-Objekt und rendern Aktionen bedingt; zusätzlich brechen die Handler bei fehlendem Recht still ab (`if (!access.delete) return;`) – defensive UX, nicht Security.

Es gibt **keine** zweite Rollenquelle: alles basiert auf `usePermissions()` (Membership → Rolle → `permissions`).

## 2. Domain-Access-Matrix (exakt Rules Phase 2)

| Bereich (Rules-Collection) | Route / Komponente | view | create | edit | delete |
| --- | --- | --- | --- | --- | --- |
| Kunden (`customers`) | `/kunden` · `CustomersView` | `kunden.ansehen` | `kunden.erstellen` | `kunden.bearbeiten` | `kunden.loeschen` |
| Projekte (`projects`) | `/projekte` · `ProjectsView` | `projekte.ansehen` | `projekte.erstellen` | `projekte.bearbeiten` | `projekte.loeschen` |
| Geräte (`devices`) | `/geraete` · `DevicesView` | `geraete.ansehen` | `geraete.erstellen` | `geraete.bearbeiten` | `geraete.loeschen` |
| Proben (`samples`) | `/probekoerper` | `proben.ansehen` | `proben.erstellen` | `proben.bearbeiten` | `proben.loeschen` |
| Prüfungen (`testValues`) | `/pruefungen` | `pruefungen.ansehen` | `pruefungen.erstellen` | `pruefungen.bearbeiten` | `pruefungen.loeschen` |
| Berichte (`reports`) | `/pdf-export` · `ReportsView` | `berichte.ansehen` | `berichte.erstellen` | `berichte.bearbeiten` | `berichte.loeschen` · Export zusätzlich `pdf.exportieren` |
| Kalender (`calendarEvents`) | `/kalender` | `kalender.ansehen` | `kalender.termine_erstellen` | `kalender.bearbeiten` | `kalender.loeschen` |
| Laborbuch (`laborbook`) | `/laborbuch` | `laborbuch.ansehen` | `laborbuch.erstellen` | `laborbuch.bearbeiten` | `laborbuch.loeschen` |

`geraete.loeschen`, `laborbuch.loeschen` und `berichte.loeschen` (Admin-only-Löschrechte) werden wie jeder andere Schlüssel nur als effektiver Wert geprüft – es gibt **keine** `roleId === "admin"`-Sonderprüfung. Kein neuer und kein umbenannter Schlüssel; ein Test vergleicht `DOMAIN_PERMISSION_KEYS` mit den Regeln in `firestore.rules` und mit `allPermissionKeys`.

Zwei Ebenen in `domainAccess.ts`: **roh** (`getDomainAccess`: view/create/edit/delete voneinander unabhängig, wie in den Rules) und **angeboten** (`getDomainActions`: zusätzlich setzt jede Aktion `*.ansehen` voraus, siehe Abschnitt 6).

## 3. Navigation und direkte Routen

- `config/navigation.ts`: Die acht Fachbereiche tragen `requiredPermission` (View-Schlüssel). `Sidebar` und `BottomNav` filtern damit (`filterNavGroups`/`filterNavItems`), fail-closed: solange die Rechte laden, erscheinen gesperrte Punkte nicht. Leere Gruppen entfallen.
- **Direkte URL:** Jede Fachseite sperrt sich selbst über `DomainAccessGate` (kein Verlass auf die Navigation). Ohne `*.ansehen`: neutraler Zustand „Du hast keine Berechtigung, diesen Bereich anzusehen.“ – keine leere Tabelle, kein roher `permission-denied`, **keine Firestore-Abfrage** (die Hooks laufen gar nicht).
- Nicht Teil dieses Slices (bleiben ungated): Dashboard-Route selbst, KI, Statistiken, Baustellenmodus, Unternehmen, Konto.

## 4. Seiten, Aktionen und Buttons

Alle Handler prüfen zusätzlich das Recht. „Löschen“ in der UI gibt es nur dort, wo es heute existiert.

| Bereich | Aktionen und benötigtes Recht |
| --- | --- |
| **Kunden** | Neuer Kunde: erstellen · Bearbeiten, Deaktivieren/Reaktivieren/Archivieren, Rechnung/Lieferschein/Dokument (Platzhalter): bearbeiten · „Projekt erstellen“ (Platzhalter): `projekte.erstellen` + Kunden lesen (Projektformular). *Kein Löschen in der UI.* |
| **Projekte** | Neues Projekt: erstellen + `kunden.ansehen` · Bearbeiten-Dialog: bearbeiten + `kunden.ansehen` · Pausieren/Fortsetzen/Abschließen/Wieder öffnen/Archivieren/Reaktivieren: bearbeiten · Lieferschein (Platzhalter): bearbeiten · „Proben anzeigen“: `proben.ansehen` · „Neue Probe“: Probenformular-Rechte · „Kunden öffnen“: `kunden.ansehen`. *Kein Löschen in der UI.* |
| **Geräte** | Neues Gerät: erstellen · Bearbeiten, Außer Betrieb, Archivieren/Reaktivieren, Kalibrierung/Wartung/Dokumente (Platzhalter): bearbeiten. *Kein Löschen in der UI.* |
| **Proben** | Neue Probe: erstellen + `projekte.ansehen` + `kunden.ansehen` · Bearbeiten-Dialog: bearbeiten + dieselben Referenzen · Starten/Abschließen/Wieder öffnen/Archivieren/Reaktivieren: bearbeiten · Duplizieren: **erstellen** · Löschen (einzeln): loeschen · **Bulk** Prüfer/Status/Archivieren: bearbeiten, Bulk-Löschen: loeschen, Auswahl-Checkboxen nur wenn eine Bulk-Aktion möglich ist · „Prüfwerte eintragen“: `pruefungen.ansehen` |
| **Prüfungen** | Neue Prüfung: erstellen + `proben.ansehen` · Starten/Abschließen/Wieder öffnen/Zurücksetzen, Messwerte/Entwürfe/Ergebnis speichern (Workspace sonst schreibgeschützt): bearbeiten · Löschen: loeschen · **Bericht öffnen/erstellen getrennt:** existiert zur Probe schon ein Bericht, gibt es nur „Bericht öffnen“ (`berichte.ansehen`), sonst nur „Bericht erstellen“ (`berichte.erstellen` + `berichte.ansehen` + `proben.ansehen`); ohne `berichte.ansehen` ist die Existenz nicht feststellbar (Berichtsliste wird nicht geladen) → **fail-closed, keine Bericht-Aktion** · „Excel exportieren“: bearbeiten + `pdf.exportieren` (Berichte) · „Zur Probe“: `proben.ansehen`. `?sampleId=` ohne `pruefungen.erstellen` legt nichts an (Hinweis statt Fehler). |
| **Berichte** | Neuer Bericht: erstellen + `proben.ansehen` · Bearbeiten, Speichern, Als Entwurf/fertig, Archivieren/Reaktivieren, E-Mail vorbereiten/versenden/erneut senden (Editor sonst schreibgeschützt): bearbeiten · Duplizieren: erstellen · **PDF-/Excel-Export**: bearbeiten + `pdf.exportieren` · Löschen: loeschen · „Kunde/Projekt/Probe öffnen“: jeweiliges Leserecht |
| **Kalender** | Neue Aufgabe: `kalender.termine_erstellen` · Bearbeiten, Verschieben: bearbeiten · Duplizieren: `kalender.termine_erstellen` · Löschen: loeschen · „Probe öffnen“/Probenauswahl: `proben.ansehen` · „Prüfwerte eintragen“: `pruefungen.ansehen` |
| **Laborbuch** | Neuer Eintrag: erstellen · Bearbeiten/Archivieren/Reaktivieren: bearbeiten **und** ansehen (Service-Abhängigkeit, Abschnitt 6) · Löschen: loeschen |

## 5. Dialog-Abhängigkeiten (Pflicht- vs. optionale Referenzen)

| Dialog | Referenzen | Verhalten |
| --- | --- | --- |
| Projekt (Neu/Bearbeiten) | **Kunde: Pflichtfeld** (`customersError` blockiert das Speichern) | Anlegen **und** Bearbeiten brauchen `kunden.ansehen`, sonst Button/Aktion weg |
| Probe (Neu/Bearbeiten) | **Projekt: Pflicht**, Kunde wird aus dem Projekt abgeleitet (muss lesbar sein) | brauchen `projekte.ansehen` + `kunden.ansehen` |
| Prüfung (Neu) | **Probe: Pflicht** (Prüfung entsteht aus einer Probe); `createTestEntry` liest vorab | `pruefungen.erstellen` + `pruefungen.ansehen` + `proben.ansehen` |
| Bericht (Neu) | **Probe: Pflicht** (aus Probe abgeleitet) | `berichte.erstellen` + `proben.ansehen`; normaler Bericht startet als „Entwurf“ (kein `pdf.exportieren`) |
| Kalendertermin (Neu/Bearbeiten) | **Probe: optional** („Standalone-Termin“) | **Kein** Pflicht-Lesen. Ohne `proben.ansehen` entfällt nur die Probenauswahl (keine Abfrage); Anlegen bleibt möglich, beim Bearbeiten bleibt eine bestehende Verknüpfung (inkl. Prüfwert-Verweis) unverändert |
| Laborbuch-Eintrag (Neu/Bearbeiten) | Probe, Projekt, Kunde, Gerät: **alle optional** | Jede Liste wird nur mit ihrem Leserecht geladen und angeboten (`refs`); sonst ist das Feld schreibgeschützt/ausgeblendet. Beim Bearbeiten bleiben bestehende Verknüpfungen erhalten (`keep*`). Anlegen braucht keine der Listen |

Es werden bewusst **nicht** pauschal alle Referenzrechte UND-verknüpft.

## 6. Service-Abhängigkeiten: Lesen vor/nach dem Schreiben

Die Rules verlangen für Schreibvorgänge kein `*.ansehen` (`role-permission-rules-phase2.md`, Abschnitt 7). Die Client-Services lesen aber:

| Flow | Lesezugriff | UI-Konsequenz |
| --- | --- | --- |
| `createSample`, `createTestEntry` | `getDoc` vorab (Eindeutigkeit) | Anlegen nur mit eigenem `*.ansehen` angeboten |
| alle `update*`/Statuswechsel (Kunden, Projekte, Geräte, Proben, Prüfungen, Berichte, Kalender) | `getDoc` nach dem Schreiben | edit nur mit eigenem `*.ansehen` angeboten |
| `updateLaborbookEntry` (auch Archivieren/Wiederherstellen) | `transaction.get` | Bearbeiten **nur mit** `laborbuch.bearbeiten` **und** `laborbuch.ansehen` |
| `duplicateSample` | liest alle Proben | Duplizieren nur mit `proben.erstellen` + `proben.ansehen` |
| `removeX`, Bulk-Delete | keines | nur `*.loeschen` (zusätzlich Seitenzugriff) |

Da jede Fachseite ohne `*.ansehen` gesperrt ist, ist das Seitenrecht in der Praxis immer erfüllt; `getDomainActions` macht die Abhängigkeit trotzdem explizit und testbar (z. B. für Komponenten, die außerhalb der Seite Aktionen anbieten). **Keine Service-Architektur wurde geändert** (kein Umbau von Read-after-write auf Write-Result).

## 7. Berichte: Export

`pdf.exportieren` ist die Aktion „exportieren“. Der Export markiert den Bericht als „PDF exportiert“/„Excel exportiert“ = ein Update (`berichte.bearbeiten`) in einen Export-Status; die Rules verlangen dafür zusätzlich `pdf.exportieren`. Die UI bietet Export daher nur mit **bearbeiten + `pdf.exportieren`** (+ ansehen) an: Aktionsmenü, Editor-Seitenleiste, Export-Vorschau und Prüfungen-Seite. Wer `berichte.bearbeiten`, aber nicht `pdf.exportieren` hält, bearbeitet Berichtsdaten, sieht aber keine Export-Buttons. `pdf.exportieren` allein genügt nicht. `pdf.exportieren` ist von „Bericht öffnen/erstellen“ getrennt (Prüfungen-Seite: `viewReport`, `createReport`, `export` sind eigene Flags). Anlegen als bereits exportierter Bericht gibt es in der UI nicht (Entwurf); der Helfer `createExported` bildet die Rule (erstellen + `pdf.exportieren`) ab. Duplizieren legt einen Entwurf an und braucht nur `berichte.erstellen`.

## 8. Dashboard

Das Dashboard liest den Kalender nur mit `kalender.ansehen` (`useCalendar(enabled)`) und blendet Karten aus Bereichen ohne `*.ansehen` aus – auch Zählwerte („Überfällige Aufgaben“, „Geplante Prüfungen“, „Offene Proben“, „Projekte“, Heutige/Überfällige Prüfungen, Wochenkalender, Laborstatus, Probenstatus), damit der Bestand nicht über Zahlen offengelegt wird. Schnellaktionen erscheinen nur für erreichbare Bereiche („Neue Probe“ nach Probenformular-Rechten). Hinweis: Die Probenwerte, Projektzahl und Probenliste des Dashboards sind heute Mock-Konstanten aus `config/*`, nicht Firestore-Daten; sie folgen trotzdem der Policy.

## 9. Fail-closed, Loading und Mock-Modus

- Rechte laden → Skeleton, keine privilegierten Buttons, keine Abfragen. Rechte-Fehler → Karte mit „Erneut versuchen“. Fehlende/gesperrte Membership, fehlende `roleId`/Rolle, archivierte Rolle, unbekannter Schlüssel, `false`/nicht-`true`-Werte → keine Rechte (`usePermissions()`, `normalizePermissions`, `hasPermission`).
- Unterschied: **darf sehen, aber keine Daten** = normaler Empty State der Seite; **darf nicht sehen** = Zugriffsverweigerung; **Rechte laden** = Skeleton; **technischer Fehler** = Fehlerkarte.
- **Mock-Modus** (`NEXT_PUBLIC_DATA_SOURCE ≠ firestore`): `usePermissions()` gewährt alle Rechte (`isDemo`); die Fachseiten verhalten sich wie zuvor. Im Firestore-Modus nie.
- `permission-denied` aus Firestore wird in den Hooks wie bisher in deutsche Fehlermeldungen übersetzt (keine rohe Firebase-Meldung); das Gating verhindert die Fälle im Normalfluss.

## 10. Tests

`npm run test:permissions` – `tests/config/domain-access.test.ts` (rein, 89 Tests): Schlüssel = `allPermissionKeys` und exakt die Regeln in `firestore.rules`; je Bereich view/create/edit/delete unabhängig; Aktionen setzen `*.ansehen` voraus; Berichte (bearbeiten ohne Export, Export ohne bearbeiten, exportierter Bericht braucht erstellen + Export, normaler Bericht nur erstellen + Probe lesen); Dialog-Abhängigkeiten (Projekt, Probe, Prüfung, Bericht, Kalender, Laborbuch); Service-Abhängigkeiten (Laborbuch bearbeiten + ansehen, Vorab-/Nach-Lesen); Seiten-Policies; fail-closed (leer/`null`/`undefined`/`false`/`"true"`/`1`, unbekannte Schlüssel); Systemrollen-Erwartung aus der Config (nicht aus Namen); Navigation.

Es gibt **keine** React-/Komponententest-Infrastruktur im Projekt; die Policy ist deshalb rein getestet, die Komponenten sind über `tsc`/`lint`/`build` abgesichert. `npm run test:rules` bleibt unverändert (1786).

## 11. Verbleibende UX-/Service-Lücken

- **Projekt-Bearbeiten ohne `kunden.ansehen`:** Der Dialog braucht die Kundenliste (Pflichtfeld). Man könnte einen bestehenden Kunden ohne Lesen erhalten (wie beim Kalender/Laborbuch) – nicht umgesetzt; betrifft nur Custom Roles (alle Systemrollen mit `projekte.*` lesen Kunden).
- **Service-Read-after-write** bleibt (Follow-up: Serverantwort bzw. Write-Result lokal anwenden statt `getDoc` – ein kleiner Umbau je Service, dann entfällt die Abhängigkeit von `*.ansehen` für Updates).
- **Offene Fachseiten-Aktionen ohne Backend** („später angebunden“) werden mit dem jeweiligen Bearbeiten-Recht gegated, haben aber noch keine echte Funktion.
- **Kein Löschen** in der UI für Kunden, Projekte, Geräte (die Schlüssel existieren; sobald eine Lösch-UI kommt, gilt `*.loeschen`). Die Empfehlung „Löschen nur für archivierte Datensätze“ bleibt offen (`role-permission-rules-phase2.md`, Abschnitt 5).
- **Nicht gated** (nicht Teil des Slices): `dashboard.anzeigen`, `ki.verwenden`, Statistiken, Baustellenmodus.
- **Laufende Rechteänderung:** Die Rechte aktualisieren sich live; bereits geöffnete Dialoge/Drawer werden nicht geschlossen (der nächste Speichervorgang scheitert dann an den Rules, die Handler brechen bei fehlendem Recht still ab).
- **Keine Browser-/Rendertests** der gegateten Komponenten (Login erforderlich, keine Test-Infrastruktur); manuelle Prüfung mit echten Rollen im Emulator/Staging steht aus.
