# Rollenbasierte Firestore Rules – Phase 1 (roles · employees · invitations · locations)

Status: **Rules und Emulator-Tests sind implementiert; `npm run test:rules` wurde lokal mit Java ausgeführt und bestand vollständig (698 von 698, 0 Fehler).** Danach kamen die Regel „nur bekannte Permission-Schlüssel“ (Abschnitt 4) und 13 weitere Tests hinzu (**insgesamt 711**); der lokale Emulator-Lauf bestand vollständig (711 von 711, 0 Fehler, auch nach dem UI-Gating-Slice mit unveränderter `firestore.rules`). Deployment erst nach der Migration der gespeicherten Rollen (Abschnitt 6).

Phase 1 schaltet serverseitige Permission-Prüfung **ausschließlich** für diese vier Collections scharf. Die acht übrigen Company-Collections (`customers`, `projects`, `devices`, `samples`, `testValues`, `reports`, `calendarEvents`, `laborbook`) prüfen unverändert nur „aktive Membership der richtigen Firma“ (`belongsToCompany`). Das Policy-Modell steht in `docs/database/permissions.md`, die Analyse in `docs/firebase/role-security-audit.md`.

> **UI-Gating** (`usePermissions()`) ist inzwischen als eigener Slice umgesetzt: `docs/firebase/ui-permission-gating.md`.
>
> **Nicht Teil von Phase 1:** Membership-Schreiblogik, Admin SDK, Membership↔Employee-Synchronisierung, Einladungsannahme, Custom Claims. **Eine Änderung von `employees.roleId` ändert die wirksame Rolle (Membership) weiterhin nicht.**

---

## 1. Architektur

```
request.auth.uid
  └─ userMemberships/{uid}                    (nur Server schreibt)
        companyId · status "Aktiv" · roleId   ← maßgeblich ist NUR roleId
        └─ companies/{companyId}/roles/{roleId}
              status "Aktiv" · permissions { "<key>": true | false, … }
```

Nicht ausgewertet werden `users/{uid}.role` und der Snapshot `membership.role`. Die Tests setzen den Snapshot bei **allen** Personas bewusst auf „Administrator“, um zu belegen, dass er ignoriert wird.

### Rules-Helfer (`firestore.rules`)

| Funktion | Aufgabe |
|---|---|
| `membershipPath()` / `currentMembership()` | Pfad bzw. Daten von `userMemberships/{uid}` (nur nach vorhandener Membership) |
| `hasActiveMembership(companyId)` | angemeldet · Membership existiert · `companyId` stimmt · `status == "Aktiv"` (`belongsToCompany` ist ein unveränderter Alias) |
| `currentRoleId()` / `rolePath(companyId, roleId)` | `membership.roleId` bzw. Pfad des Rollen-Dokuments **derselben Firma** |
| `roleGrants(roleData, key)` | `"permissions" in roleData && roleData.permissions.get(key, false) == true` – nur exakt `true` gewährt |
| `hasPermission(companyId, key)` | Gesamtprüfung (siehe unten) |
| `roleHasRestrictedKey(roleData)` | enthält die Rolle einen Restricted-Schlüssel (`== true`)? |
| `restrictedKeyChanged(new, old)` | hat sich der **wirksame** Wert eines Restricted-Schlüssels geändert (fehlend == `false`)? |
| `roleIdIsProtected(companyId, roleId)` | Administrator-Rolle, Rolle mit **irgendeinem der 7 geschützten Schlüssel** (System-, Custom- oder archivierte Rolle), **oder nicht auflösbar** (fehlend/leer/kein String/unbekannt) → fail-closed |
| `isSystemRoleId(roleId)` | die fünf Systemrollen-IDs |
| `isOwnEmployee` / `isOwnRole` / `changesOwnSecurityFields` / `isValidRoleUpdate` | eigene Dokumente, Self-Promotion-Schutz, Formprüfung für Rollen-Updates |

### `hasPermission(companyId, permissionKey)`

1. angemeldet, 2. aktive Membership **derselben Firma**, 3. `roleId` ist ein **nichtleerer String**, 4. das Rollen-Dokument existiert (in dieser Firma), 5. `status == "Aktiv"`, 6. `permissions[permissionKey]` ist exakt `true` (fehlende Map/fehlender Schlüssel = `false`).

**Deny** bei: fehlender/gesperrter Membership · falscher Firma · fehlender, leerer oder nicht-String-`roleId` · unbekannter Rolle · Rolle nur einer anderen Firma · **archivierter Rolle** · Rolle ohne `permissions` · fehlendem oder `false`-Schlüssel. **Kein Admin-/Demo-Fallback.**

> **Archivierte Rollen verlieren sofort den Zugriff.** Eine Rolle mit `status != "Aktiv"` gewährt in Phase 1 **keine** Berechtigung mehr: Alle Nutzer, deren Membership auf sie zeigt, verlieren sofort den Zugriff auf die vier geschützten Verwaltungscollections (`roles`, `employees`, `invitations`, `locations`) – auch auf Rechte, die sie dort vorher hatten. Das alte UI-Versprechen „Bestehende Zuweisungen bleiben erhalten“ (Rollenverwaltung, Archivieren-Dialog) ist damit **überholt**; es gilt nur noch dafür, dass die Zuweisung (`roleId`) bestehen bleibt, nicht für die Rechte. Es gibt in diesem Slice **keinen UI-Umbau** (weder Warnung noch Sperre beim Archivieren); das ist eine Folgeaufgabe. Die acht übrigen Collections prüfen weiterhin nur die Membership und sind davon nicht betroffen.

### Restricted- und geschützte Schlüssel (Spiegel der Policy)

- **Restricted (4, Superuser):** `rollen.admin_verwalten`, `administration.branding_aendern`, `administration.abrechnung_verwalten`, `administration.systemeinstellungen_aendern`. Sie sind Teil der geschützten Menge (siehe unten).
- **Admin-only-Löschrechte (3):** `geraete.loeschen`, `laborbuch.loeschen`, `berichte.loeschen`. Die Risikoklasse bleibt **destructive** (nicht restricted), aber Vergabe/Entzug beim Anlegen/Ändern einer Rolle erfordern ebenfalls `rollen.admin_verwalten`.
- **Geschützte Rollen-Permissions = Restricted + Admin-only-Löschrechte (7).** Diese eine Menge gilt **überall**: beim Anlegen/Ändern von Rollen (`roleHasProtectedKey`, `protectedKeyChanged`) **und** bei der Zuweisung an Mitarbeiter und Einladungen (`roleIdIsProtected`). Normale Löschrechte (`proben.`, `pruefungen.`, `kunden.`, `projekte.`, `kalender.loeschen`) sind **nicht** geschützt und für den Laborleiter vergebbar.

Rules können keine TypeScript-Konstanten importieren; die Listen (und die fünf Systemrollen-IDs) sind in `firestore.rules` **gespiegelt**. `tests/firestore/rules-config-sync.test.ts` (ohne Emulator lauffähig) schlägt fehl, wenn sie von `src/config/roles.ts` abweichen, wenn ein Schlüssel in den Rules nicht in der Taxonomie existiert, wenn eine Phase-1-Collection wieder nur `belongsToCompany` nutzt oder eine der acht übrigen `hasPermission`.

---

## 2. Verhalten je Collection

| Collection | Lesen | Anlegen | Ändern | Löschen |
|---|---|---|---|---|
| `locations` | `standorte.ansehen` | `administration.standorte_verwalten` | `administration.standorte_verwalten` (inkl. Deaktivieren/Reaktivieren) | **nie** |
| `invitations` | `administration.mitarbeiter_verwalten` | `mitarbeiter_verwalten` + nur `status "Ausstehend"`, kein `acceptedAt`/`revokedAt`; Einladung für Administrator-/Restricted-/nicht auflösbare Rolle nur mit `rollen.admin_verwalten` | `mitarbeiter_verwalten`, **nur der Widerruf**: Ausstehend → Widerrufen, nur `status`/`revokedAt`/`updatedAt` | **nie** |
| `employees` | `mitarbeiter.ansehen`; zusätzlich **eigenes Dokument** (`membership.employeeId == employeeId`, nur `get`, nicht über Name/E-Mail) | **nie** (kommt später serverseitig) | `administration.mitarbeiter_verwalten` + Schutzregeln (Abschnitt 3) | **nie** |
| `roles` | `rollen.ansehen`; zusätzlich die **eigene Rolle** (`membership.roleId == roleId`, nur `get`) | `administration.rollen_verwalten`, nur `type "Benutzerdefiniert"` + `status "Aktiv"`, keine Systemrollen-ID, `permissions` ist eine Map, geschützte Schlüssel (4 Restricted + `geraete.`/`laborbuch.`/`berichte.loeschen`) nur mit `rollen.admin_verwalten` | `administration.rollen_verwalten` + Schutzregeln (Abschnitt 4) | **nie** (Archivieren statt Löschen) |

Alles andere ändert sich nicht: `userMemberships` (eigenes `get`, kein Client-Write), `users/{uid}` (Profil-Regeln), Deny-Fallback.

---

## 3. Mitarbeiter: Self-Promotion und Administratoren

`update` erfordert `administration.mitarbeiter_verwalten` **und**

- **Eigenes Dokument** (`membership.employeeId == employeeId`): `roleId`, `role` und `status` dürfen **nicht** geändert werden (keine Selbst-Beförderung, keine Selbstsperre/-entsperrung – auch nicht für den Administrator). Unkritische Felder (z. B. Standort) bleiben änderbar. Maßgeblich ist ein echter Wertwechsel (`diff().affectedKeys()`): Ein Write, der den gespeicherten Status unverändert lässt, ist kein Statuswechsel und wird nicht abgelehnt; Aktiv → Gesperrt und Gesperrt → Aktiv am eigenen Dokument sind dagegen immer DENY (Tests prüfen beide Richtungen mit tatsächlich gespeichertem Ausgangsstatus).
- **Administratoren und geschützte Rollen:** Ist die **aktuelle** (`resource.data.roleId`) **oder neue** (`request.resource.data.roleId`) Rolle des Ziels die Administrator-Rolle, **irgendeine Rolle mit einem der 7 geschützten Schlüssel** (4 Restricted + `geraete.`/`laborbuch.`/`berichte.loeschen`; egal ob System-, Custom- oder archivierte Rolle) oder nicht auflösbar (**auch fehlende roleId bei Altdaten**), ist zusätzlich `rollen.admin_verwalten` nötig. Der Laborleiter kann deshalb weder Administratoren ändern/sperren noch jemanden auf Admin oder eine geschützte Rolle setzen noch die `roleId` entfernen. Dieselbe Prüfung (`roleIdIsProtected`) gilt für die Rolle einer neuen **Einladung**. Eine normale Rolle ohne geschützte Schlüssel (auch mit `proben.loeschen`) bleibt für den Laborleiter zuweisbar.

Nicht vereinfacht zu „Laborleiter darf alles“: die Logik wurde vollständig umgesetzt (bis zu 5 Dokumentzugriffe pro Update: Membership, eigene Rolle, aktuelle Zielrolle, neue Zielrolle; Limit 10).

## 4. Rollen: Schutz der Sicherheitsgrundlage

- **Administrator-Rolle (`roleId == "admin"`) ist für ALLE unveränderlich** – auch für den Administrator (keine Berechtigungsänderung, keine Beschreibung, nicht einmal `updatedAt`). Änderungen nur durch Operator/Server (Konsole, Admin SDK).
- **`type` und `createdAt` sind unveränderlich.**
- **Systemrollen:** nur `permissions` (+ `updatedAt`) änderbar; kein Umbenennen, keine Beschreibung/Farbe, **kein Archivieren**.
- **Benutzerdefinierte Rollen:** `name`, `description`, `color`, `permissions`, `status` (nur `Aktiv`/`Archiviert`) (+ `updatedAt`); keine unbekannten Felder.
- **Geschützte Schlüssel (Restricted + Admin-only-Löschrechte):** Anlegen mit einem geschützten Schlüssel und jede Änderung des **wirksamen** Werts eines geschützten Schlüssels (hinzufügen **oder** entfernen; auch bei Systemrollen) erfordert `rollen.admin_verwalten`. Der Laborleiter kann also weder `geraete.loeschen`, `laborbuch.loeschen` und `berichte.loeschen` noch einen Restricted-Schlüssel vergeben oder entziehen, wohl aber `proben.loeschen` u. ä. Es zählt der wirksame Wert: eine nicht migrierte Rolle (Schlüssel fehlt) und eine migrierte (`false`) sind gleich; ein Schreiben der vollen 45-Schlüssel-Map durch den Laborleiter ändert nichts am Restricted-Wert und ist erlaubt.
- **Nur bekannte Permission-Schlüssel:** `permissions` darf ausschließlich die 45 aktuell bekannten Schlüssel enthalten (`hasOnlyKnownPermissionKeys`, beim Anlegen **und** Ändern; auch bei Systemrollen und für den Administrator). Hintergrund ist das Future-Privilege-Risk: Ein heute gespeicherter unbekannter Schlüssel mit `true` könnte in einem späteren Release zu einer echten Berechtigung werden. **Fehlende** bekannte Schlüssel bleiben erlaubt und gelten als `false` – es gibt keine Pflicht, alle 45 zu speichern, Legacy-Rollen mit nur den 31 alten Schlüsseln bleiben gültig. Die Liste ist in den Rules gespiegelt; `rules-config-sync.test.ts` prüft sie exakt gegen `allPermissionKeys`. **Konsequenz:** Wird die Taxonomie um einen Schlüssel erweitert, muss die Liste in `firestore.rules` im selben Schritt ergänzt werden, sonst lehnen die Rules Rollen mit dem neuen Schlüssel ab (der Sync-Test schlägt dann fehl).
- **Systemrollen-IDs** (`admin`, `laborleiter`, `pruefer`, `azubi`, `gast`) können nie als neue Rolle angelegt werden (auch nicht, wenn das Dokument fehlt).
- Der Laborleiter darf `administration.rollen_verwalten`/`mitarbeiter_verwalten` an Rollen vergeben (nicht restricted), aber **keinen** Restricted-Schlüssel.

---

## 5. Bekannte Einschränkungen

1. **Employee-Rollenwechsel ≠ Membership.** `employees.roleId` zu ändern ändert die wirksame Rolle nicht; die Membership wird nicht synchronisiert (kein Admin SDK). Die UI-Aktion „Rolle ändern“ ist weiterhin missverständlich. Gleiches gilt für Sperren: `Employee.status = "Gesperrt"` sperrt die Membership nicht.
2. **`rollen_verwalten` ist weiterhin breit:** Wer es hält (Laborleiter, jede Custom Role damit), kann über Rollen alle **nicht geschützten** Schlüssel vergeben – auch für die eigene Rolle. Die Restricted-Schlüssel **und** die drei Admin-only-Löschrechte sind geschützt (Rules + Test); alle anderen Rechte, inklusive normaler Löschrechte (`proben.`, `pruefungen.`, `kunden.`, `projekte.`, `kalender.loeschen`), `mitarbeiter_verwalten` und `standorte_verwalten`, nicht. Auch die **Zuweisung** (Mitarbeiter/Einladung) nutzt die komplette geschützte 7er-Menge: Eine vom Administrator angelegte Rolle mit Admin-only-Löschrechten kann der Laborleiter **nicht** zuweisen.
3. **Verwalten setzt Ansehen voraus.** Die Services lesen vor jedem Schreiben in einer Transaktion (Standort/Mitarbeiter/Rolle ändern): Eine Custom Role mit `*_verwalten` aber ohne das passende `*.ansehen` (bzw. eigene-Dokument-Ausnahme) kann blind schreiben, scheitert aber in der App.
4. **UI-Gating (erledigt).** Die Company-Seite lädt Mitarbeiter, Einladungen, Rollen und Standorte nur noch mit dem passenden Leserecht (`usePermissions()`); Tabs, Aktionen und der Rollen-Editor passen sich an. Rollen ohne Leserecht sehen keine Fehlerzustände mehr (`docs/firebase/ui-permission-gating.md`). Das ist UX, keine Sicherheit.
5. **Altdaten ohne `roleId`** (Mitarbeiter, Einladungen) sind nur mit `rollen.admin_verwalten` änderbar (fail-closed).
6. **Keine Wertprüfung** außer den genannten Formregeln (Name/Farbe/Texte, Typen der `permissions`-Werte – nur `== true` gewährt).
7. **Kein Mitarbeiter-/Einladungs-Create-Pfad für Employees** (nur Server später); die Emulator-Seeds laufen ohne Rules.
8. **Race Conditions** der Fach-Slices (Rollen-/E-Mail-Eindeutigkeit) bleiben clientseitige Prüfschritte.

## 6. Migration vor dem Deployment (zwingend)

Die gespeicherten Rollen-Dokumente kennen die 14 neuen Schlüssel nicht (fehlend = `false`). Mit diesen Rules hätte ein **nicht migrierter Administrator** u. a. kein `standorte.ansehen`, `mitarbeiter.ansehen`, `rollen.ansehen`, `rollen.admin_verwalten` und sperrt sich aus. **Vor dem Deployment** müssen die echten Systemrollen-Dokumente aller Firmen auf die 45-Schlüssel-Matrix (`src/config/roles.ts`) migriert sein (Operator-Skript/Konsole; keine automatische Client-Migration). Außerdem müssen **alle Memberships** eine gültige `roleId` besitzen (kein Zugriff ohne), und Mitarbeiter/Einladungen sollten `roleId` tragen (sonst nur Admin-änderbar). Die Rules-Tests seeden die Rollen explizit mit der vollständigen Matrix; ein Test (`Migration: Rolle vor der Migration`) zeigt das Teilsperr-Verhalten einer 31-Schlüssel-Rolle.

## 7. Noch nicht rollenbasiert (bleiben bei `belongsToCompany`)

`customers`, `projects`, `devices`, `samples`, `testValues`, `reports`, `calendarEvents`, `laborbook` – jedes aktive Mitglied darf dort weiterhin alles. Außerdem ungeschützt/offen: Firmen-Stammdokument, `integrations`, `webhooks`, `auditLog`, `aiChats` (per Deny-Fallback komplett gesperrt, kein Service).

## 8. Tests

`npm run test:rules` (Emulator, Java 21 nötig) – zusätzlich `npm run test:permissions` (ohne Emulator). Neu in Phase 1:

| Datei | Inhalt |
|---|---|
| `phase1-matrix.test.ts` | 19 Personas × 4 Collections × get/list/create/update/delete (380 Tests): Administrator, 2. Administrator, Laborleiter, Prüfer, Azubi, Gast, Custom Role (Baustellenleiter) und 12 defekte Ketten (ohne/leere/nicht-String-`roleId`, unbekannte, archivierte, fremde-Firma-Rolle, Rolle ohne `permissions`/mit leerer Map, gesperrt, falsche Firma, ohne Membership, anonym) |
| `phase1-employees.test.ts` | eigenes Dokument lesen, Verwalten, Administrator-/Restricted-Schutz, Self-Promotion/Selbstsperre, Migration |
| `phase1-roles.test.ts` | Lesen (eigene Rolle), Anlegen/Ändern, **nur bekannte Permission-Schlüssel (unbekannt → DENY, Legacy-31er und Teilmengen → ALLOW)**, Restricted-Schlüssel je Schlüssel, **geschützte Admin-only-Löschrechte** (Laborleiter DENY, Administrator ALLOW, normale Löschrechte ALLOW), Systemrollen, Administrator-Rolle für alle unveränderlich, Löschen, Migration |
| `phase1-invitations-locations.test.ts` | Formregeln der Einladung, Widerruf als einziger Update-Pfad, Rolle der Einladung, Standorte inkl. Deaktivieren, Verwalten ohne Ansehen |
| `rules-config-sync.test.ts` | Spiegel der Restricted-/Admin-only-/geschützten Listen und der Systemrollen-IDs, kein Tippfehler-Schlüssel, Phase-1- vs. Legacy-Blöcke (läuft ohne Emulator) |

Angepasst: `company-collections.test.ts` testet nur noch die acht übrigen Collections mit „aktives Mitglied darf alles“; Membership-, Tenant-Isolation- und Profil-Tests sind unverändert.
