# Statuswerte & Übergänge (Planung)

Status: **Planungsdokument – keine echte Firebase-Anbindung.** Alle Statusübergänge sind heute rein clientseitig (React State), ohne Persistenz. Dieses Dokument fasst zusammen, welche Status-Enums bereits in `src/types/*.ts` modelliert sind und welche Übergänge die bestehenden View-Komponenten bereits anbieten – als Grundlage für spätere serverseitige Validierung (Cloud Functions bzw. Security Rules, die ungültige Statussprünge ablehnen).

**Grundprinzip, das durchgängig gilt:** *„Archiviert“ ist überall ein echter, vollwertiger Status* – nie ein separates Boolean-Flag. Das wurde bewusst so entschieden (siehe Kommentare in `types/project.ts`, `types/customer.ts`, `types/device.ts`, `types/sample.ts`), nachdem eine frühere Flag-basierte Lösung archivierte Datensätze faktisch unauffindbar gemacht hatte. Jedes Modul mit Archivierung bietet deshalb sowohl „Archivieren“ als auch „Reaktivieren“ als echten Statuswechsel an, und jede Listenansicht hat einen eigenen „Archiviert“-Filter, der archivierte Datensätze sichtbar hält.

---

## 1. Projekte (`ProjectStatus`)

**Werte:** `Aktiv` · `Pausiert` · `Abgeschlossen` · `Archiviert`

```
Aktiv ──pause──► Pausiert ──resume──► Aktiv
Aktiv ──complete──► Abgeschlossen ──reopen──► Aktiv
Pausiert ──complete──► Abgeschlossen
(Aktiv | Pausiert | Abgeschlossen) ──archive──► Archiviert ──reactivate──► Aktiv
```

`overdue` ist **kein Status**, sondern ein reiner Anzeige-Hinweis (`boolean`) für aktive Projekte, deren Fälligkeitsdatum verstrichen ist.

## 2. Kunden (`CustomerStatus`)

**Werte:** `Aktiv` · `Inaktiv` · `Archiviert`

```
Aktiv ⇄ Inaktiv (deactivate / reactivate)
(Aktiv | Inaktiv) ──archive──► Archiviert ──reactivate──► Aktiv
```

## 3. Geräte (`DeviceStatus`)

**Werte:** `Einsatzbereit` · `Kalibrierung fällig` · `Wartung fällig` · `Außer Betrieb` · `Archiviert`

```
Einsatzbereit ⇄ Außer Betrieb (deactivate / reactivate)
(alle Status außer Archiviert) ──archive──► Archiviert ──reactivate──► Einsatzbereit
```

`Kalibrierung fällig` / `Wartung fällig` werden heute nicht per Nutzeraktion gesetzt, sondern sind vorgesehen, um automatisch anhand von `nextCalibration`/`nextMaintenance` (Datumsvergleich) berechnet zu werden – ein guter Kandidat für eine tägliche Cloud-Function-Prüfung bei echter Anbindung, statt eines manuell gepflegten Felds.

## 4. Proben (`SampleStatus`)

**Werte:** `Offen` · `Vorbereitung` · `In Prüfung` · `Überfällig` · `Abgeschlossen` · `Archiviert`

```
(Offen | Vorbereitung) ──start──► In Prüfung
(In Prüfung | Überfällig) ──complete──► Abgeschlossen ──reopen──► In Prüfung
(alle Status außer Archiviert) ──archive──► Archiviert ──reactivate──► Abgeschlossen
```

`Überfällig` ist wie bei Geräten ein Kandidat für eine automatische, datumsbasierte Herleitung (Prüfdatum in der Vergangenheit + Status noch nicht `Abgeschlossen`) statt eines manuell gesetzten Status.

**Löschregel:** Proben dürfen grundsätzlich gelöscht werden, aber laut Rollenkonzept **nicht von der Azubi-Rolle** (siehe `permissions.md`). Löschen ist unabhängig vom Status möglich (kein Statusübergang, sondern Dokumentlöschung) und soll im Audit-Log dokumentiert werden.

## 5. Prüfwerte (`TestEntryStatus`, je Prüfung)

**Werte:** `Offen` · `Vorbereitung` · `In Bearbeitung` · `Abgeschlossen` · `Überfällig`

```
(Offen | Vorbereitung) ──start──► In Bearbeitung
(In Bearbeitung | Überfällig) ──complete──► Abgeschlossen ──reopen──► In Bearbeitung
```

Kein `Archiviert`-Status – Prüfwerte werden nicht einzeln archiviert, sondern folgen implizit dem Lebenszyklus ihrer Probe. Innerhalb eines `TestEntry` haben einzelne Messwertzeilen (`PruefartRow`) zusätzlich einen einfachen Zeilenstatus `PruefartRowStatus`: `OK` · `Offen` (rein informativ, keine eigene Workflow-Logik).

## 6. Berichte (`ReportStatus`)

**Werte:** `Entwurf` · `Fertig` · `PDF exportiert` · `Excel exportiert` · `Archiviert`

```
Entwurf ──markDone──► Fertig ──saveDraft──► Entwurf
(Entwurf | Fertig) ──exportPdf──► PDF exportiert
(Entwurf | Fertig) ──exportExcel──► Excel exportiert
(alle Status außer Archiviert) ──archive──► Archiviert ──reactivate──► Fertig
```

> **Wichtig für die echte Anbindung:** „PDF exportiert“/„Excel exportiert“ dürfen erst gesetzt werden, **nachdem** eine echte Export-Funktion (heute nicht angebunden) erfolgreich eine Datei erzeugt hat – nicht vorher, wie es der heutige UI-Mock (rein clientseitiger Statuswechsel ohne echte Datei) tut. Sinnvoller Kandidat für eine Cloud Function, die nach erfolgreichem PDF-/Excel-Export den Status serverseitig setzt.

## 7. Laborbuch (`LaborbookStatus`)

**Werte:** `Aktiv` · `Archiviert`

```
Aktiv ──archive──► Archiviert ──reactivate──► Aktiv
```

Einfachster Workflow im gesamten Modell – nur zwei Zustände.

## 8. Einladungen (`InvitationStatus`)

**Werte:** `Offen` · `Angenommen` · `Abgelaufen` · `Widerrufen`

```
Offen ──(Nutzer akzeptiert Einladung)──► Angenommen
Offen ──(expiresAt überschritten)──► Abgelaufen
Offen ──revoke──► Widerrufen
Offen ──resend──► Offen (neue Einladungs-Mail, expiresAt wird erneuert)
```

Kein eigener „Archiviert“-Status: Nicht mehr benötigte Einladungen werden **gelöscht** (`onDelete`), nicht archiviert – Einladungen sind Vorgangsdaten mit natürlichem Enddatum, kein dauerhaft referenzierter Stammdatensatz wie Proben/Projekte.

> **Hinweis:** Es gibt zwei verschiedene `InvitationStatus`-Definitionen im Code – `types/invitation.ts` (`Offen`/`Angenommen`/`Abgelaufen`/`Widerrufen`, oben dokumentiert, wird aktiv im Einladungen-Modul verwendet) und ein älterer, schmalerer `InvitationStatus` in `types/employee.ts` (`Angenommen`/`Ausstehend`, nur für das eingebettete `Employee.invitationStatus`-Feld). Bei der echten Anbindung sollte geprüft werden, ob beide wirklich unterschiedliche Konzepte sind (Einladungsvorgang vs. Mitarbeiter-Einladungsstatus) oder ob sich das vereinheitlichen lässt.

## 9. Mitarbeiter (`EmployeeStatus`)

**Werte:** `Aktiv` · `Gesperrt` · `Ausstehend`

```
Ausstehend ──(Einladung akzeptiert)──► Aktiv
Aktiv ──suspend──► Gesperrt ──reactivate──► Aktiv
```

Kein „Archiviert“ – siehe `permissions.md` Regel 5: bei Kündigung wird **gesperrt**, nicht gelöscht oder archiviert. `Gesperrt` übernimmt hier fachlich die Rolle, die „Archiviert“ in anderen Modulen hat (dauerhaft inaktiv, aber referenzierbar und reaktivierbar).

> Auch hier existiert eine zweite `EmployeeStatus`-Definition in `types/company.ts` (`online`/`away`/`offline` – reine Präsenzanzeige für das Dashboard-Widget `CompanyEmployeesList`, kein Lebenszyklus-Status). Beide Typen lösen unterschiedliche Aufgaben (Lebenszyklus vs. Online-Präsenz) und sollten **nicht** zusammengeführt werden, aber der gleiche Name an zwei Stellen ist beim Onboarding neuer Entwickler:innen verwirrend – bei Gelegenheit umbenennen (z. B. `EmployeePresence`).

## 10. Standorte (`LocationStatus`)

**Werte:** `Aktiv` · `Inaktiv`

```
Aktiv ⇄ Inaktiv (toggle)
```

Einfachster Workflow neben Laborbuch. **Kein** `Archiviert`-Status vorgesehen – im Unterschied zu den anderen Modulen ist ein Standort entweder in Betrieb oder nicht; bei Bedarf könnte hier künftig ebenfalls ein echter `Archiviert`-Status ergänzt werden, falls stillgelegte Standorte langfristig von aktiven Standorten unterschieden werden sollen (aktuell nicht gefordert).

## 11. Rollen (`RoleStatus`, ergänzend – im Sprint-Brief nicht explizit gelistet, aber vorhanden)

**Werte:** `Aktiv` · `Archiviert`

```
Aktiv ──archive──► Archiviert ──reactivate──► Aktiv
```

**Löschregel:** Rollen mit `type: "System"` (Admin, Laborleiter, Prüfer, Azubi, Gast) können **nicht gelöscht** werden, nur archiviert. Nur benutzerdefinierte Rollen (`type: "Benutzerdefiniert"`) sind löschbar.

---

## 12. Zusammenfassung: Archivierungs-Strategie je Modul

| Modul | Hat „Archiviert“ als Status? | Alternative bei „nicht mehr aktiv“ |
|---|---|---|
| Projekte | ✅ | – |
| Kunden | ✅ | – |
| Geräte | ✅ | – |
| Proben | ✅ | – |
| Berichte | ✅ | – |
| Laborbuch | ✅ | – |
| Rollen | ✅ | (Systemrollen: kein Löschen) |
| Prüfwerte | ❌ | folgt Lebenszyklus der Probe |
| Einladungen | ❌ | Löschen (Vorgangsdaten, kein Stammdatensatz) |
| Mitarbeiter | ❌ | `Gesperrt` (siehe Regel „nicht hart löschen“) |
| Standorte | ❌ | `Inaktiv` (kein zusätzlicher Archiv-Status nötig) |
