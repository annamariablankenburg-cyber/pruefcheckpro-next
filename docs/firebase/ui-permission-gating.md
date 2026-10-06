# UI Permission Gating (`usePermissions()`)

Status: **Implementiert.** Die Oberfläche lädt die effektiven Rechte des eingeloggten Users und passt sich an (Tabs, Listen, Aktionen, Rollen-Editor). Das ist **Komfort/UX, keine Sicherheit** – die Firestore Rules (Phase 1: `roles`, `employees`, `invitations`, `locations`) bleiben die Sicherheitsgrenze. Siehe `docs/firebase/role-permission-rules-phase1.md`.

> **Nicht Teil dieses Slices:** Änderungen an `firestore.rules`, Rules Phase 2 (die acht Fach-Collections), Membership-Schreiblogik, Admin SDK, Membership↔Employee-Synchronisierung.
>
> **Update (Server-Slice):** Die Membership↔Employee-Synchronisierung ist inzwischen umgesetzt (`docs/firebase/member-security-actions.md`): Rolle ändern, sperren, reaktivieren und Zugriff entziehen laufen über den Server. Die Aktions-Policy der UI (`getEmployeeActionPolicy`) bleibt unverändert – der Server prüft zusätzlich selbst.

---

## 1. Quelle der effektiven Rechte

Identisch zur Rules-Kette:

```
userMemberships/{uid}.roleId  →  companies/{companyId}/roles/{roleId}  →  role.permissions[key] === true
```

Ausdrücklich **nicht** verwendet: `users/{uid}.role`, `membership.role`, `Employee.role`, `Employee.roleId`. Es gibt keine zweite Rollenquelle.

Dateien:

| Datei | Aufgabe |
| --- | --- |
| `src/lib/permissions/permissionRules.ts` | Reine Auflösung: `resolveEffectivePermissions({membership, role})`, `hasPermission/hasAnyPermission/hasAllPermissions`, `emptyPermissions()`, `demoPermissions()` (nur Mock). Nutzt `evaluateMembership` und `normalizePermissions()`. |
| `src/lib/permissions/gatingRules.ts` | Reine UI-Policy: `getCompanyAccess`, Tab-Sichtbarkeit, `pickActiveTab`, geschützte Rollen/Rechte, `getEmployeeActionPolicy`. |
| `src/providers/PermissionsProvider.tsx` | Provider + `usePermissions()`. Lädt Membership und Rolle **live** (`onSnapshot`). |
| `firestoreUserMembershipService.watchMembership`, `firestoreRoleService.watchRoleById` | Live-Listener für Membership bzw. eigene Rolle. |

Der `PermissionsProvider` lebt einmal zentral in `src/app/(app)/layout.tsx` **unterhalb** von `MembershipGate`. Er startet einen zusätzlichen Live-Listener auf die Membership (der `AuthProvider` lädt sie für das `MembershipGate` separat, der Listener macht `roleId`/Status live) und einen Listener auf die effektive Rolle; es gibt keine separaten Permission-/Role-Fetches pro Button oder Unteransicht.

## 2. `usePermissions()`

Rückgabe: `permissions`, `hasPermission(key)`, `hasAnyPermission(keys)`, `hasAllPermissions(keys)`, `loading`, `error`, `reason`, `roleId`, `role`, `isDemo`, `retry`.

### Fail-closed

| Zustand | Ergebnis |
| --- | --- |
| Membership lädt / noch nicht geprüft | `loading`, keine Rechte |
| Membership fehlt, blockiert oder ungültig | keine Rechte (`reason`) |
| `roleId` fehlt oder leer | keine Rechte |
| Rollen-Dokument fehlt, `role.id ≠ membership.roleId` | keine Rechte |
| Rolle nicht `"Aktiv"` (z. B. archiviert) | keine Rechte (die Rules gewähren dann auch nichts) |
| Listener-Fehler | keine Rechte + `error` („Berechtigungen konnten nicht geladen werden.“), `retry()` |
| Schlüssel fehlt / unbekannt | `false`; unbekannte Schlüssel werden von `normalizePermissions()` verworfen |

Kein Admin-Fallback. Im **Firestore-Modus** gibt es nie Demo-Rechte; im **Mock-Modus** (`NEXT_PUBLIC_DATA_SOURCE ≠ firestore`) gewährt der Provider alle Rechte (`isDemo`), damit die Demo bedienbar bleibt.

### Live-Updates

Membership (`roleId`, Status) und Rollen-Dokument (Status, `permissions`) werden per `onSnapshot` beobachtet; ein Wechsel der Rolle, eine Archivierung oder eine Rechteänderung wirkt ohne Neuladen. Kein veralteter Snapshot.

## 3. Company-Seite

`src/app/(app)/company/page.tsx` ruft `usePermissions()` einmal auf, berechnet `getCompanyAccess(permissions)` und reicht die Rechte nach unten.

### Tabs

| Tab | Sichtbar mit |
| --- | --- |
| Übersicht | mindestens eines der neun Ansehen-/Verwalten-Rechte (Standorte, Mitarbeiter, Rollen, `administration.*`) |
| Standorte | `standorte.ansehen` |
| Mitarbeiter | `mitarbeiter.ansehen` |
| Einladungen | `administration.mitarbeiter_verwalten` |
| Rollen & Rechte | `rollen.ansehen` (das Lesen der **eigenen** Rolle genügt nicht) |
| Einstellungen | `administration.branding_aendern`, `…abrechnung_verwalten` oder `…systemeinstellungen_aendern` |

Der aktive Tab ist **abgeleitet** (`pickActiveTab(requested, visible)`): ist der gewünschte Tab (URL `?tab=` oder State) nicht erlaubt, gilt der erste sichtbare. Kein Effekt, keine URL-/State-Schleife; die hydrationssichere Tab-Initialisierung bleibt unverändert.

Zustände: Rechte laden → Skeleton; Rechte-Fehler → Karte mit „Erneut versuchen“; kein Tab erlaubt → neutraler Hinweis „Für deinen Zugang sind hier keine Verwaltungsbereiche freigeschaltet.“ (kein Firebase-Fehler).

### Geladen wird nur, was gelesen werden darf

Die Hooks haben einen `enabled`-Parameter (`useLocations`, `useRoles`, `useEmployees`, `useInvitations`). Ist er `false` (Rechte laden/fehlen), wird **nicht** gelesen; Daten sind leer, kein `loading`, kein `error`. Das globale Mitarbeiterverzeichnis wird ohne `mitarbeiter.ansehen` nicht geladen, Einladungen nicht ohne `administration.mitarbeiter_verwalten`. Erwartete Permission-Denied-Fehler entstehen so gar nicht; echte Fehler bleiben sichtbar (Permission-Denied wird **nicht** global verschluckt).

### Übersicht / Einstellungen

Standortliste nur mit `standorte.ansehen`; Mitarbeiterliste nur mit `mitarbeiter.ansehen`; Lizenzkarte und Schnellaktionen (Branding, Abrechnung) nur mit den jeweiligen Rechten; „Neuer Standort“ nur mit Verwalten; „Neuer Mitarbeiter“ nur, wenn Einladen möglich ist. Primärstandort-Karte nur mit `standorte.ansehen`.

## 4. Abhängigkeiten Lesen ⇄ Verwalten (UX)

Die Services lesen vor dem Schreiben (Transaktionen/Duplikatprüfung). Deshalb bietet die UI Aktionen nur an, wenn das passende Leserecht **zusätzlich** vorhanden ist (die Rules würden „Verwalten ohne Ansehen“ zwar blind zulassen, die App-Aktion würde aber scheitern):

| Aktion | Benötigt |
| --- | --- |
| Mitarbeiter verwalten (Standort, Status) | `mitarbeiter.ansehen` + `administration.mitarbeiter_verwalten` |
| Mitarbeiter-Standort ändern | zusätzlich `standorte.ansehen` (Dialog braucht die Standortliste) |
| Mitarbeiter-Rolle ändern | zusätzlich `rollen.ansehen` |
| Einladung erstellen | `administration.mitarbeiter_verwalten` + `mitarbeiter.ansehen` + `rollen.ansehen` + `standorte.ansehen` (Duplikatprüfung, Rollenvalidierung, Standortliste) |
| Einladung widerrufen | `administration.mitarbeiter_verwalten` |
| Standort anlegen/bearbeiten/(de)aktivieren | `standorte.ansehen` + `administration.standorte_verwalten` (kein Hard-Delete) |
| Rolle anlegen/bearbeiten/archivieren | `rollen.ansehen` + `administration.rollen_verwalten` |

Fehlen beim Einladen nur Leserechte, zeigt der Einladungs-Tab einen Hinweis mit den fehlenden Bereichen statt der Schaltflächen.

## 5. Mitarbeiter (`getEmployeeActionPolicy`)

- Liste nur mit `mitarbeiter.ansehen`; ohne Verwalten reine Leseansicht (Hinweis, nur „Details“).
- Eigener Datensatz (über `membership.employeeId`, nie über Name/E-Mail): **Rolle und Status nie änderbar** (keine Selbstbeförderung/Selbstsperre), Standort schon.
- Ziel mit Administrator-/geschützter Rolle, unauflösbarer oder fehlender `roleId`: nur mit `rollen.admin_verwalten` (Spiegel der Rules). **Fail-closed:** Lässt sich die Zielrolle nicht sicher auflösen (Rollenliste nicht verfügbar, z. B. ohne `rollen.ansehen`; unbekannte oder fehlende `roleId`), gilt sie als geschützt – ohne `rollen.admin_verwalten` werden dann keine Verwaltungsaktionen angeboten (sonst würden die Rules sie mit `permission-denied` ablehnen). Mit `rollen.admin_verwalten` bleibt die Verwaltung auch ohne Rollenliste möglich.
- Rollenauswahl im Dialog: geschützte Rollen nur mit `rollen.admin_verwalten` (`filterAssignableRoles`).
- Hinweis-Texte stellen klar: Die Employee-Rolle ändert die **effektiven** Zugriffsrechte nicht (siehe Abschnitt 9).

## 6. Rollen & geschützte Rechte

Die geschützte Menge kommt aus der Config (`PROTECTED_ROLE_PERMISSION_KEYS`, 7 Schlüssel: 4 Restricted + `geraete.loeschen`, `laborbuch.loeschen`, `berichte.loeschen`); es gibt keine zweite hartkodierte Liste. Die drei Löschrechte haben `risk === "destructive"`, sind aber Admin-only editierbar.

Ohne `rollen.admin_verwalten` (z. B. Laborleiter):

- geschützte Schalter sind **deaktiviert** und mit „Nur Administrator“ markiert (`PermissionCategory`/`PermissionSwitch`);
- die Administrator-Rolle ist nicht bearbeitbar; normale Custom Roles bleiben editierbar;
- beim **Anlegen, Kopieren, Duplizieren und aus Vorlagen** werden geschützte Rechte auf `false` gesetzt (`stripProtectedPermissions`), mit Hinweis im Dialog;
- Rollen ansehen ohne `administration.rollen_verwalten`: Drawer ohne Bearbeiten/Kopieren/Duplizieren/Archivieren (nur Exportieren), „Neue Rolle“ ausgeblendet; Benutzerzahlen nur, wenn die Mitarbeiterliste verfügbar ist.

## 7. Read-only-Zustände

Lesen ohne Schreiben blendet Aktionen aus (Standorte: Bearbeiten/Deaktivieren/Neu; Rollen: Editor-Aktionen; Mitarbeiter: Menüs; Einladungen: Erstellen). Die Seite bleibt nutzbar, es entstehen keine unnötigen Permission-Fehler.

## 8. `AdminView`

Lädt Rollen nur mit `rollen.ansehen`; sonst Hinweis „Für deinen Zugang ist die Rollenübersicht nicht freigeschaltet.“ und KPI „–“. Die übrigen Daten der Seite sind weiterhin Mock.

## 9. Membership ⇄ Employee (unverändert)

*(Historisch, vor dem Server-Slice:)* `Employee.roleId` und `Membership.roleId` liefen auseinander. **Inzwischen** gleichen `assignRole`/`setMemberStatus` beide atomar an (`docs/firebase/member-security-actions.md`); bei Altdaten mit Divergenz gilt weiter die **Membership**. Die UI richtet sich ausschließlich nach der **Membership**-Rolle des eingeloggten Users. Texte zu „Rolle ändern“/Sperren weisen darauf hin, dass der Employee-Datensatz die Anmelde-Rechte nicht ändert.

## 10. UI ≠ Security

- Ein manipulierter Client umgeht das Gating – nur die Rules schützen.
- Eine Rollenänderung/Archivierung wirkt live, aber nur, wenn die Membership die Rolle referenziert.
- **Rules Phase 2 ist inzwischen umgesetzt** (`docs/firebase/role-permission-rules-phase2.md`): `customers`, `projects`, `devices`, `samples`, `testValues`, `reports`, `calendarEvents`, `laborbook` prüfen `*.ansehen/erstellen/bearbeiten/loeschen`. Das **UI-Gating dieser Fachseiten** (Kunden, Projekte, Geräte, …) ist weiterhin nicht umgesetzt (nächster Slice „UI Permission Gating Phase 2“; offene Stellen in Abschnitt 8 der Phase-2-Doku).

## 11. Tests

`npm run test:permissions` (70 Tests):

- `tests/config/permission-resolution.test.ts`: Administrator → alle 45; Laborleiter/Prüfer/Azubi/Gast nach Matrix; fehlende/archivierte Rolle, fehlende `roleId`, blockierte Membership → keine Rechte; fehlender Schlüssel → `false`; unbekannter Schlüssel nicht wirksam.
- `tests/config/gating.test.ts`: Tabs je Systemrolle; Lesen/Verwalten-Abhängigkeiten; Einladen-Voraussetzungen; Tab-Fallback; geschützte Rechte/Rollen; Mitarbeiter-Aktionen (eigener Datensatz, geschützte Ziele, Standort-Abhängigkeit).

Es gibt kein Komponenten-Test-Setup; die Policy ist deshalb in reinen Funktionen gekapselt. `npm run test:rules` (711 Tests) bleibt unverändert.
