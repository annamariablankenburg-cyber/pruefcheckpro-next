# Role-Based Security Audit + Enforcement Plan

Status: **Audit und Planung. Es wird nichts erzwungen und nichts implementiert.** Dieses Dokument ändert weder `firestore.rules` noch Services, Hooks, Seeds oder Datenmodelle. Es beschreibt, was heute gilt, wo die Lücken sind und welche Enforcement-Architektur wir bauen sollten.

> **Update (serverseitige Mitglieder-Aktionen):** Die in Abschnitt 6/7 empfohlene Server-Operation ist umgesetzt: `assignRole` und `setMemberStatus` (Admin SDK, Route Handler) schreiben Employee und Membership atomar und prüfen Actor-Rechte, geschützte Rollen, Eigenänderung und den letzten aktiven Administrator (Definition: Membership „Aktiv“ + `roleId == "admin"`). Die Firestore Rules verbieten dem Client `roleId`/`role`/`status` am Mitarbeiter. Details: `docs/firebase/member-security-actions.md`. Offen bleiben Einladungsannahme/Firmen-Provisionierung und Rules Phase 2.

> **Update (Slice „Permission-Taxonomie schließen“):** Die in diesem Audit gefundenen Permission-Lücken sind geschlossen, die Systemrollen-Matrix ist bereinigt und der Konflikt „Laborleiter vs. nur Admin“ ist aufgelöst. **Taxonomie: 31 → 45 Schlüssel**, neuer Superuser-Schlüssel `rollen.admin_verwalten`. Die maßgebliche Policy steht jetzt in `docs/database/permissions.md` (Abschnitt 14 dieses Dokuments fasst die Auswirkungen auf das Audit zusammen). Wo unten noch „31 Keys“, „⚠ Lücke“ oder die alten Matrixwerte stehen, beschreibt der Text den **Audit-Stand vor diesem Slice** (Ausgangsbasis); Enforcement ist weiterhin **nicht** umgesetzt.

Stand der Analyse: nach den Slices Kunden, Projekte, Geräte, Proben, Prüfwerte, Berichte, Kalender, Laborbuch, Standorte, Mitarbeiter, Einladungen, Rollen und Security Foundations (`userMemberships/{uid}`).

> **Kernaussage:** Auf Rules-Ebene gilt heute „aktives Mitglied der Firma = darf alles in `companies/{companyId}/…`“. Rollen und Berechtigungen existieren nur als Verwaltungsdaten und werden **nirgends** ausgewertet – weder serverseitig noch in der UI. Ein Gast kann mit dem Firebase-SDK jede Probe löschen, Rollen ändern und Mitarbeiter sperren.

---

## 1. Ist-Zustand (Antworten auf die 14 Fragen)

**1. Welche Permission-Keys existieren?** (Audit-Stand; jetzt 45 in 13 Modulen, siehe Abschnitt 14) 31 Keys in 11 Modulen (`permissionCategories` in `src/config/roles.ts`), Inventar siehe Abschnitt 2. Das ältere `docs/database/permissions.md` spricht von „~27“ und geht von Custom Claims (`request.auth.token.role`) aus – beides ist überholt.

**2. Welche werden nur in der UI verwendet?** **Alle 31, und auch dort nur zur Anzeige/Bearbeitung der Rollenverwaltung** (`RolesView`, `RoleDrawer`, `CreateRoleDialog`, `EmployeeDetailDrawer` für die Modulübersicht). **Es gibt keine einzige Stelle, die ein Recht abfragt**, um einen Button zu verstecken oder eine Aktion zu sperren (Suche nach `permissions[`, `hasPermission`, `can(` und den Key-Strings ergibt keine Treffer außerhalb der Rollenverwaltung). Die Berechtigungen sind also heute nicht einmal UI-seitig wirksam.

**3. Permission-Checks außerhalb der UI?** Nein. Weder Services noch Rules werten `permissions` oder `roleId` aus. Die einzigen „Rollen-Regeln“ im Code sind **Verwaltungs-Invarianten der Rollen selbst**, und sie liegen im Client (`roleRules.ts`): Systemrollen nicht archivierbar/umbenennbar, Administrator-Berechtigungen festgeschrieben, Rollennamen eindeutig. Ein direkter SDK-Schreibzugriff umgeht sie vollständig, weil die Rules `roles` für jedes aktive Mitglied komplett freigeben.

**4. Systemrollen:** `admin` (Administrator), `laborleiter`, `pruefer`, `azubi`, `gast` (`type: "System"`, stabile Dokument-IDs). Dazu zwei Beispiel-Custom-Roles aus der Config: `qualitaetsmanager`, `baustellenleiter`.

**5. Administrator:** die Rolle mit der festen ID `admin` (`ADMIN_ROLE_ID` in `roleRules.ts`). Ihre Berechtigungen sind im Client nicht editierbar. Serverseitig ist das **nicht** abgesichert.

**6. Permission-Matrix der Systemrollen:** siehe Abschnitt 3 (admin 31/31, laborleiter 29/31, pruefer 16/31, azubi 11/31, gast 8/31).

**7. Können Custom Roles eigene Kombinationen haben?** Ja, vollständig: jede der 31 Schalter ist frei kombinierbar (`createRole`/`updateRole`). Konsequenz: Eine Rules-Logik darf **nie** auf `roleId`/Rollennamen basieren, sondern muss die Permission-Map der Rolle auswerten. Zusätzlich sind Kombinationen möglich, die Abhängigkeiten zwischen Collections brechen (z. B. `proben.erstellen` ohne `projekte.ansehen`; siehe 5.3).

**8. Woher kennt ein eingeloggter User seine `roleId`?** Nur aus `userMemberships/{uid}.roleId` (optionales Feld; `AuthProvider` hält es in `membership.membership.roleId`, **niemand liest es**). Über `membership.employeeId` ließe sich zusätzlich `companies/{c}/employees/{id}.roleId` erreichen. `users/{uid}.role` ist eine andere Sache (alte `UserRole`, Profil).

**9. Ist `userMemberships.roleId` synchron mit `Employee.roleId`?** **Nein, es gibt keinerlei Synchronisation.** Es sind zwei unabhängige Dokumente. Nur der Seed leitet beide aus derselben Config ab. Die Membership ist vom Client nicht schreibbar, das Employee-Dokument schon.

**10. Was passiert bei Rollenwechsel?** `useEmployees.changeRole` schreibt `roleId`, `role` (Snapshot) und einen Historieneintrag **nur** ins Employee-Dokument. Die Membership bleibt unverändert, `updatedAt` der Membership ebenfalls. Im heutigen Modell hat das **keine** Auswirkung auf den Zugriff; sobald Autorisierung an die Membership gebunden ist, ändert die UI-Aktion „Rolle ändern“ effektiv nichts (siehe 6). Die Umbenennung einer Rolle aktualisiert die Snapshots in Employee/Invitation/Membership nicht.

**11. Archivierte Rollen?** `status: "Archiviert"` = nicht mehr für neue Zuweisungen wählbar, bestehende Zuweisungen bleiben (UI-Zusage; **seit Rules Phase 1 überholt**, siehe Abschnitt 15). Rollen werden aufgelöst und weiter angezeigt. Systemrollen sind nicht archivierbar (nur Client-Regel). *Audit-Empfehlung war: archivierte Rollen behalten ihre Berechtigungen; Phase 1 entscheidet bewusst anders: archivierte Rollen gewähren keine Rechte mehr (Zugewiesene verlieren den Zugriff auf die vier Verwaltungscollections).*

**12. Kann eine Membership auf eine nicht existierende Rolle zeigen?** Ja. `roleId` ist optional, es gibt keine Fremdschlüssel-Prüfung, und die Rules erlauben jedem aktiven Mitglied sogar, Rollen-Dokumente per SDK **zu löschen** (kein Client-Pfad dafür, aber kein Rules-Schutz). Eine solche Membership muss **fail-closed** behandelt werden (kein Zugriff).

**13. Sicherer Bootstrap für den ersten Admin?** **Nein, es gibt gar keinen Bootstrap.** Registrierung legt nur `users/{uid}` an (`role: "azubi"`). Es gibt keine Firmen-Anlage, keine Systemrollen für neue Firmen (nur der Emulator-Seed), keine Employee-Erstellung (Employees entstehen nur per Seed) und keinen Weg zur Membership außer manuell in der Konsole. Details und Empfehlung in Abschnitt 8.

**14. Wird `users/{uid}.role` irgendwo für Security genutzt?** **Nein.** Die Rules lesen `users/{uid}` nirgends (nur `userMemberships`); das Feld wird in `users.ts` auf `AppUser.role` gemappt und von keinem Code zur Autorisierung ausgewertet (der einzige `appUser`-Konsument ist `firstName` im Dashboard). Die `role`-Anzeige im Profil kommt aus Mock-Profildaten.

### 1.1 Aktuelle Rules im Überblick

| Bereich | Heutige Regel |
|---|---|
| `userMemberships/{uid}` | eigener `get`, kein `list`, kein Client-Write ✅ |
| `users/{uid}` | eigener `get`; Create nur Basisprofil; Update nur `lastLogin`; kein Delete ✅ |
| 12 Company-Collections | `allow read, write: if belongsToCompany(companyId)` – **jede** Operation für **jedes** aktive Mitglied ⚠ |
| `companies/{companyId}` (Stammdokument), `integrations`, `webhooks`, `auditLog`, `users/*/aiChats` | keine Rules → per Fallback komplett gesperrt (kein Service dafür) |

### 1.2 Was ein „Gast“ heute per SDK kann (Beispiele)

- jede Probe/jeden Kunden/jedes Projekt/jeden Bericht/jedes Laborbuch-/Kalender-Dokument **löschen** (`removeSample`, `bulkRemoveSamples`, `removeReport`, … existieren; `DeleteSampleDialog` verspricht „Azubis dürfen nicht löschen“, **nichts** erzwingt es),
- `roles/{id}` ändern oder löschen (auch `admin`), neue Rollen mit beliebigen Rechten anlegen,
- jeden Mitarbeiter sperren, `roleId` ändern, Standorte ändern/deaktivieren,
- Einladungen anlegen (auch mit `status: "Angenommen"`, denn die Rules prüfen keine Form) oder widerrufen.

---

## 2. Permission-Key-Inventar (Audit-Stand: 31 Keys; aktuell 45, siehe Abschnitt 14)

| Modul | Keys |
|---|---|
| dashboard | `dashboard.anzeigen` |
| proben | `proben.ansehen`, `.erstellen`, `.bearbeiten`, `.loeschen` |
| pruefungen | `pruefungen.ansehen`, `.erstellen`, `.bearbeiten`, `.loeschen` |
| kunden | `kunden.ansehen`, `.erstellen`, `.bearbeiten`, `.loeschen` |
| projekte | `projekte.ansehen`, `.erstellen`, `.bearbeiten`, `.loeschen` |
| geraete | `geraete.ansehen`, `geraete.bearbeiten` |
| laborbuch | `laborbuch.ansehen`, `laborbuch.bearbeiten` |
| kalender | `kalender.ansehen`, `kalender.termine_erstellen` |
| pdf | `pdf.exportieren` |
| ki | `ki.verwenden` |
| administration | `administration.mitarbeiter_verwalten`, `.rollen_verwalten`, `.standorte_verwalten`, `.branding_aendern`, `.abrechnung_verwalten`, `.systemeinstellungen_aendern` |

Die Taxonomie (welche Keys es gibt) ist Code, die Zuordnung pro Rolle liegt in `companies/{companyId}/roles/{roleId}.permissions` als Map `key → boolean`. Fehlende Keys gelten als `false` (`normalizePermissions`).

**Nicht an Collections gebunden (kein Firestore-Bezug heute):** `dashboard.anzeigen` (reine UI), `ki.verwenden` (`aiChats` nicht angebunden), `administration.branding_aendern`, `.abrechnung_verwalten`, `.systemeinstellungen_aendern` (Firmenstammdaten/Abrechnung/Einstellungen sind nicht angebunden).

## 3. Permission-Matrix der Rollen (Audit-Stand; aktuelle Matrix: `docs/database/permissions.md`)

| Recht | admin | laborleiter | pruefer | azubi | gast |
|---|:-:|:-:|:-:|:-:|:-:|
| dashboard.anzeigen | ✅ | ✅ | ✅ | ✅ | ✅ |
| proben.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| proben.erstellen / .bearbeiten | ✅ | ✅ | ✅ | ✅ | ❌ |
| proben.loeschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| pruefungen.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| pruefungen.erstellen / .bearbeiten | ✅ | ✅ | ✅ | ❌ | ❌ |
| pruefungen.loeschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| kunden.ansehen / projekte.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| kunden./projekte. erstellen, bearbeiten, loeschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| geraete.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| geraete.bearbeiten | ✅ | ✅ | ❌ | ❌ | ❌ |
| laborbuch.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| laborbuch.bearbeiten | ✅ | ✅ | ✅ | ❌ | ❌ |
| kalender.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| kalender.termine_erstellen | ✅ | ✅ | ✅ | ❌ | ❌ |
| pdf.exportieren | ✅ | ✅ | ✅ | ❌ | ❌ |
| ki.verwenden | ✅ | ✅ | ✅ | ✅ | ❌ |
| administration.mitarbeiter_verwalten | ✅ | ✅ | ❌ | ❌ | ❌ |
| administration.rollen_verwalten / .standorte_verwalten / .branding_aendern | ✅ | ✅ | ❌ | ❌ | ❌ |
| administration.abrechnung_verwalten / .systemeinstellungen_aendern | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Summe** | **31** | **29** | **16** | **11** | **8** |

Achtung, Abweichung zu `docs/database/permissions.md`: Dort steht „Rollen/Standorte verwalten nur Admin“. In der **aktuellen Config** hat der **Laborleiter** zusätzlich `rollen_verwalten`, `standorte_verwalten` und `branding_aendern` (ausgeschlossen sind nur Abrechnung und Systemeinstellungen). Das ist sicherheitsrelevant, siehe 7.

Custom Roles: `qualitaetsmanager` hat dieselben 16 Rechte wie `pruefer`, `baustellenleiter` hat 15 (u. a. `projekte.erstellen/.bearbeiten`).

---

## 4. Collection-Audit und Permission-Matrix

> **Aktualisiert:** Alle hier mit „⚠ Lücke“ markierten Schlüssel existieren jetzt (Abschnitt 14, Tabelle in `docs/database/permissions.md`, Abschnitt 5). Die Tabelle unten ist der Ausgangs-Audit.

Annahme: Auswertung über vorhandene Keys. **⚠ Lücke** = es gibt keinen passenden Key; der genannte Ersatz ist ein Vorschlag, die Entscheidung ist offen. „Archiv/Status“ nennt, was statt Löschen existiert.

### 4.1 Matrix (Read / Create / Update / Delete)

| Collection | Read | Create | Update | Delete |
|---|---|---|---|---|
| `customers` | `kunden.ansehen` | `kunden.erstellen` | `kunden.bearbeiten` (inkl. Status Aktiv/Inaktiv/Archiviert) | `kunden.loeschen` (Service vorhanden, **kein UI-Aufrufer**) → empfohlen: Rules verbieten, Archiv statt Löschen |
| `projects` | `projekte.ansehen` | `projekte.erstellen` | `projekte.bearbeiten` (Status pausieren/fortsetzen/abschließen/archivieren) | `projekte.loeschen` (Service vorhanden, **kein UI-Aufrufer**) |
| `devices` | `geraete.ansehen` | ⚠ Lücke `geraete.erstellen` (Ersatz: `geraete.bearbeiten`) | `geraete.bearbeiten` (Status/Archiv) | ⚠ Lücke `geraete.loeschen` → empfohlen: verbieten, Archiv statt Löschen |
| `samples` | `proben.ansehen` | `proben.erstellen` (inkl. Duplizieren) | `proben.bearbeiten` (starten/abschließen/wieder öffnen/archivieren) | `proben.loeschen` – **UI-Aufrufer** (Einzel + Bulk `writeBatch`) |
| `testValues` (Doc-ID = `sampleId`) | `pruefungen.ansehen` | `pruefungen.erstellen` | `pruefungen.bearbeiten` (Entwurf speichern, Ergebnis speichern, starten/abschließen/öffnen) | `pruefungen.loeschen` – **UI-Aufrufer** |
| `reports` | ⚠ Lücke `berichte.ansehen` (Ersatz: `pruefungen.ansehen`) | ⚠ Lücke `berichte.erstellen` (Ersatz: `pdf.exportieren`) | ⚠ Lücke `berichte.bearbeiten` (Ersatz: `pdf.exportieren`; Status Entwurf/Fertig/PDF/Excel/Archiviert) | ⚠ Lücke `berichte.loeschen` – **UI-Aufrufer** (Ersatz: `pruefungen.loeschen`, besser: verbieten + Archiv) |
| `calendarEvents` | `kalender.ansehen` | `kalender.termine_erstellen` | ⚠ Lücke `kalender.bearbeiten` (Ersatz: `kalender.termine_erstellen`) | ⚠ Lücke `kalender.loeschen` – **UI-Aufrufer** (Ersatz: `kalender.termine_erstellen`) |
| `laborbook` | `laborbuch.ansehen` | `laborbuch.bearbeiten` | `laborbuch.bearbeiten` (inkl. Archiv/Wiederherstellen) | ⚠ Lücke `laborbuch.loeschen` – **UI-Aufrufer**; fachlich ein Nachweisdokument → empfohlen: verbieten, Archiv |
| `locations` | ⚠ Lücke `standorte.ansehen` (Vorschlag: jedes aktive Mitglied; Mitarbeiter-/Einladungs-UI und Übersicht brauchen die Liste) | `administration.standorte_verwalten` | `administration.standorte_verwalten` (inkl. Deaktivieren/Reaktivieren, Hauptstandort) | verbieten (existiert nicht; Status statt Löschen) |
| `employees` | `administration.mitarbeiter_verwalten` **oder** eigenes Dokument (`membership.employeeId`) – ⚠ Lücke `mitarbeiter.ansehen` | **kein Client-Pfad** (Employees entstehen heute nur per Seed) → verbieten, nur Server (Annahme einer Einladung) | `administration.mitarbeiter_verwalten`, **aber** Feld `roleId`/`role` nur über `administration.rollen_verwalten` bzw. besser nur Server (siehe 6, 7) | verbieten (Status „Gesperrt“ statt Löschen) |
| `invitations` | `administration.mitarbeiter_verwalten` | `administration.mitarbeiter_verwalten` + Formprüfung (nur `status: "Ausstehend"`, kein `acceptedAt`) + Rolle der Einladung nur bis zur eigenen Stufe (siehe 7) | `administration.mitarbeiter_verwalten`, nur Übergang Ausstehend → Widerrufen (`status`, `revokedAt`, `updatedAt`); „Angenommen“ nur Server | verbieten (Widerruf statt Löschen) |
| `roles` | ⚠ Lücke `rollen.ansehen` (Vorschlag: jedes aktive Mitglied; Rollennamen und eigene Rolle werden angezeigt) | `administration.rollen_verwalten`, nur `type: "Benutzerdefiniert"`, `status: "Aktiv"` | `administration.rollen_verwalten`; Systemrollen nur `permissions` (außer `admin`: gar nicht), `type`/`id` unveränderlich | verbieten (Archivieren statt Löschen) |

### 4.2 Zusätzliche Collections (ohne Firestore-Anbindung heute)

| Collection | Bemerkung | Vorgesehene Permission |
|---|---|---|
| `companies/{companyId}` (Stammdokument) | Firmen-/Lizenz-/Abrechnungsdaten, keine Rules, kein Service | Lesen: aktives Mitglied; Schreiben: `branding_aendern` / `abrechnung_verwalten` / `systemeinstellungen_aendern`; **Abrechnung/Lizenz nur serverseitig** |
| `integrations`, `webhooks` | in `collections.ts`, kein Service | `administration.systemeinstellungen_aendern`; Secrets (API-Keys) nie client-lesbar |
| `auditLog` | in `collections.ts`, kein Service | Lesen: Admin; **Schreiben nur Server** (nie Client) |
| `users/{uid}/aiChats` | persönlich, nicht firmengebunden | nur eigener User (`ki.verwenden`) |

### 4.3 Querschnitts-Erkenntnisse

1. **Betroffene Collections:** 12 Company-Collections sind heute für jedes aktive Mitglied voll freigegeben. Davon haben **8** einen Hard-Delete im Service (`customers`, `devices`, `projects`, `reports`, `samples` inkl. Bulk, `testValues`, `laborbook`, `calendarEvents`), **5** davon sind per UI erreichbar (`samples`, `testValues`, `reports`, `laborbook`, `calendarEvents`). `employees`, `invitations`, `roles`, `locations` haben keinen Delete-Pfad im Client.
2. **Permission-Lücken (Schlüssel fehlt):** `geraete.erstellen`, `geraete.loeschen`, `kalender.bearbeiten`, `kalender.loeschen`, `laborbuch.loeschen`, der ganze Block `berichte.*` (ansehen/erstellen/bearbeiten/loeschen), sowie reine **Lese-Rechte für Verwaltungsdaten** (`standorte`, `mitarbeiter`, `rollen`). Das sind **9 Einzel-Lücken in 6 Bereichen** (Geräte, Kalender, Laborbuch, Berichte, plus Lese-Rechte Standorte/Mitarbeiter/Rollen). Bis zur Entscheidung gilt der jeweils genannte Ersatz oder „verbieten“.
3. **Hard-Delete:** Das Prinzip „Archiv/Status statt Löschen“ ist für jede Collection vorhanden. Wo kein `*.loeschen`-Key existiert, ist die sicherste Regel: **Delete verbieten**. Das bedeutet, dass die UI-Aktionen „Löschen“ für Berichte, Laborbuch und Kalender dann entfallen oder auf Archivieren/Status umgestellt werden müssen – eine fachliche Entscheidung.
4. **Datenintegrität fehlt:** Es gibt keine referenzielle Sperre bei Löschen (Service-TODOs), keine Status-Übergangsprüfung in Rules, keine Form-/Typprüfung. Reine CRUD-Permission-Rules lösen das nicht (siehe 9).

### 4.4 Abhängigkeiten zwischen Collections (Reads)

Dialoge laden andere Collections. Eine Rolle muss diese Lese-Rechte **mitbringen**, sonst bricht die Funktion, obwohl das eigene Recht gewährt ist:

| Funktion | liest zusätzlich |
|---|---|
| Probe anlegen (`NewSampleDialog`) | `projects`, `customers` |
| Projekt anlegen (`NewProjectDialog`) | `customers` |
| Bericht anlegen (`NewReportDialog`) | `samples` |
| Laborbuch-Eintrag (`NewLaborbookEntryDialog`) | `samples`, `projects`, `customers`, `devices` |
| Kalender-Aufgabe (`NewCalendarTaskDialog`) | `samples` |
| Prüfungen-Seite | `samples`, `reports` |
| Einladung anlegen | `employees` (Duplikat-Check), `roles` |
| Mitarbeiter-/Einladungs-/Rollen-Tab | `roles`, `locations`, `employees`, `invitations` |

Die System- und Beispielrollen erfüllen das (jede Rolle mit Erstellrecht hat `*.ansehen` der Abhängigkeiten). **Custom Roles können es verletzen.** Empfehlung: UI-Hinweis im Rollen-Editor („für X ist zusätzlich Y nötig“), keine automatische Rules-Magie.

---

## 5. Architekturvarianten

Alle Varianten setzen voraus: **Membership (`userMemberships/{uid}`) ist die vom Client nicht beschreibbare Zuordnung** (bereits umgesetzt).

### A) Rules lesen das Role-Dokument

`userMemberships/{uid}.roleId` → `companies/{companyId}/roles/{roleId}` → `permissions["<key>"]`.

Skizze (**nicht implementiert**, Syntax gegen den Emulator zu verifizieren):

```
function membership() { return get(/databases/$(database)/documents/userMemberships/$(request.auth.uid)).data; }
function rolePermissions(companyId) {
  return get(/databases/$(database)/documents/companies/$(companyId)/roles/$(membership().roleId)).data.permissions;
}
function can(companyId, key) {
  return belongsToCompany(companyId) && rolePermissions(companyId).get(key, false) == true;
}
```

| Kriterium | Bewertung |
|---|---|
| Sicherheit | Gut. Maßgeblich ist ein serverseitig kontrolliertes Dokument (Membership) plus das Rollen-Dokument; `roleId` kommt nie vom Client. Fail-closed bei fehlender Rolle/Membership (`get` auf nicht vorhandenes Dokument → Fehler → Deny). Der Pfad nutzt dieselbe `companyId` wie die Zielressource, damit eine Rolle einer **fremden** Firma nie greift. |
| Custom Roles | Voll unterstützt: jede Permission-Kombination, kein Rollenname in den Rules. |
| Aktualität | **Sofort.** Rollen- und Membership-Änderungen wirken bei der nächsten Anfrage; keine Token-Staleness, kein Fan-out. |
| Archivierte Rollen | *Audit-Empfehlung:* Rules ignorieren `status`. **Phase 1 entscheidet anders:** `status != "Aktiv"` gewährt keine Rechte (Abschnitt 15). |
| Rules-Limits | pro Anfrage 2 distinkte Dokumentzugriffe (Membership + Rolle), bei Spezialfällen 3 (Einladung mit Rolle, Mitarbeiter-Check). Nach aktueller Firebase-Dokumentation liegen die Limits bei 10 (Einzelzugriffe/Queries) bzw. 20 (Mehrfach-Writes, Transaktionen); mehrfach referenzierte Dokumente zählen einmal. **Vor Umsetzung im Emulator verifizieren.** Keine Schleifen in Rules → keine Mengenvergleiche („hat Rolle ≥ Rolle des anderen“). |
| Kosten/Performance | Jede Rules-Auswertung mit `get()`/`exists()` wird als **Dokument-Read abgerechnet**; hier typischerweise +2 pro Request (pro Query einmal, nicht pro Ergebnisdokument; Batch/Bulk-Writes nutzen den Cache der Anfrage). Das entspricht der heutigen Last (+1 Membership). Latenzzuschlag klein. |
| Konsistenz | Die Rollen-Permission-Map wird **live** gelesen – es gibt nichts zu synchronisieren außer `Membership.roleId` selbst. |
| Risiken | `rollen_verwalten` ist faktisch Superuser (wer Rollen ändern darf, kann sich über eine eigene Rolle alles geben) → die Rolle-Schreibregeln müssen eng sein (Abschnitt 7). Rules werden länger/komplexer und brauchen automatisierte Tests. |

### B) Permission-Snapshot in der Membership

`userMemberships/{uid}` enthält zusätzlich `permissions`.

| Kriterium | Bewertung |
|---|---|
| Rules | Sehr einfach (1 Dokumentzugriff), billig. |
| Synchronisation | **Fan-out-Problem:** jede Änderung einer Rolle muss in **alle** Memberships dieser Rolle geschrieben werden. Das geht nur serverseitig (Cloud Function/Admin SDK), da Memberships kein Client-Write haben dürfen. |
| Staleness | Fällt der Fan-out aus (Funktionsfehler, Teilfehlschlag), bleiben **entzogene Rechte aktiv**. Das ist die gefährlichste Fehlerrichtung. |
| Rollenänderung/Membership-Updates | Brauchen jeweils Server-Logik. Größere Dokumente (31 Booleans) pro User. |
| Angriffsfläche | Membership wird noch kritischer (enthält alle Rechte). Provisionierung muss serverseitig robust sein. |
| Fazit | Nur sinnvoll, wenn Rules-Kosten ein Problem wären – das sind sie bei +1 Read nicht. Schlechtere Konsistenz bei höherer Server-Abhängigkeit. |

### C) Firebase Custom Claims

Rolle/Permissions im ID-Token.

| Kriterium | Bewertung |
|---|---|
| Rules | Sehr günstig (kein `get()`), `request.auth.token.<claim>`. |
| Admin SDK | **Zwingend erforderlich** (Claims nur serverseitig setzbar) – im Projekt existiert bisher keinerlei Server-Komponente. |
| Token-Staleness | Claims ändern sich erst nach Token-Refresh (bis ~1 h oder erzwungener Refresh). Entzug/Sperrung wirkt **verzögert**, es sei denn man widerruft Refresh-Tokens und lädt Clients neu. Für „Sperren“ nicht akzeptabel ohne Zusatzmaßnahmen. |
| Größe | Claims-Payload ≤ 1000 Byte. Eine volle Permission-Map ist dafür zu groß/starr; man müsste Permission-IDs oder Bitmasken kodieren – und die Zuordnung Rolle → Bits ist wieder Daten. |
| Custom Roles | Schwierig: Jede Rollenänderung erfordert, alle betroffenen Nutzer-Claims neu zu setzen (Fan-out wie B, plus Token-Refresh). |
| Fazit | Ungeeignet als alleinige Quelle für ein System mit Custom Roles. Sinnvoll höchstens für sehr grobe, selten wechselnde Flags. |

### D) Mischmodell (empfohlen)

- **Membership** (`userMemberships/{uid}`, serverseitig geschrieben): `companyId`, `roleId`, `status` (+ `employeeId`). Autoritativ für **wer** der User ist und **welche** Rolle er hat.
- **Role-Dokument** (`companies/{companyId}/roles/{roleId}`): `permissions`, **live** per `get()` in den Rules ausgewertet (= Mechanismus von A).
- **Claims**: nicht jetzt. Später optional für grobe Flags (z. B. `companyId`-Kurzcheck), nie für Permissions.

## 6. Empfehlung

**Empfohlen wird Variante D mit dem Auswertungsmechanismus von A.**

Warum:
1. Es ist die einzige Variante, die **Custom Roles ohne Fan-out** und mit **sofortiger Wirkung** (auch bei Sperre/Entzug) unterstützt.
2. Sie braucht **keine Claims** und für den Betrieb keinen Server; ein Backend wird nur für Provisionierung/Rollenzuweisung gebraucht (Abschnitt 8).
3. Kosten und Rules-Limits sind unkritisch (2–3 Dokumentzugriffe).
4. Sie lässt sich **schrittweise** einführen (zuerst kritische Collections).

### 6.1 Autoritative Quelle (Entscheidung)

| Frage | Quelle für Autorisierung |
|---|---|
| Wer ist der User / welche Firma? | `userMemberships/{uid}.companyId` + `status == "Aktiv"` |
| Welche Rolle hat der User? | **`userMemberships/{uid}.roleId`** |
| Was darf die Rolle? | **`roles/{roleId}.permissions`** (live) |
| Anzeige „Rolle des Mitarbeiters“ | `Employee.roleId`/`role` (Verwaltungs-/Anzeigedaten, **nicht** autoritativ) |
| `users/{uid}.role`, Snapshot-Namen (`role`) | nie autoritativ |

### 6.2 Fälle (Soll-Verhalten)

| Fall | Soll |
|---|---|
| Employee-Rolle in der UI geändert, Membership nicht | **Das Problem.** Die UI-Aktion darf für Rollen nicht mehr rein clientseitig sein. Entweder (a) Server-Operation `assignRole`, die Employee **und** Membership in einer Transaktion schreibt (empfohlen), oder (b) bis dahin ehrliche UI-Kennzeichnung: „Anzeige-Rolle; der Zugriff folgt der Membership“. |
| Rolle archiviert | *Audit-Empfehlung:* Rechte bleiben für bestehende Zuweisungen. **Phase 1:** archivierte Rolle = keine Rechte (Abschnitt 15); die UI warnt/blockiert noch nicht beim Archivieren zugewiesener Rollen (Folgeaufgabe). |
| Rolle gelöscht | Soll nie vorkommen: Rules verbieten `delete` auf `roles` für Clients. Falls doch (Admin-Skript): Membership mit unbekannter Rolle ⇒ **fail-closed**. |
| Membership zeigt auf unbekannte/leere Rolle | Kein Zugriff auf rollengeschützte Collections (die Auswertung wirft → Deny). Bestehende Provisionierung muss `roleId` verpflichtend setzen. |
| Rolle umbenannt | Snapshots werden nicht automatisch nachgezogen; Anzeige löst über `roleId` auf (heute schon). |
| Mitarbeiter gesperrt (`Employee.status`) | Hat **keine** Wirkung auf den Zugriff. Wirksam ist nur `Membership.status`. Optionale Absicherung als reines Deny-Gate: Rules prüfen zusätzlich `employees/{membership.employeeId}.status != "Gesperrt"` (siehe 9, Slice-Vorschlag). |

---

## 7. Kritische Admin-Aktionen

Heute prüft **nichts** davon serverseitig. „Server“ heißt hier: Rules (R) oder Admin-SDK-Backend (S).

| Aktion | Risiko | Heutiger Schutz | Nötiger Schutz |
|---|---|---|---|
| Rolle ändern (Custom) | wer `rollen_verwalten` hat, kann jede Rolle (auch die eigene) hochstufen ⇒ **Privilege Escalation** | nur Client-Regeln | R: nur `rollen_verwalten`; `type`/`id` unveränderlich; `rollen_verwalten` sollte als **Superuser-Recht** behandelt und nur der Admin-Rolle gegeben werden (aktuell hat es auch der Laborleiter ⚠) |
| Administrator-Rolle ändern | zerstört die Sicherheitsgrundlage (Sperrt Admins aus / entfernt `rollen_verwalten`) | nur Client (`arePermissionsEditable`) | R: `roles/admin` komplett unveränderlich (kein Update, kein Delete); Änderung nur per Server/Operator-Skript |
| Systemrolle umbenennen/archivieren/`type` ändern | Systemrollen brechen, Zuordnungen kippen | nur Client | R: bei `resource.data.type == "System"` nur `permissions` änderbar (nicht `admin`), `type` nie |
| Rolle löschen | Memberships/Employees zeigen ins Leere ⇒ Zugriff verloren | kein Client-Pfad, aber Rules erlauben es | R: `delete` auf `roles` nie |
| Rolle archivieren | Zugewiesene verlieren evtl. Funktionalität in der UI | nur UI-Zusage | Rules: keine Wirkung; UI-Warnung |
| Rolle einem Mitarbeiter zuweisen (`roleId`) | **Self-Promotion** (Laborleiter setzt sich `admin`), oder Admin-Eskalation durch Laborleiter | keiner | S: `assignRole` mit Prüfung `rollen_verwalten`, **nicht** für sich selbst, **nicht** die letzte Admin-Rolle entziehen; R: Client-Write auf `employees.roleId`/`role` verbieten |
| Mitarbeiter sperren | Lock-out von Admins durch Laborleiter; Sperre wirkt nicht auf Membership | keiner | S/R: Sperren des Administrators nur mit `rollen_verwalten`; wirksame Sperre über Membership-Status (Server) und/oder Deny-Gate |
| Membership sperren/entsperren/anlegen | **Der** Hebel der Zugriffskontrolle | Client-Write verboten ✅ | S: nur Admin SDK; Konsistenz mit Employee-Status; Audit |
| Einladung erzeugen | Einladung mit Rolle `admin` oder mit `rollen_verwalten` ⇒ Eskalation über die Hintertür | keiner | R: Einladung mit Rolle, die `rollen_verwalten`/`mitarbeiter_verwalten` enthält, nur mit `rollen_verwalten`; Formprüfung (`status == "Ausstehend"`); Annahme nur Server |
| Einladung widerrufen | geringes Risiko | nur Client | R: nur `mitarbeiter_verwalten`, nur Statusübergang |
| Letzten Admin entfernen/sperren | Firma ohne Administrator | keiner | S: Invariante „mindestens ein aktiver Admin“ (nicht in Rules prüfbar, da keine Zählung); Break-Glass-Skript |
| Hard-Delete von Fachdaten | unwiederbringlicher Datenverlust, Azubi-Regel umgehbar | nur UI-Hinweis | R: `delete` nur mit `*.loeschen`; wo kein Key existiert verbieten |

**Besonders serverseitig zu schützen (S, nicht nur Rules):** Rollenzuweisung, Membership-Änderungen, Annahme von Einladungen/Employee-Erstellung, Entfernen/Sperren des letzten Admins, jegliche Firmen-Anlage.

---

## 8. Bootstrap-Problem

**Ausgangslage:** Sobald Rollen-/Membership-Writes geschützt sind, kann kein Client mehr den ersten Admin erschaffen – das ist gewollt. Es gibt heute auch keinen Provisionierungsweg (siehe Frage 13).

**Muss pro neuer Firma angelegt werden:** `companies/{companyId}` (Stammdokument), die 5 Systemrollen (mit stabilen IDs), mindestens einen Standort (optional), das Employee-Dokument des ersten Admins, `userMemberships/{adminUid}` (`companyId`, `employeeId`, `roleId: "admin"`, `status: "Aktiv"`) und den zugehörigen Firebase-Auth-Benutzer.

### Bewertete Wege

| Weg | Bewertung |
|---|---|
| **Manuelle Konsolen-Provisionierung** (frühe Dev-/Pilotphase) | Akzeptabel, solange es wenige Firmen gibt. Operator legt Auth-User, Firmen-/Rollen-/Employee-/Membership-Dokumente in der Firebase-Konsole an (Rollen via Skript/Emulator-Seed ableitbar). Fehleranfällig, nicht auditierbar, aber **sicher** (nur Projekt-Owner kann es). |
| **Admin-SDK-Provisioning-Skript** (Operator lokal, Service-Account außerhalb des Repos) | **Empfohlen als nächster Schritt.** Ein CLI-Skript `createCompany` legt alles atomar (Batch) an, ist idempotent, schreibt kein Secret ins Repo und ist Break-Glass-Werkzeug (z. B. Admin wiederherstellen). Kein neuer Client-Pfad. |
| **Vertrauenswürdiges Backend (Cloud Function)** | Mittelfristig nötig für `acceptInvitation`, `assignRole`, Membership-Änderungen und ggf. Self-Service-Onboarding. Braucht einen **Vertrauensanker** für „wer darf eine Firma gründen“ (z. B. Zahlungs-Webhook, vom Operator ausgestellter einmaliger Setup-Code, serverseitige Allowlist). |

### Ausdrücklich ausgeschlossen

- „Wenn keine Admins existieren, mache den aktuellen User zum Admin“ (Race, Erstbesetzung durch Angreifer, nicht prüfbar in Rules).
- Ein Client-seitig erzeugbares Membership-Dokument für den ersten User.
- Rules-Ausnahmen wie „`companies/{id}` existiert nicht ⇒ jeder darf schreiben“.
- Selbstzuweisung der Rolle über Employee-Dokumente.

### Mindestanforderungen an Provisionierung

1. nur Admin SDK / Operator; 2. ausdrückliche Firmen-ID; 3. Rollen immer **vor** der Membership anlegen (Fail-closed-Reihenfolge); 4. Membership erst als letzter Schritt und mit `roleId`; 5. Invariante „≥ 1 aktiver Admin“ beim Anlegen und bei späteren Änderungen; 6. Protokollierung.

---

## 9. Synchronitätsprobleme (Zusammenfassung)

1. **`Membership.roleId` ≠ `Employee.roleId`:** keine Synchronisation, kein Mechanismus. Lösung: Zuweisung nur noch über eine Server-Operation, die beides atomar schreibt; Rules verbieten Client-Änderungen von `employees.roleId`/`role`.
2. **`Employee.status = "Gesperrt"` ≠ `Membership.status`:** UI-Sperre wirkt nicht. Lösung: Server-Operation `setMemberStatus` (schreibt beides). Zusätzlich optional ein **Deny-only-Gate** in den Rules (`employees/{membership.employeeId}.status != "Gesperrt"`), das nur Zugriff **entziehen** kann; Nachteil: `employeeId` wird Pflicht, +1 Dokumentzugriff.
3. **Rollenname-Snapshots** veralten bei Umbenennung (kosmetisch; Auflösung per `roleId`).
4. **Referenzen ohne Fremdschlüssel:** `roleId` kann ins Leere zeigen ⇒ fail-closed + Provisionierungs-Validierung.
5. **Employee ohne Membership / Membership ohne Employee:** beides möglich (Legacy). Autorisierung hängt nur an der Membership.
6. **Mehrfachabhängigkeit von Rechten** (4.4): Custom Roles können sich selbst funktionsunfähig machen; Rules ändern daran nichts.

---

## 10. Migration / nächste Schritte

Reihenfolge (jeweils eigener Slice, mit Emulator-Tests):

1. **Rules-Testinfrastruktur.** `@firebase/rules-unit-testing` + Emulator (Java), Testfälle je Collection × Rolle × Operation, CI-Lauf. **Voraussetzung für alles Weitere** *(Audit-Stand; inzwischen erledigt: Rules-Test-Infrastruktur existiert und läuft lokal mit Java, siehe `docs/firebase/firestore-rules-testing.md`).*
2. **Permission-Taxonomie schließen.** Entscheidung über die Lücken aus 4.3 (`geraete.erstellen/loeschen`, `kalender.bearbeiten/loeschen`, `laborbuch.loeschen`, `berichte.*`, Lese-Rechte) **oder** bewusste Verwendung der Ersatz-Zuordnung bzw. „Delete verbieten“. Migration bestehender Rollen-Dokumente (neue Keys default `false` → gezielt für Systemrollen setzen, `normalizePermissions` fängt Fehlendes ab). `docs/database/permissions.md` aktualisieren.
3. **UI-Gating (`usePermissions()`)** *(erledigt, siehe `docs/firebase/ui-permission-gating.md`)* aus `membership.roleId` + Rollen-Dokument (Live-Listener): Buttons/Menüs/Seiten gemäß Rechten ausblenden (Komfort, keine Sicherheit). Macht Rollenfehlkonfigurationen früh sichtbar und entfernt/ersetzt die UI-Hard-Deletes, die künftig nicht mehr erlaubt sind.
4. **Rules Phase 1: Verwaltungs-Collections** (`roles`, `employees`, `invitations`, `locations`) – dort ist das Risiko am höchsten (Eskalation). Enthält: Rollen-Invarianten, Feld-Schutz (`roleId`/`role`), Formprüfung der Einladung, Delete-Verbot.
5. **Backend-Slice (Admin SDK):** `assignRole` und `setMemberStatus` (inkl. „≥ 1 Admin“) sind umgesetzt und die UI-Aktionen „Rolle ändern/Mitarbeiter sperren“ nutzen sie *(`docs/firebase/member-security-actions.md`)*. Offen: `createCompany`-Skript und `acceptInvitation`.
6. **Rules Phase 2: Fachcollections** (`customers`, `projects`, `devices`, `samples`, `testValues`, `reports`, `calendarEvents`, `laborbook`) mit `can(...)` je Operation, Delete-Regeln, Cross-Read-Prüfung.
7. **Daten-/Statusvalidierung** in Rules (Pflichtfelder, Status-Übergänge, unveränderliche Felder `createdAt`/ID) und **Audit-Log** (nur Server schreibt).
8. Weitere Collections (`companies`-Stammdokument, `integrations`, `webhooks`, `aiChats`) bei Anbindung.

**Rollout-Hinweis:** Rules haben keinen Dry-Run. Phasenweise ausrollen, jede Phase vorher im Emulator gegen die Rollen-Matrix testen, und ein Rollback-Stand der Rules bereithalten.

---

## 11. Größte Risiken (auch nach der empfohlenen Architektur)

1. **`rollen_verwalten` ist ein Superuser-Recht.** Rules können nicht prüfen, ob eine Rolle „höher“ als eine andere ist. Gegenmaßnahme: nur Administrator (aktuell hat es auch der Laborleiter – bewusste Entscheidung nötig), Administrator-Rolle unveränderlich.
2. **Fehlende Server-Komponente.** Ohne Backend gibt es weder Bootstrap noch atomare Rollenzuweisung noch Einladungsannahme; bis dahin bleiben Manuelle Provisionierung und die Divergenz Employee ↔ Membership.
3. **Falsche Sicherheit durch UI.** Solange Rules nicht erzwingen, ist jede UI-Sperre umgehbar (siehe 1.2).
4. **Rules-Komplexität und -Tests.** Ohne Emulator-Tests ist ein fehlerhaftes Deny/Allow wahrscheinlich; ein Fehler kann alle Nutzer aussperren.
5. **Keine Datenintegrität** (Referenzen, Statusübergänge, Pflichtfelder) – reine Permission-Rules lösen das nicht.
6. **Hard-Deletes** bleiben bis zu den Rules-Phasen aktiv (Samples, Prüfungen, Berichte, Laborbuch, Kalender per UI erreichbar).
7. **Kosten:** +2 Reads pro Request durch `get()` (heute +1). Bei Bulk-Writes und großen Listen prüfen.

## 12. Offene Fragen (Entscheidung nötig)

> **Stand nach dem Taxonomie-Slice:** Frage 1 (Laborleiter), 3 (Berichte-Keys), 4 (Hard-Delete), 5 (Geräte/Kalender/Laborbuch-Keys) und 6 (Lese-Rechte) sind **entschieden** (Abschnitt 14). Frage 2 ist teilweise entschieden: Zuweisung durch `mitarbeiter_verwalten`, aber nicht für Rollen mit Restricted-Schlüsseln und nie für die eigene Rolle. Offen bleiben 7–12.


1. **Laborleiter und `rollen_verwalten`/`standorte_verwalten`/`branding_aendern`:** In der Config gewährt, im Planungsdokument als „nur Admin“ beschrieben. Soll der Laborleiter das behalten?
2. **Wer darf Rollen zuweisen?** Nur Administrator (`rollen_verwalten`) – oder auch `mitarbeiter_verwalten` für begrenzte Rollen? (Rules können Stufen nicht vergleichen.)
3. **Berichte:** Eigene `berichte.*`-Keys oder Zuordnung zu `pruefungen.*`/`pdf.exportieren`?
4. **Hard-Delete:** Soll es ihn für Berichte, Laborbuch, Kalender überhaupt geben? (Vorschlag: nein, Archiv/Status.)
5. **Geräte/Kalender/Laborbuch:** eigene `erstellen`/`loeschen`-Keys oder Zusammenfassung unter `bearbeiten`?
6. **Lese-Rechte für Verwaltungsdaten** (Rollen, Standorte, Mitarbeiter): jedes aktive Mitglied oder nur Verwaltungsrollen? Konsequenz für die Company-Seite von Nicht-Admins (Mitarbeiter-Tab würde ohne Leserecht leer/gesperrt sein).
7. **Gast-Zugriff auf Mitarbeiter-PII** (E-Mail, Telefon, Historie): erlaubt oder nicht?
8. **Employee-Status als Zugriffs-Gate** (Deny-only-Gate, siehe 9) einführen oder allein auf Server-Operationen setzen?
9. **`employeeId` in der Membership verpflichtend machen?** Nötig für das Deny-Gate und für „eigenes Mitarbeiterdokument lesen“.
10. **Wer ist der Vertrauensanker für Firmen-Gründung** (Operator, Zahlung, Setup-Code)?
11. **Mehrere Firmen pro User** (aktuell 1:1 Membership pro UID)? Würde das Modell (Membership-ID) ändern.
12. **Audit-Log:** Pflicht für kritische Aktionen (Abschnitt 7)? Wann?

---

## 13. Ergebnis in einem Satz

Die Rollen-/Permission-Struktur ist fachlich gut modelliert, aber **vollständig unwirksam**; empfohlen ist **Membership (server-geschrieben) als Zuordnung + Role-Dokument (live per `get()`) als Permissions** (Variante D/A), eingeführt in Phasen – **zuerst** Testinfrastruktur und Taxonomie-Entscheidung, **dann** Verwaltungs-Collections, **parallel** ein Admin-SDK-Backend für Bootstrap, Rollenzuweisung und Membership-Pflege.

---

## 14. Update: Taxonomie geschlossen (Slice „Permission-Taxonomie schließen“)

Dieser Abschnitt beschreibt, was sich nach dem Audit geändert hat. Die vollständige Policy, Matrix und Begründungen stehen in `docs/database/permissions.md`; die Konfiguration in `src/config/roles.ts` ist durch `tests/config/permissions.test.ts` (`npm run test:permissions`) abgesichert. **Es wurde keine Durchsetzung eingebaut** (`firestore.rules` unverändert, Services unverändert).

### 14.1 Lücken aus 4.3 → entschieden

| Lücke | Ergebnis |
|---|---|
| `geraete.erstellen`, `geraete.loeschen` | neue Schlüssel |
| `kalender.bearbeiten`, `kalender.loeschen` | neue Schlüssel (`kalender.termine_erstellen` bleibt als Legacy-Name für „erstellen“) |
| `laborbuch.loeschen` (+ `laborbuch.erstellen`) | neue Schlüssel; Erstellen getrennt von Bearbeiten, damit Einträge append-only vergeben werden können |
| `berichte.ansehen/erstellen/bearbeiten/loeschen` | neue Schlüssel; `pdf.exportieren` bleibt die Export-**Aktion** |
| Lesen von Standorten/Mitarbeitern/Rollen | neue Schlüssel `standorte.ansehen`, `mitarbeiter.ansehen`, `rollen.ansehen` |
| Superuser-Grenze | neuer Schlüssel `rollen.admin_verwalten` (nur Administrator) |
| Einladungen | kein eigener Schlüssel; `administration.mitarbeiter_verwalten` (Lesen und Schreiben) |

**31 → 45 Schlüssel**, 14 neu, **kein bestehender Schlüssel entfernt oder umbenannt**.

### 14.2 Auswirkungen auf die Audit-Aussagen

- **Frage 6 (Matrix):** aktuell Administrator 45 · Laborleiter 38 · Prüfer 22 · Azubi 13 · Gast 9 (statt 31/29/16/11/8).
- **Abschnitt 3, Abweichung „Laborleiter hat zusätzlich rollen_verwalten/standorte_verwalten/branding_aendern“:** aufgelöst – Laborleiter behält `standorte_verwalten` und `rollen_verwalten` (jetzt **begrenzt**: keine Administrator-Rolle, keine Restricted-Schlüssel, keine Admin-Zuweisung), verliert `branding_aendern` (nur Administrator).
- **Abschnitt 7 (kritische Aktionen):** `rollen_verwalten` ist durch die Trennung zu `rollen.admin_verwalten` kein Superuser-Recht mehr; die Superuser-Schlüssel sind eine feste, prüfbare Liste (`RESTRICTED_PERMISSION_KEYS`: `rollen.admin_verwalten`, `administration.branding_aendern`, `.abrechnung_verwalten`, `.systemeinstellungen_aendern`). Zuweisung/Einladung mit Administrator- oder Restricted-Rollen erfordert `rollen.admin_verwalten`; niemand ändert die eigene Rolle.
- **Abschnitt 4.3 Punkt 3 (Hard-Delete):** für jeden Bereich gibt es jetzt `*.loeschen` (8 destructive-Schlüssel). **Geräte, Laborbuch und Berichte** dürfen nur vom Administrator endgültig gelöscht werden; Proben, Prüfungen, Kunden, Projekte, Kalender zusätzlich vom Laborleiter. Empfehlung für die Rules-Phase: Löschen nur archivierter Datensätze.
- **Abschnitt 11 Risiko 1 (`rollen_verwalten` ist Superuser):** abgeschwächt, nicht erledigt – es bleibt eine **kritische, begrenzte** Berechtigung; die Begrenzung existiert bisher nur als Policy/Config und muss in den Rules und im Server umgesetzt werden.

### 14.3 Neue Voraussetzung für die Durchsetzung: Migration der gespeicherten Rollen

Gespeicherte Rollen-Dokumente kennen die 14 neuen Schlüssel nicht (fehlend = `false`). **Vor** rollenbasierten Rules müssen die Systemrollen auf die neue Matrix migriert werden (Details: `docs/database/permissions.md`, Abschnitt 7); sonst wären auch Administratoren in den Rules ohne `berichte.*`, `standorte.ansehen` usw. Ein Konsistenz-Check „gespeicherte Systemrollen = Config-Matrix“ gehört in den Rules-Slice (Test gegen Emulator-Daten).

---

## 15. Update: Rules Phase 1

Für `roles`, `employees`, `invitations` und `locations` sind rollenbasierte Rules implementiert (Architektur: Membership.roleId → Role-Dokument → `permissions[key]`, Variante D/A aus Abschnitt 6). Details, Verhalten pro Collection, Restricted-/Administrator-Schutz, Self-Promotion-Schutz, Einschränkungen und die **Migrationspflicht vor dem Deployment**: `docs/firebase/role-permission-rules-phase1.md`. **Status: Rules und Emulator-Tests sind umgesetzt; `npm run test:rules` lief lokal vollständig grün (698 von 698); die danach ergänzte Regel „nur bekannte Permission-Schlüssel“ (13 weitere Tests, insgesamt 711) ist noch lokal zu bestätigen.**

Gegenüber den Empfehlungen oben gilt in Phase 1 bewusst: **archivierte Rollen verlieren sofort ihre Rechte** (Abschnitt 6.2 empfahl das Gegenteil) – alle Zugewiesenen verlieren den Zugriff auf die vier Verwaltungscollections, das UI-Versprechen „Bestehende Zuweisungen bleiben erhalten“ ist überholt, ein UI-Umbau steht aus; **geschützte Rollen-Permissions:** neben den 4 Restricted-Schlüsseln erfordern auch die drei Admin-only-Löschrechte (`geraete.`, `laborbuch.`, `berichte.loeschen`) `rollen.admin_verwalten` beim Anlegen/Ändern von Rollen; die acht Fach-Collections sind noch nicht umgestellt; die Mitarbeiter-/Membership-Divergenz (Abschnitt 9) besteht weiter.
