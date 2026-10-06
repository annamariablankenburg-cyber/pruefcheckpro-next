# Rollen & Rechte (Policy)

Status: **Policy ist in `src/config/roles.ts` umgesetzt (Taxonomie + Systemrollen-Matrix) – eine serverseitige Durchsetzung gibt es noch nicht.** Rollen und Berechtigungen steuern heute Verwaltungslogik und Darstellung; die Firestore Rules erlauben jedem aktiven Mitglied der Firma noch alles (siehe `docs/firebase/security-foundations.md`, `docs/firebase/role-security-audit.md`). Dieses Dokument ist die gemeinsame Policy für Config, Rules (später) und UI.

Konfiguration und Tests: `src/config/roles.ts`, `tests/config/permissions.test.ts` (`npm run test:permissions`).

---

## 1. Systemrollen

| ID | Rolle | Zweck |
|---|---|---|
| `admin` | **Administrator** | Uneingeschränkter Zugriff, einzige Rolle mit Superuser-Rechten. Berechtigungen sind festgeschrieben. |
| `laborleiter` | **Laborleiter** | Operative Leitung: Labor-, Prüf-, Projekt-, Berichtsbereiche, Mitarbeiter und Standorte – **ohne Administratorrechte**. |
| `pruefer` | **Prüfer** | Durchführung von Prüfungen, Proben, Prüfwerten, Laborbuch, Kalender, Berichten. |
| `azubi` | **Azubi** | Operative Erfassung (Proben) und Ansicht; keine Administration, kein Löschen. |
| `gast` | **Gast** | Nur Lesen der fachlichen Bereiche. |

Zusätzlich gibt es **benutzerdefinierte Rollen** (Beispiele: Qualitätsmanager, Baustellenleiter). Sie können beliebige Kombinationen der unten stehenden Rechte haben – **außer** den Superuser-Rechten (Abschnitt 4), die nur Inhaber von `rollen.admin_verwalten` vergeben dürfen.

---

## 2. Berechtigungs-Taxonomie (45 Schlüssel)

Gespeichert wird je Rolle nur `permissions: Record<key, boolean>` in `companies/{companyId}/roles/{roleId}`; die Taxonomie selbst (welche Schlüssel es gibt, Gruppierung) ist Code. Fehlende Schlüssel gelten als `false`, unbekannte werden verworfen (`normalizePermissions`).

**Systematik:** `<bereich>.ansehen` · `.erstellen` · `.bearbeiten` · `.loeschen`. **Legacy-Ausnahmen** (bleiben unverändert, damit gespeicherte Rollen nicht brechen): `dashboard.anzeigen`, `kalender.termine_erstellen` (= „erstellen“ im Kalender), `pdf.exportieren`, `ki.verwenden` und alle `administration.*`-Schlüssel. **Kein bestehender Schlüssel wurde entfernt oder umbenannt.**

| Modul (Kategorie) | Schlüssel | Neu |
|---|---|---|
| Dashboard | `dashboard.anzeigen` | |
| Proben | `proben.ansehen` · `.erstellen` · `.bearbeiten` · `.loeschen` ¹ | |
| Prüfungen | `pruefungen.ansehen` · `.erstellen` · `.bearbeiten` · `.loeschen` ¹ | |
| Kunden | `kunden.ansehen` · `.erstellen` · `.bearbeiten` · `.loeschen` ¹ | |
| Projekte | `projekte.ansehen` · `.erstellen` · `.bearbeiten` · `.loeschen` ¹ | |
| Geräte | `geraete.ansehen` · `geraete.bearbeiten` | – |
| | `geraete.erstellen` · `geraete.loeschen` ¹ | **neu** |
| Laborbuch | `laborbuch.ansehen` · `laborbuch.bearbeiten` | – |
| | `laborbuch.erstellen` · `laborbuch.loeschen` ¹ | **neu** |
| Kalender | `kalender.ansehen` · `kalender.termine_erstellen` | – |
| | `kalender.bearbeiten` · `kalender.loeschen` ¹ | **neu** |
| Berichte | `berichte.ansehen` · `.erstellen` · `.bearbeiten` · `.loeschen` ¹ | **neu (4)** |
| PDF | `pdf.exportieren` | |
| KI | `ki.verwenden` | |
| Unternehmen (Ansicht) | `standorte.ansehen` · `mitarbeiter.ansehen` · `rollen.ansehen` | **neu (3)** |
| Administration | `administration.mitarbeiter_verwalten` · `.rollen_verwalten` · `.standorte_verwalten` | – |
| | `administration.branding_aendern` ² · `.abrechnung_verwalten` ² · `.systemeinstellungen_aendern` ² | – |
| | `rollen.admin_verwalten` ² | **neu** |

¹ **destructive** (endgültiges Löschen, Abschnitt 6) · ² **restricted** (Superuser-/Administratorrecht, Abschnitt 4).

**Vorher 31 Schlüssel → jetzt 45 (14 neu).** Neu: `geraete.erstellen`, `geraete.loeschen`, `kalender.bearbeiten`, `kalender.loeschen`, `laborbuch.erstellen`, `laborbuch.loeschen`, `berichte.ansehen`, `berichte.erstellen`, `berichte.bearbeiten`, `berichte.loeschen`, `standorte.ansehen`, `mitarbeiter.ansehen`, `rollen.ansehen`, `rollen.admin_verwalten`.

### 2.1 Begründung der Lücken-Entscheidungen

| Lücke aus dem Audit | Entscheidung | Warum |
|---|---|---|
| `geraete.erstellen`, `geraete.loeschen` | **eigene Schlüssel** | Anlegen (Kalibrier-Stammdaten) und endgültiges Löschen sind verschieden riskant wie Bearbeiten. |
| `kalender.bearbeiten`, `kalender.loeschen` | **eigene Schlüssel** | Termine haben nur den Status geplant/in Arbeit/überfällig/abgeschlossen – das einzige „Stornieren“ ist Löschen; es soll getrennt vergebbar sein. `kalender.termine_erstellen` bleibt als Legacy-Name. |
| `laborbuch.erstellen`, `laborbuch.loeschen` | **eigene Schlüssel** | Das Laborbuch ist ein Nachweisdokument: Rollen sollen Einträge **anlegen** dürfen, ohne bestehende zu **ändern** (append-only), und Löschen ist getrennt. |
| `berichte.*` (4) | **eigene Schlüssel** | Berichte sind eine eigene Domäne mit Status und Export; sie an `pruefungen.*`/`pdf.exportieren` zu hängen vermischt Lesen, Schreiben und Export. `pdf.exportieren` bleibt die **Aktion** „exportieren“. |
| Lesen von Standorten, Mitarbeitern, Rollen | **eigene Schlüssel** `standorte.ansehen`, `mitarbeiter.ansehen`, `rollen.ansehen` | Rules sollen später Lesen und Schreiben getrennt entscheiden. |
| Einladungen | **kein eigener Schlüssel** | Einladungen sind Teil der Mitarbeiterverwaltung (`administration.mitarbeiter_verwalten`, Lesen und Schreiben). Einladungen enthalten E-Mail-Adressen Dritter, deshalb gilt für sie **nicht** das offenere `mitarbeiter.ansehen`. |
| `kalender.termine_erstellen` → `kalender.erstellen` umbenennen | **nein** | Würde gespeicherte Rollen brechen. |
| Superuser-Recht für Rollen | **neu: `rollen.admin_verwalten`** | Sonst würde `rollen_verwalten` implizit „Administrator“ bedeuten (Abschnitt 4). |

---

## 3. Rollenmatrix (Systemrollen)

✅ = gewährt. Anzahl gewährter Rechte: **Administrator 45 · Laborleiter 38 · Prüfer 22 · Azubi 13 · Gast 9**.

| Recht | Admin | Laborleiter | Prüfer | Azubi | Gast |
|---|:-:|:-:|:-:|:-:|:-:|
| dashboard.anzeigen | ✅ | ✅ | ✅ | ✅ | ✅ |
| proben.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| proben.erstellen · .bearbeiten | ✅ | ✅ | ✅ | ✅ | |
| **proben.loeschen** | ✅ | ✅ | | | |
| pruefungen.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| pruefungen.erstellen · .bearbeiten | ✅ | ✅ | ✅ | | |
| **pruefungen.loeschen** | ✅ | ✅ | | | |
| kunden.ansehen · projekte.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| kunden./projekte. erstellen · bearbeiten | ✅ | ✅ | | | |
| **kunden./projekte. loeschen** | ✅ | ✅ | | | |
| geraete.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| geraete.erstellen · .bearbeiten | ✅ | ✅ | | | |
| **geraete.loeschen** | ✅ | | | | |
| laborbuch.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| laborbuch.erstellen · .bearbeiten | ✅ | ✅ | ✅ | | |
| **laborbuch.loeschen** | ✅ | | | | |
| kalender.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| kalender.termine_erstellen · .bearbeiten | ✅ | ✅ | ✅ | | |
| **kalender.loeschen** | ✅ | ✅ | | | |
| berichte.ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| berichte.erstellen · .bearbeiten | ✅ | ✅ | ✅ | | |
| **berichte.loeschen** | ✅ | | | | |
| pdf.exportieren | ✅ | ✅ | ✅ | | |
| ki.verwenden | ✅ | ✅ | ✅ | ✅ | |
| standorte.ansehen | ✅ | ✅ | ✅ | ✅ | |
| mitarbeiter.ansehen | ✅ | ✅ | | | |
| rollen.ansehen | ✅ | ✅ | | | |
| administration.mitarbeiter_verwalten | ✅ | ✅ | | | |
| administration.rollen_verwalten | ✅ | ✅ | | | |
| administration.standorte_verwalten | ✅ | ✅ | | | |
| **administration.branding_aendern** | ✅ | | | | |
| **administration.abrechnung_verwalten** | ✅ | | | | |
| **administration.systemeinstellungen_aendern** | ✅ | | | | |
| **rollen.admin_verwalten** | ✅ | | | | |

Beispiel-Custom-Roles: **Qualitätsmanager** = Prüfer-Rechte (22). **Baustellenleiter** (20): Projekte erstellen/bearbeiten, Proben/Prüfungen erstellen, Kalender (erstellen/bearbeiten), Berichte (ansehen/erstellen/bearbeiten), PDF, KI, Standorte ansehen.

### 3.1 Aufgelöste Widersprüche

| Widerspruch | Auflösung |
|---|---|
| Doku: „Rollen/Standorte/Branding nur Admin“ – Config: Laborleiter hatte `rollen_verwalten`, `standorte_verwalten`, `branding_aendern` | **Laborleiter:** `standorte_verwalten` ✅ (bleibt), `rollen_verwalten` ✅ (jetzt **begrenzt**, Abschnitt 4), `branding_aendern` ❌ (nur Administrator; Firmenidentität). |
| `Laborleiter`-Beschreibung „Vollzugriff“ | Beschreibung geändert: „… ohne Administratorrechte“; 7 Rechte sind ausgeschlossen (4 Superuser + `geraete/laborbuch/berichte.loeschen`). |
| `Gast`: „Leserechte für alle Bereiche“ vs. Berichte | Gast darf Berichte **ansehen** (bisher implizit über Prüfungen); keine Verwaltungsdaten (Standorte, Mitarbeiter, Rollen). |
| Admin heißt in Mockdaten „Admin“, Rolle „Administrator“ | unverändert (Legacy-Alias, siehe `roleRules.ts`). |

---

## 4. Superuser-Rechte und Begrenzungen

> Grundsatz: **Kein einzelner Schlüssel macht implizit zum Administrator.** Die Grenze zum Administrator ist ein eigener, ausdrücklicher Schlüssel (`rollen.admin_verwalten`), keine versteckte Logik.

### 4.1 Restricted-Schlüssel (Superuser)

`rollen.admin_verwalten`, `administration.abrechnung_verwalten`, `administration.systemeinstellungen_aendern`, `administration.branding_aendern`.

- Liegen **nur** bei der Administrator-Rolle (Test: `permissions.test.ts`). Keine Custom Role der Config enthält sie.
- **Vergabe/Entzug dieser Schlüssel** (in einer beliebigen Rolle), **Bearbeiten der Administrator-Rolle**, **Zuweisen einer Rolle, die einen geschützten Schlüssel enthält (Restricted oder Admin-only-Löschrecht)** (inkl. Administrator) und **Ändern/Sperren von Mitarbeitern, die eine solche Rolle halten** erfordern `rollen.admin_verwalten`.
- Rules können Rollen nicht „vergleichen“ (keine Schleifen/Mengenvergleiche). Die Policy ist deshalb als **feste Liste** formuliert (`RESTRICTED_PERMISSION_KEYS`): prüfbar mit `permissions.diff(…).affectedKeys().hasAny([…])`.

### 4.1a Admin-only-Löschrechte (geschützt, aber „destructive“)

`geraete.loeschen`, `laborbuch.loeschen`, `berichte.loeschen` liegen nur beim Administrator (Matrix, Test). Sie bleiben Risikoklasse **destructive**, werden aber wie die Restricted-Schlüssel behandelt, **was Vergabe und Entzug in Rollen angeht**: Anlegen/Ändern einer Rolle mit diesen Schlüsseln erfordert `rollen.admin_verwalten` (`ADMIN_ONLY_DELETE_PERMISSION_KEYS`). Zusammen mit den Restricted-Schlüsseln ergibt das die **7 geschützten Rollen-Permissions** (`PROTECTED_ROLE_PERMISSION_KEYS`; in Rules Phase 1 gespiegelt und per Test synchron gehalten). Normale Löschrechte (`proben.`, `pruefungen.`, `kunden.`, `projekte.`, `kalender.loeschen`) sind nicht geschützt und vom Laborleiter vergebbar.

### 4.2 Bewertung der genannten Schlüssel

| Schlüssel | Kritikalität | Wer | Begrenzung |
|---|---|---|---|
| `rollen.admin_verwalten` | **kritisch (Superuser)** | nur Administrator | Einziger Weg, Administratorrechte zu vergeben oder die Administrator-Rolle zu ändern. |
| `administration.rollen_verwalten` | **kritisch, begrenzt** | Administrator, Laborleiter | Darf **normale** Rollen anlegen/ändern/archivieren, aber: Administrator-Rolle nicht ändern, **keinen Restricted-Schlüssel** vergeben, **keine Admin-Zuweisung**. Ohne diese Begrenzung wäre es ein Superuser-Recht. |
| `administration.mitarbeiter_verwalten` | **kritisch, begrenzt** | Administrator, Laborleiter | Einladen, Rolle zuweisen, sperren, Daten ändern – aber: Rollen mit einem geschützten Schlüssel (Restricted **oder** Admin-only-Löschrecht) und die Administrator-Rolle nur mit `rollen.admin_verwalten` zuweisen/einladen; Administratoren nicht ändern/sperren; **nie die eigene Rolle ändern** (Self-Promotion). |
| `administration.standorte_verwalten` | mittel (Stammdaten) | Administrator, Laborleiter | Betrifft Standort-Stammdaten; keine Rechte-Eskalation möglich. |
| `administration.branding_aendern` | niedrig–mittel (Firmenidentität, erscheint in Berichten/E-Mails) | nur Administrator | Restricted: bewusst nicht beim Laborleiter. |
| `administration.abrechnung_verwalten` | **kritisch** (Zahlung/Lizenz) | nur Administrator | Restricted; Abrechnungsdaten später nur serverseitig. |
| `administration.systemeinstellungen_aendern` | **kritisch** (Integrationen, Schlüssel) | nur Administrator | Restricted. |

**Weitere Policy-Regeln (für spätere Rules/Server):**
- Niemand ändert die **eigene** Rolle oder Membership; niemand sperrt sich selbst aus.
- Die Administrator-Rolle ist unveränderlich (Berechtigungen und Typ); Änderungen nur über Server/Operator.
- Mindestens ein aktiver Administrator muss bleiben (Server-Invariante, nicht in Rules prüfbar) – umgesetzt in `assignRole`/`setMemberStatus`: aktiver Administrator = Membership „Aktiv“ mit `roleId == "admin"` (`docs/firebase/member-security-actions.md`).
- Eine Rolle, die einen geschützten Schlüssel (Restricted oder Admin-only-Löschrecht) enthält, kann nur von einem Inhaber von `rollen.admin_verwalten` zugewiesen werden (sonst: Admin legt „Billing-Rolle“ an, Laborleiter weist sie sich selbst zu).

---

## 5. Zuordnung Collection ↔ Permission (Soll für spätere Rules)

Noch **nicht durchgesetzt**. Jede Collection hat ein eigenes Lese- und Schreibmodell; alle Lücken des Audits sind geschlossen.

| Collection | Read | Create | Update | Delete |
|---|---|---|---|---|
| `customers` | `kunden.ansehen` | `kunden.erstellen` | `kunden.bearbeiten` (inkl. Status/Archiv) | `kunden.loeschen` |
| `projects` | `projekte.ansehen` | `projekte.erstellen` | `projekte.bearbeiten` (inkl. Status/Archiv) | `projekte.loeschen` |
| `devices` | `geraete.ansehen` | `geraete.erstellen` | `geraete.bearbeiten` (inkl. Status/Archiv) | `geraete.loeschen` |
| `samples` | `proben.ansehen` | `proben.erstellen` | `proben.bearbeiten` | `proben.loeschen` |
| `testValues` | `pruefungen.ansehen` | `pruefungen.erstellen` | `pruefungen.bearbeiten` | `pruefungen.loeschen` |
| `reports` | `berichte.ansehen` | `berichte.erstellen` | `berichte.bearbeiten` (PDF-/Excel-Export-Status zusätzlich `pdf.exportieren`) | `berichte.loeschen` |
| `calendarEvents` | `kalender.ansehen` | `kalender.termine_erstellen` | `kalender.bearbeiten` | `kalender.loeschen` |
| `laborbook` | `laborbuch.ansehen` | `laborbuch.erstellen` | `laborbuch.bearbeiten` (inkl. Archiv) | `laborbuch.loeschen` |
| `locations` | `standorte.ansehen` | `administration.standorte_verwalten` | `administration.standorte_verwalten` | verboten (Status statt Löschen) |
| `employees` | `mitarbeiter.ansehen` (+ das eigene Dokument) | **nur Server** (Einladungsannahme) | `administration.mitarbeiter_verwalten` + Begrenzungen (4.2) | verboten (Status „Gesperrt“) |
| `invitations` | `administration.mitarbeiter_verwalten` | `administration.mitarbeiter_verwalten` + Begrenzungen (4.2) | `administration.mitarbeiter_verwalten` (nur Widerruf) | verboten (Widerruf) |
| `roles` | `rollen.ansehen` (+ die **eigene** Rolle immer lesbar) | `administration.rollen_verwalten` + Begrenzungen (4.1) | `administration.rollen_verwalten` + Begrenzungen (4.1) | verboten (Archivieren) |

Abhängigkeiten zwischen Collections (Dialoge lesen Referenzdaten) sind im Audit (Abschnitt 4.4) beschrieben; Custom Roles müssen die jeweiligen `*.ansehen` mitbringen (Test: Erstellen/Bearbeiten ohne `ansehen` kommt in den Systemrollen nicht vor).

---

## 6. Hard-Delete-Policy

Für **jede** Domäne existiert Archiv/Status – endgültiges Löschen ist die Ausnahme. Es gibt dafür jetzt in jedem Bereich einen ausdrücklichen `*.loeschen`-Schlüssel (Risikoklasse *destructive*; 8 Stück). Es gibt **keinen** Delete-Schlüssel für `locations`, `employees`, `invitations`, `roles` (diese werden nie gelöscht).

| Bereich | Archiv/Status vorhanden | Löschen vergeben an | Begründung |
|---|---|---|---|
| Proben, Prüfungen | ja (Status, Archiv) | Administrator, Laborleiter | bestehende Intention (Azubi/Prüfer nie) |
| Kunden, Projekte | ja (Inaktiv/Archiviert bzw. Status) | Administrator, Laborleiter | bestehende Intention; **keine referenzielle Sperre** im Code |
| Kalender | nur geplant/in Arbeit/überfällig/abgeschlossen | Administrator, Laborleiter | Löschen ist der einzige Weg, einen Termin zu stornieren; kein Nachweisdokument |
| **Geräte** | ja | **nur Administrator** | Referenz für Prüfungen/Kalibrierung |
| **Laborbuch** | ja (Aktiv/Archiviert) | **nur Administrator** | Nachweisdokument |
| **Berichte** | ja (Archiviert) | **nur Administrator** | Ausgelieferte Dokumente |

**Empfehlung für die Rules-Phase** (nicht umgesetzt, keine Service-Änderung in diesem Slice): `delete` zusätzlich nur erlauben, wenn `resource.data.status == "Archiviert"` (bzw. dem Archiv-Status der Domäne). Die UI-Hard-Deletes (Proben, Prüfungen, Berichte, Laborbuch, Kalender) bleiben bis dahin bestehen.

---

## 7. Migration

**Kompatibilität:** Es wurde kein Schlüssel entfernt oder umbenannt. Gespeicherte Rollen-Dokumente mit den 31 alten Schlüsseln bleiben gültig; die 14 neuen Schlüssel gelten dort als `false` (`normalizePermissions`, Rules müssen `.get(key, false)` nutzen).

**Bisherige Zuordnung → neue Schlüssel (effektive Rechte bleiben erhalten):**

| Bisher | Wird zu |
|---|---|
| `kalender.termine_erstellen` (deckte Termine ändern ab) | zusätzlich `kalender.bearbeiten` |
| `pruefungen.ansehen` (deckte Berichte lesen ab) | zusätzlich `berichte.ansehen` |
| `pdf.exportieren` (deckte Berichte erstellen/ändern ab) | zusätzlich `berichte.erstellen`, `berichte.bearbeiten` |
| `geraete.bearbeiten` (deckte Anlegen ab) | zusätzlich `geraete.erstellen` |
| `laborbuch.bearbeiten` (deckte Anlegen ab) | zusätzlich `laborbuch.erstellen` |
| keine (Bereichslesen war ungeregelt) | `standorte.ansehen` für Prüfer/Azubi/Baustellenleiter/Laborleiter/Admin; `mitarbeiter.ansehen`, `rollen.ansehen` für Laborleiter/Admin |

**Bewusste Änderungen gegenüber der bisherigen Config:** Laborleiter verliert `branding_aendern`; Laborleiter und alle anderen erhalten `*.loeschen` für Geräte/Laborbuch/Berichte nicht (nur Administrator); Gast erhält `berichte.ansehen`; Laborleiter-/Gast-Beschreibung angepasst.

**Persistierte Daten (wichtig vor jeder Durchsetzung):**
- **Emulator/Dev:** `npx tsx scripts/seedRoles.ts --force` überschreibt die Rollen-Dokumente mit der neuen Matrix (überschreibt auch Anpassungen an den Beispielrollen).
- **Echte Daten:** Die gespeicherten Systemrollen-Dokumente kennen die neuen Schlüssel nicht. **Vor dem Einschalten rollenbasierter Rules müssen sie migriert werden** (Admin-Skript oder manuell über die Rollenverwaltung), sonst hätte z. B. der Administrator in den Rules `berichte.ansehen == false` und wäre ausgesperrt. Maßgeblich für Rules sind die **gespeicherten** Dokumente, nicht die Config; die Rollenverwaltung zeigt ebenfalls die gespeicherten Daten.
- Ein Konsistenz-Check „gespeicherte Systemrollen = Config-Matrix“ (Skript oder Test gegen Emulator-Daten) ist ein sinnvoller Folge-Schritt.

---

## 8. Weitere Regeln aus dem ursprünglichen Brief

1. **„Azubis dürfen keine Proben löschen.“** → `proben.loeschen` nicht bei Azubi (Test).
2. **„Admin und Laborleiter dürfen Mitarbeiter verwalten.“** → `administration.mitarbeiter_verwalten`, jetzt mit Begrenzungen (4.2).
3. **„Gast hat nur eingeschränkte Leserechte.“** → ausschließlich `*.ansehen` und `dashboard.anzeigen` (Test).
4. **„Mitarbeiter nicht hart löschen, sondern Zugriff entziehen.“** → Status `Gesperrt`; kein Delete-Schlüssel für Mitarbeiter. Die wirksame Sperre liegt in `userMemberships/{uid}.status` (serverseitig; siehe Security Foundations) – seit dem Server-Slice an den Employee-Status gekoppelt (`setMemberStatus` schreibt beides atomar, `docs/firebase/member-security-actions.md`).
5. **Systemrollen-Schutz:** Systemrollen sind nicht löschbar/archivierbar, Name/Farbe/Beschreibung fest; die Administrator-Rolle ist komplett unveränderlich (heute nur Client-Regeln; Server-Durchsetzung folgt).

## 9. Durchsetzung: Stand und Plan

| Ebene | Stand |
|---|---|
| Config (Taxonomie, Matrix, Risikoklassen) | ✅ umgesetzt und getestet (`npm run test:permissions`) |
| UI-Marker (`Nur Administrator`/`Löschen` im Rollen-Editor) | ✅ nur Anzeige |
| UI-Gating (Buttons/Seiten nach Rechten) | 🟡 Company-Verwaltung (Tabs, Mitarbeiter, Einladungen, Standorte, Rollen) und `AdminView`-Rollenübersicht über `usePermissions()` (`docs/firebase/ui-permission-gating.md`); Fachseiten (Kunden, Projekte, Geräte, …) noch nicht |
| Firestore Rules (rollenbasiert) | 🟡 **Phase 1** für `roles`, `employees`, `invitations`, `locations` implementiert und im Emulator getestet (`docs/firebase/role-permission-rules-phase1.md`; lokal 711/711); die übrigen acht Collections nur Membership + Firma |
| Server (Rollenzuweisung, Status, Letzter-Admin-Schutz) | ✅ `assignRole`/`setMemberStatus` (Admin SDK, `docs/firebase/member-security-actions.md`); Provisionierung (Einladung annehmen, Firma anlegen) ❌ noch nicht |

Architektur der späteren Durchsetzung (Variante D/A im Audit): Membership (`roleId`, `status`) + Role-Dokument (`permissions`) live per `get()` in den Rules; Restricted-Schlüssel als feste Liste; Zuweisungen und Membership-Änderungen serverseitig.
