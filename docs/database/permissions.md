# Rollen & Rechte (Planung)

Status: **Planungsdokument – keine echte Firebase-Anbindung.** Heute existiert im UI keine echte Rechteprüfung; jede Aktion ist für jeden sichtbaren Nutzer klickbar (Mock-Daten). Dieses Dokument beschreibt, wie die bereits im Rollen-Modul (`types/role.ts`, `config/roles.ts`) angelegte Berechtigungs-Taxonomie später serverseitig (Firestore Security Rules + UI-Guards) durchgesetzt werden soll.

---

## 1. Die 5 Kernrollen (Systemrollen)

Aus dem Sprint-Brief und bereits 1:1 als Mock-Daten in `config/roles.ts` angelegt:

| Rolle | `EmployeeRole`-Wert | Zweck |
|---|---|---|
| **Admin** (Administrator) | `Admin` | Uneingeschränkter Zugriff auf alle Bereiche und Einstellungen |
| **Laborleiter** | `Laborleiter` | Vollzugriff auf Laborfunktionen, Prüfungen, Ergebnisse, Berichte |
| **Prüfer** | `Prüfer` | Durchführung von Prüfungen, Eingabe von Ergebnissen |
| **Azubi** | `Azubi` | Eingeschränkter Zugriff für Auszubildende |
| **Gast** | `Gast` | Nur Leserechte |

Zusätzlich unterstützt das Rollen-Modul bereits **benutzerdefinierte Rollen** (`type: "Benutzerdefiniert"`, z. B. „Qualitätsmanager“, „Baustellenleiter“ als Beispiele in den Mock-Daten) – die 5 Kernrollen sind der Startpunkt, keine feste Obergrenze.

---

## 2. Berechtigungs-Taxonomie (bereits im Code vorbereitet)

`config/roles.ts` definiert 11 Kategorien mit insgesamt ~27 Einzelrechten (`permissionCategories`). Diese Taxonomie ist bereits produktionsnah modelliert und sollte bei echter Anbindung **unverändert übernommen** werden:

| Kategorie | Rechte-Keys (Auszug) |
|---|---|
| `dashboard` | `dashboard.anzeigen` |
| `proben` | `proben.ansehen`, `proben.erstellen`, `proben.bearbeiten`, `proben.loeschen` |
| `pruefungen` | `pruefungen.ansehen`, `pruefungen.erstellen`, `pruefungen.bearbeiten`, `pruefungen.loeschen` |
| `kunden` | `kunden.ansehen`, `kunden.erstellen`, `kunden.bearbeiten`, `kunden.loeschen` |
| `projekte` | `projekte.ansehen`, `projekte.erstellen`, `projekte.bearbeiten`, `projekte.loeschen` |
| `geraete` | `geraete.ansehen`, `geraete.bearbeiten` |
| `laborbuch` | `laborbuch.ansehen`, `laborbuch.bearbeiten` |
| `kalender` | `kalender.ansehen`, `kalender.termine_erstellen` |
| `pdf` | `pdf.exportieren` |
| `ki` | `ki.verwenden` |
| `administration` | `administration.mitarbeiter_verwalten`, `administration.rollen_verwalten`, `administration.standorte_verwalten`, `administration.branding_aendern`, `administration.abrechnung_verwalten`, `administration.systemeinstellungen_aendern` |

**Empfehlung für Firestore:** Die Taxonomie (Kategorien + welche Keys es gibt) bleibt **Code** (`config/roles.ts`), nicht Firestore-Daten – sie ändert sich mit App-Releases, nicht pro Firma. Nur die **Zuordnung** „welche Rolle hat welchen Key gewährt" (`Role.permissions: Record<string, boolean>`) wird pro Firma in `companies/{companyId}/roles/{roleId}` gespeichert.

---

## 3. Rechte-Matrix der 5 Kernrollen

Abgeleitet aus den bereits gepflegten `permissions`-Listen in `config/roles.ts`:

| Recht | Admin | Laborleiter | Prüfer | Azubi | Gast |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Proben ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Proben erstellen | ✅ | ✅ | ✅ | ✅ | ❌ |
| Proben bearbeiten | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Proben löschen** | ✅ | ✅ | ❌ | ❌ | ❌ |
| Prüfungen ansehen/erstellen/bearbeiten | ✅ | ✅ | ✅ | nur ansehen | nur ansehen |
| Prüfungen löschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Kunden ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kunden erstellen/bearbeiten/löschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Projekte ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Projekte erstellen/bearbeiten/löschen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Geräte ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Geräte bearbeiten | ✅ | ✅ | ❌ | ❌ | ❌ |
| Laborbuch ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Laborbuch bearbeiten | ✅ | ✅ | ✅ | ❌ | ❌ |
| Kalender ansehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kalender: Termine erstellen | ✅ | ✅ | ✅ | ❌ | ❌ |
| PDF exportieren | ✅ | ✅ | ✅ | ❌ | ❌ |
| PrüfCheck AI verwenden | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Mitarbeiter verwalten** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Rollen verwalten** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Standorte verwalten** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Branding ändern** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Abrechnung verwalten** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Systemeinstellungen ändern** | ✅ | ❌ | ❌ | ❌ | ❌ |

Fett hervorgehoben: die im Sprint-Brief explizit genannten Kernregeln.

---

## 4. Explizite Regeln aus dem Sprint-Brief

1. **„Azubis dürfen keine Proben löschen.“**
   → `proben.loeschen` ist bei der Azubi-Rolle nicht gewährt (siehe Matrix). Im UI bereits als Sicherheitshinweis vorbereitet: `DeleteSampleDialog` zeigt schon heute den Text „Diese Aktion kann später im Audit-Log dokumentiert werden. Löschen ist später nur für Rollen außer Azubi erlaubt.“ – bei echter Anbindung wird daraus eine **serverseitig durchgesetzte** Firestore-Security-Rule (`request.auth.token.role != 'Azubi'`), nicht nur ein UI-Hinweis.

2. **„Admin und Laborleiter dürfen Mitarbeiter verwalten.“**
   → `administration.mitarbeiter_verwalten` ist bei beiden Rollen gewährt, bei Prüfer/Azubi/Gast nicht.

3. **„Admin darf Rollen, Standorte, Abrechnung, Branding und Systemeinstellungen verwalten.“**
   → Die 5 zugehörigen `administration.*`-Keys sind ausschließlich bei Admin gewährt (auch Laborleiter hat sie laut Mock-Daten **nicht**, mit Ausnahme von `mitarbeiter_verwalten`).

4. **„Gast hat nur eingeschränkte Leserechte.“**
   → Gast hat ausschließlich `*.ansehen`-Rechte (Dashboard, Proben, Prüfungen, Kunden, Projekte, Geräte, Laborbuch, Kalender) – keine Erstell-, Bearbeitungs- oder Löschrechte, kein PDF-Export, keine KI-Nutzung.

5. **„Mitarbeiter bei Kündigung nicht hart löschen, sondern Zugriff entziehen/deaktivieren.“**
   → `EmployeeStatus` kennt bereits `"Gesperrt"` als vollwertigen Status (kein hartes Löschen nötig). Empfehlung für die echte Anbindung:
   - UI-Aktion „Sperren“ setzt `status: "Gesperrt"` **und** widerruft serverseitig alle aktiven Firebase-Auth-Sessions/Custom-Claims des Mitarbeiters (z. B. via `revokeRefreshTokens`).
   - Historische Daten (erstellte Proben, Prüfwerte, Berichte) bleiben unverändert dem gesperrten Mitarbeiter zugeordnet (Referenz per `pruefer`/`bearbeiter`-Namen bzw. UID bleibt erhalten – **kein Kaskaden-Löschen**).
   - Ein echtes Löschen des `employees`-Dokuments ist nicht vorgesehen; falls DSGVO-Löschpflichten entstehen, gehört das in einen separaten, protokollierten Prozess (Anonymisierung statt Dokumentlöschung), nicht in die normale „Mitarbeiter verwalten“-Aktion.

---

## 5. Durchsetzung: UI vs. Firestore Security Rules

Heute (Mock-Prototyp): **keine** echte Durchsetzung – alle Aktionen sind für jeden im UI erreichbar (bewusst, da noch keine Firebase-Anbindung).

Geplant für die echte Anbindung, zweistufig:

1. **UI-Ebene (Komfort, keine Sicherheit):** Buttons/Menüpunkte je nach `permissions[key]` des eingeloggten Nutzers ein-/ausblenden (z. B. „Löschen“-Button für Azubi gar nicht erst anzeigen). Die dafür nötige Rollen-/Rechte-Struktur (`Role.permissions: Record<string, boolean>`) existiert bereits vollständig im Type-System.
2. **Firestore Security Rules (echte Sicherheit):** Jede Regel prüft `request.auth.token.companyId == resource.data.companyId` (Tenant-Isolation) **und** ein Custom Claim für die Rolle/Rechte des Nutzers, z. B.:

   ```
   match /companies/{companyId}/samples/{sampleId} {
     allow delete: if request.auth.token.companyId == companyId
                   && request.auth.token.role != 'Azubi';
   }
   ```

   Rollen-Rechte werden am besten als **Firebase Auth Custom Claims** beim Login/Rollenwechsel gesetzt (nicht bei jeder Rules-Auswertung aus Firestore nachgeladen, das wäre langsam und teuer) – die Custom Claims werden aus dem `roles/{roleId}`-Dokument des Nutzers per Cloud Function synchronisiert, sobald sich seine Rolle ändert.

---

## 6. Systemrollen-Schutz

Bereits im UI durchgesetzt (`RolesView.tsx`): Rollen mit `type: "System"` können **nicht gelöscht**, nur archiviert werden; die Lösch-Option wird im Menü für Systemrollen gar nicht erst angeboten. Bei echter Anbindung zusätzlich per Security Rule absichern:

```
allow delete: if resource.data.type != 'System';
```
