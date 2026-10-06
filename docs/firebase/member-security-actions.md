# Serverseitige Mitglieder-Aktionen (`assignRole`, `setMemberStatus`)

Status: **Implementiert.** Rolle und Status eines Mitarbeiters werden nur noch serverseitig geändert – **Employee und Membership in einer Transaktion**. Kein Rules Phase 2, keine Einladungsannahme, keine Firmen-Provisionierung, keine Custom Claims, kein Billing, kein E-Mail-Versand.

---

## 1. Warum Client-Sync nicht reicht

Die wirksame Rolle (und damit jede Berechtigung in den Rules) kommt aus `userMemberships/{uid}.roleId`; die Firmenzugehörigkeit und der Zugangsstatus ebenfalls aus der Membership. Der Mitarbeiter (`companies/{companyId}/employees/{employeeId}`) ist nur das Verwaltungsdokument. Bis zu diesem Slice liefen zwei getrennte Welten auseinander:

- `employees.roleId` ändern änderte die effektive Login-Rolle **nicht**,
- `employees.status = "Gesperrt"` sperrte die Membership **nicht**.

Ein Client darf `userMemberships` nicht schreiben (Rules: `allow create, update, delete: if false`) – und das soll so bleiben, sonst könnte sich jeder selbst befördern. Zwei getrennte Client-Writes wären außerdem nie atomar (Zwischenzustände, halbe Änderungen) und die Prüfungen „letzter Administrator“ und „Membership gehört wirklich zu diesem Mitarbeiter“ lassen sich in den Rules nicht ausdrücken (keine Zählung, keine Abfrage). Deshalb gibt es einen **Server** (Next.js Route Handler + Firebase Admin SDK), der Rechte, Konsistenz und Invarianten selbst prüft und beide Dokumente atomar schreibt.

## 2. Architektur

```
Browser                       Next.js Server (Node.js)                    Firestore
 EmployeesView
  └ useEmployees
     └ employeeService ──► POST /api/member-actions/assign-role ──► requestHandler
        (Firestore-Modus)    POST /api/member-actions/set-status       ├ ID-Token prüfen (Admin Auth)
        memberActionsClient  Authorization: Bearer <ID-Token>          ├ Body validieren
                                                                       └ memberActionsService
                                                                          └ Admin-SDK-Transaktion
                                                                             (lesen → entscheiden → schreiben)
```

| Datei | Aufgabe |
| --- | --- |
| `src/app/api/member-actions/assign-role/route.ts`, `…/set-status/route.ts` | dünne Route Handler (`runtime = "nodejs"`, nur `POST`) |
| `src/server/memberActions/requestHandler.ts` | Token, Body, Fehlerabbildung; Abhängigkeiten injizierbar (Tests) |
| `src/server/memberActions/memberActionsService.ts` | Transaktionen mit Admin SDK |
| `src/server/memberActions/firebaseAdmin.ts` | Admin-App, Token-Verifikation (nur Server) |
| `src/lib/security/memberActionRules.ts` | **reine** Autorisierungsentscheidung, Fehlercodes, Meldungen |
| `src/lib/services/memberActionsClient.ts` | Browser-Client (sendet das ID-Token) |
| `src/lib/security/memberLinkAudit.ts`, `scripts/auditMemberLinks.ts` | read-only Audit der Employee↔Membership-Verknüpfung |

Die Wahl „Route Handler statt Server Action“: der Server braucht ein explizites `Authorization`-Bearer-Token des Firebase-Clients (kein Cookie, daher kein CSRF-Risiko), einen stabilen JSON-Vertrag mit Fehlercodes und ist ohne Next.js-Laufzeit testbar (Web `Request`/`Response`). Es gab vorher keine Server-/Admin-Infrastruktur im Projekt; neu ist die Dependency `firebase-admin`.

**Admin SDK nie im Client-Bundle:** alles unter `src/server` wird nur von den Route Handlern importiert; `firebase-admin` ist in Next.js ohnehin ein `serverExternalPackage`. Der Client importiert nur `memberActionRules` (rein) und `memberActionsClient` (nutzt das Web-SDK `auth` und `fetch`).

## 3. Authentifizierung (ID-Token)

1. Der Client sendet `Authorization: Bearer <Firebase-ID-Token>` (`user.getIdToken()`).
2. Der Server verifiziert das Token mit dem Admin SDK (`verifyIdToken(token, true)`: Signatur, Ablauf, Projekt, **Widerruf**). Ergebnis ist **nur die UID**.
3. Kein Token, falsches Schema, ungültiges oder widerrufenes Token → `401 unauthenticated`.

Aus dem Request werden **nur** `employeeId`, `roleId` bzw. `status` (+ `reason`) gelesen. `companyId`, `actorRole`, `isAdmin`, `uid` und alle weiteren Felder werden ignoriert (Test: „Client-Felder werden ignoriert“).

### Konfiguration (nur Server, nie committen)

| Variable | Zweck |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON des Service-Accounts (als String) **oder** |
| `GOOGLE_APPLICATION_CREDENTIALS` | Pfad zur Service-Account-Datei (Application Default Credentials) |
| `FIREBASE_ADMIN_PROJECT_ID` | Projekt-ID (Fallback `NEXT_PUBLIC_FIREBASE_PROJECT_ID`) |
| `FIRESTORE_EMULATOR_HOST` | nur lokal/Tests: Emulator, dann sind keine Credentials nötig |

Fehlt die Konfiguration, antwortet der Server `503 server-not-configured` (kein Absturz beim Build/Import). Secrets werden nie geloggt oder an den Client gegeben; `.env.local` ist nicht Teil des Repos. Im Mock-Modus (`NEXT_PUBLIC_DATA_SOURCE ≠ firestore`) wird der Server nicht aufgerufen.

## 4. Serverseitige Autorisierung

Der Actor wird **nur** aus Firestore aufgelöst – dieselbe Kette wie in den Rules und in `usePermissions()`:

`userMemberships/{uid}` (aktiv, `companyId`) → `companies/{companyId}/roles/{roleId}` (Status „Aktiv“) → `permissions[key] === true` (`resolveEffectivePermissions`).

Archivierte/fehlende Rolle, fehlende `roleId`, gesperrte oder ungültige Membership gewähren nichts. Die **Firma des Actors** bestimmt alle Pfade: Mitarbeiter und Rollen werden ausschließlich unter `companies/{actorCompanyId}/…` gesucht; ein Mitarbeiter oder eine Rolle einer fremden Firma ist „nicht gefunden“. Beide Aktionen verlangen `administration.mitarbeiter_verwalten`.

## 5. `assignRole`

`POST /api/member-actions/assign-role` – Body `{ "employeeId", "roleId" }`.

Ablauf (eine Transaktion, Lesen vor Schreiben):

1. Actor laden, Rechte prüfen (früh abbrechen, bevor fremde Daten gelesen werden).
2. Ziel laden: Mitarbeiter in der Actor-Firma; **alle** Memberships der Firma mit `employeeId == Ziel`; deren Rollen; Zielrolle; aktive Administratoren.
3. `planAssignRole` entscheidet (Reihenfolge: Recht → Mitarbeiter → Membership/Konsistenz → Selbst → Zielrolle → geschützt → letzter Administrator).
4. Bei Freigabe schreibt der Server atomar:
   - `employees/{employeeId}`: `roleId`, `role` (Name aus dem **Rollen-Dokument**, nie vom Client), `updatedAt`, Historienmeldung („Rolle auf X geändert.“),
   - `userMemberships/{uid}`: `roleId`, `role`, `updatedAt`.

Zielrolle: muss existieren (`target-role-not-found`) und aktiv sein (`target-role-inactive`).

## 6. `setMemberStatus`

`POST /api/member-actions/set-status` – Body `{ "employeeId", "status": "Aktiv" | "Gesperrt", "reason"?: "revoke-access" }`.

Gleicher Ablauf, geschrieben werden `employees.status` und `userMemberships.status` (+ `updatedAt`, Historie: „Zugriff temporär gesperrt.“ / „Zugriff reaktiviert.“ / „Zugriff entzogen.“ bei `reason: "revoke-access"`). „Zugriff entziehen“ ist fachlich ebenfalls `Gesperrt`. Der Status „Ausstehend“ eines Mitarbeiters (Einladung) ist kein gültiges Ziel. Eine gesperrte Membership sperrt den App-Zugriff sofort (Rules und `MembershipGate`); die **Firebase-Anmeldung selbst** (Auth-User) bleibt unberührt.

## 7. Schutzregeln

### Eigener Account (`self-change-denied`)
Weder Rolle noch Status der eigenen Person – auch nicht als Administrator, auch nicht mit derselben Rolle. Erkannt über `membership.employeeId` des Actors (nie Name/E-Mail) **und** über die UID der gefundenen Ziel-Membership.

### Geschützte Rollen (`protected-role-denied`)
`PROTECTED_ROLE_PERMISSION_KEYS` (7 Schlüssel: 4 Restricted + `geraete.loeschen`, `laborbuch.loeschen`, `berichte.loeschen`) und die Administrator-Rolle `admin` sind nur mit `rollen.admin_verwalten` zuweisbar. Zusätzlich ist ein **Ziel-User**, dessen aktuelle Rolle geschützt oder nicht auflösbar ist, nur mit `rollen.admin_verwalten` änderbar: maßgeblich die wirksame Rolle der Membership (fehlende/unbekannte `roleId` → geschützt, fail-closed); eine geschützte Employee-Rolle zählt ebenfalls (eine unbekannte Employee-Rolle nicht, da die Membership maßgeblich ist). Das spiegelt `roleIdIsProtected` der Rules.

### Letzter Administrator (`last-admin-denied`)
Quelle der Policy: `docs/database/permissions.md` („Mindestens ein aktiver Administrator muss bleiben“). Definition: **aktiver Administrator = Membership mit `status == "Aktiv"` und `roleId == "admin"`** (die unveränderliche Systemrolle). Custom Roles mit `rollen.admin_verwalten` zählen **nicht** – nur die Systemrolle kann nicht archiviert oder bearbeitet werden. Verboten sind

- eine andere Rolle für den einzigen aktiven Administrator (`assignRole` mit `roleId ≠ "admin"`),
- das Sperren des einzigen aktiven Administrators (`setMemberStatus` mit `Gesperrt`).

Reaktivieren und „Rolle admin bleibt admin“ sind nie blockiert. Gezählt wird in derselben Transaktion (Abfrage `companyId + roleId == "admin" + status == "Aktiv"`). Der eigene Datensatz scheitert schon vorher an `self-change-denied`.

### Konsistenz Employee ↔ Membership (fail-closed, keine stille Reparatur)
Vor jeder Änderung muss gelten: der Mitarbeiter existiert in der Actor-Firma (`employee-not-found`), genau **eine** Membership der Firma zeigt auf ihn (`membership-not-found` / `membership-employee-mismatch` bei mehreren), deren `companyId` und `employeeId` passen, und der Mitarbeiter ist nicht „Ausstehend“. Eine **Divergenz der Rolle oder des Status** (Employee ≠ Membership) ist kein Fehler – sie ist genau das, was die Aktion korrigiert: beide Dokumente werden auf denselben Wert gesetzt.

## 8. Atomizität

Alle Lesezugriffe (Actor, Rolle, Mitarbeiter, Memberships, Zielrolle, Administratoren) und beide Schreibzugriffe laufen in **einer** Admin-SDK-Transaktion (`db.runTransaction`). Eine Ablehnung oder ein Fehler vor dem Commit schreibt nichts. Ändert sich zwischen Lesen und Schreiben ein gelesenes Dokument (z. B. ein zweiter Administrator wird gesperrt), wiederholt Firestore die Transaktion mit frischen Daten. Test: ein erzwungener Fehler beim Membership-Write lässt den Mitarbeiter unverändert.

## 9. Employee ↔ Membership: die Verknüpfung

Es gibt **keine neue `uid`-Spalte am Mitarbeiter**. Die stabile, serverseitig gepflegte Verknüpfung existiert bereits: `userMemberships/{uid}.employeeId == employees/{employeeId}` (Membership ist client-schreibgeschützt). Der Server leitet die Ziel-UID aus der Membership-Abfrage ab (`companyId` + `employeeId`); nichts davon kommt vom Client und **E-Mail/Name sind nie Sicherheitsidentität**. Eine `uid` am Mitarbeiter wäre ein zweiter, vom Client schreibbarer Verweis und würde nur ein Manipulationsrisiko schaffen.

## 10. Fehlercodes

Stabile Codes (`MemberActionErrorCode`), HTTP-Status, deutsche Meldung für die UI. Keine Firebase-Details, Pfade oder Stacktraces im Response; unerwartete Fehler werden serverseitig nur mit dem Fehlernamen geloggt und als `internal-error` beantwortet.

| Code | HTTP | Bedeutung |
| --- | --- | --- |
| `unauthenticated` | 401 | kein/ungültiges/widerrufenes Token |
| `invalid-request` | 400 | Body ungültig (IDs, Status, Größe) |
| `membership-missing` / `membership-blocked` / `membership-invalid` | 403 | Actor ohne/gesperrte/fehlerhafte Membership |
| `permission-denied` | 403 | Recht fehlt oder Rollenkette defekt |
| `employee-not-found` | 404 | Mitarbeiter nicht in der Actor-Firma |
| `membership-not-found` | 409 | Mitarbeiter ohne Zugang |
| `target-role-not-found` / `target-role-inactive` | 404 / 409 | Zielrolle fehlt / archiviert |
| `protected-role-denied` | 403 | geschützte Rolle/Person ohne `rollen.admin_verwalten` |
| `self-change-denied` | 403 | eigene Rolle/eigener Status |
| `last-admin-denied` | 409 | letzter aktiver Administrator |
| `membership-employee-mismatch` | 409 | Verknüpfung nicht eindeutig/konsistent |
| `server-not-configured` | 503 | Admin SDK nicht konfiguriert |
| `internal-error` | 500 | unerwarteter Fehler |

Der Browser-Client (`memberActionsClient`) liefert `MemberActionClientError` (zusätzlich Code `network`); die UI zeigt dessen Meldung (Toast bzw. Dialog), sonst die bisherige Standardmeldung.

## 11. Client-Umbau

- `employeeService` (Firestore-Modus): `assignRole`, `suspendEmployee`, `reactivateEmployee`, `revokeAccess` rufen den Server; danach ersetzt `useEmployees` den Mitarbeiter durch die Serverantwort (kein optimistisches Update, kein Refetch nötig). Standort/Kontaktdaten bleiben normale Client-Writes.
- `firestoreEmployeeService.updateEmployee` lehnt `roleId`, `role` und `status` ab; die Methoden `suspendEmployee/reactivateEmployee/revokeAccess` sind dort entfernt.
- Mock-Modus unverändert (Repository).
- Texte: Im Firestore-Modus sagt die UI nicht mehr „Employee-Rolle ändert deine Rechte nicht“, sondern dass Rolle/Status serverseitig auch für den Zugang übernommen werden (Banner, Rollendialog, Sperrdialoge, Detail-Drawer). Im Demo-Modus steht, dass es reine Verwaltungsdaten sind.

## 12. Firestore Rules

`firestore.rules` wurde in **einem** Punkt gehärtet: `employees/{id}` `update` verbietet **jedem Client** Änderungen an `roleId`, `role` und `status` (`changesServerOnlyEmployeeFields()`, erfasst auch Hinzufügen/Entfernen) – auch dem Administrator, auch am eigenen Dokument. Die frühere Regel „nie die eigene Rolle/den eigenen Status“ und die Prüfung der **neuen** `roleId` sind damit überflüssig und entfernt; die Prüfung der **aktuellen** Rolle des Ziels (`roleIdIsProtected`) für unkritische Felder bleibt. Erlaubt bleiben Standort, Kontaktdaten, Historie. `userMemberships` bleibt client-read-only, `create/delete` für `employees` bleibt verboten. Das Admin SDK umgeht die Rules (nur serverseitig).

Tests: `tests/firestore/phase1-employees.test.ts` (Client-Verbote), `tests/firestore/rules-config-sync.test.ts`.

## 13. Migration / Bestehende Daten

Keine automatische Migration, kein Mapping über E-Mail. Voraussetzung pro Person mit Zugang: genau eine Membership (`userMemberships/{uid}`) mit `companyId` und **`employeeId`** auf den Mitarbeiter. Bestehende Daten prüft das Read-only-Skript:

```bash
# Zugangsdaten wie der Server (Service-Account nie committen); lokal mit FIRESTORE_EMULATOR_HOST
npx tsx scripts/auditMemberLinks.ts            # alle Firmen
npx tsx scripts/auditMemberLinks.ts --company <companyId>
```

Befunde: `membership-without-employee-id`, `membership-employee-missing`, `employee-multiple-memberships` (= **error**, die Aktionen lehnen diese Person fail-closed ab), `role-divergence`/`status-divergence` (= **warning**, die nächste Aktion gleicht sie an) und `employee-without-membership` (= info; „Ausstehend“ ist normal). Behebung ist ein bewusster manueller Operator-Schritt (z. B. `employeeId` an der Membership setzen), nie automatisch. Die Seeds (`scripts/seedUserMemberships.ts`) setzen `employeeId` bereits.

## 14. Tests

- `tests/config/member-action-rules.test.ts` – reine Entscheidungslogik, Request-Validierung, Fehlercodes, Last-Admin-Definition.
- `tests/config/member-link-audit.test.ts` – Audit.
- `tests/firestore/member-actions.test.ts` – **Admin SDK gegen den Firestore-Emulator**: `assignRole`, `setMemberStatus` (Erfolgs-/Ablehnungsfälle, Teiländerungs-Prüfung, Atomizität über erzwungenen Fehler), HTTP-Schicht (kein/ungültiges Token – auch mit der echten Admin-SDK-Prüfung –, gesperrte Membership, falsche Firma, ignorierte Client-Felder, Fehlercodes, kein Leak interner Fehler).
- Auth: Für die meisten Tests ersetzt ein Fake-Verifier die Token-Prüfung (`token-<uid>`); ein kaputtes Token wird mit der echten Admin-SDK-Prüfung getestet (scheitert beim Dekodieren, ohne Netzwerk). Eine **gültige Signaturprüfung** braucht echte Schlüssel oder den Auth-Emulator und ist nicht Teil dieser Tests.

## 15. Nicht Teil dieses Slices

Einladung annehmen (Employee/Membership entstehen), Firmen-Provisionierung/`createCompany`, Rules Phase 2 (Fach-Collections), Fachseiten-Gating, Custom Claims, Auth-Benutzer sperren/anlegen, Passwort-Reset, Billing, E-Mail-Versand, Audit-Log.
