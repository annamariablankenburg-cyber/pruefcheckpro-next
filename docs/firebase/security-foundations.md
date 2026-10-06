# Security Foundations (Auth Membership + Firestore Rules)

> **Update (Rules Phase 1):** Für `roles`, `employees`, `invitations` und `locations` gilt jetzt eine rollenbasierte Durchsetzung (siehe `docs/firebase/role-permission-rules-phase1.md`; im Emulator getestet). Für die übrigen acht Company-Collections gilt weiterhin nur dieses Fundament.

Status: **Fundament, noch keine rollenbasierte Durchsetzung (für die acht Fach-Collections weiterhin).** Dieser Slice führt eine geprüfte Zuordnung „Firebase-Auth-User → Firma“ ein und härtet die Firestore Rules darauf. Er ändert keine fachlichen Slices (Kunden, Projekte, …, Rollen, Mitarbeiter, Einladungen) und setzt **keine** Rollen- oder Permission-Auswertung um.

> **Nicht Teil dieses Slices (und nicht simuliert):** Auth-Benutzer anlegen/löschen, Passwörter zurücksetzen, Custom Claims, Firebase Admin SDK, Cloud Functions, echtes User-Provisioning, rollenbasierte Rules. **Ein Membership-Dokument allein erstellt keinen Firebase-Auth-Benutzer.**

---

## 1. Ist-Stand vor dem Slice

| Frage | Antwort |
|---|---|
| Wie wurde die Company des eingeloggten Users bestimmt? | Gar nicht. `resolveCompanyId()` gab immer `"demo-company"` zurück (Dev-Fallback), der Auth-Context lieferte keine `companyId`. |
| Gab es `users/{uid}`? | Ja – als **Login-Profil** (`AppUser`), clientseitig von Registrierung (`createUserProfile`) und Login (`updateLastLogin`) geschrieben. |
| Felder | `id`, `firstName`, `lastName`, `email`, `role` (`UserRole`, bei Registrierung fest `"azubi"`), `plan`, `language`, `theme`, `createdAt`, `lastLogin`. `companyId`/`laboratoryId` im Typ vorgesehen, aber nie geschrieben. |
| Verbindung zum Employee? | Keine. |
| Woher käme die Rolle? | Nur aus dem Profilfeld `users/{uid}.role` (alte `UserRole`-Semantik, nichts mit den neuen Rollen-Dokumenten zu tun). |
| Sicherheitslücke | `belongsToCompany` las `users/{uid}.companyId` – ein Feld, das nie gesetzt wurde und in einem clientschreibbaren Dokument läge. Es gab keine verlässliche Zuordnung Auth-User → Firma; die App hätte stillschweigend mit der Demo-Firma gearbeitet. |

## 2. Trennung: Auth User / Profil / Membership / Employee

```
Firebase Auth (uid)                      Identität: Login, Passwort, E-Mail
   │
   ├─ users/{uid}                        Login-Profil (AppUser). Clientseitig verwaltet.
   │                                      Felder wie role/companyId/plan sind Legacy-/Profilfelder
   │                                      und werden NIE für Autorisierung ausgewertet.
   │
   └─ userMemberships/{uid}              Membership: Firma + Mitarbeiter + Rolle + Status.
        │                                 Einzige sicherheitsrelevante Quelle. Kein Client-Write.
        │  companyId ─────────────────→  companies/{companyId}/…
        │  employeeId (optional) ─────→  companies/{companyId}/employees/{employeeId}  (fachliche Personaldaten)
        │  roleId + role (Snapshot) ──→  companies/{companyId}/roles/{roleId}          (nur Metadaten)
```

- **`users/{uid}` bleibt unverändert** (Registrierung/Login funktionieren wie zuvor) und wird durch diesen Slice nicht umgedeutet. Eine getrennte Collection vermeidet die Kollision des Felds `role` (Profil-`UserRole` vs. Rollenname-Snapshot) und schützt bereits existierende Live-Profile vor Fehldeutung.
- **Das Employee-Dokument** bleibt die fachliche Quelle für Personaldaten. Die Membership **dupliziert keine** Employee-Daten, sondern verweist nur per `employeeId`.
- **Rolle:** `roleId` + lesbarer Snapshot `role`, analog zu Employee/Invitation. In diesem Slice reine **Metadaten** – es gibt keine Permission-Auswertung.

## 3. Membership-Modell (`userMemberships/{uid}`)

| Feld | Bemerkung |
|---|---|
| `uid` | = Dokument-ID (Firebase-Auth-UID), **nie als Datenfeld** gespeichert |
| `companyId` | Pflicht. Firma, auf die der User zugreifen darf |
| `employeeId?` | optional (Legacy-/Dev-Daten). Verweis auf `companies/{companyId}/employees/{employeeId}` |
| `roleId?`, `role?` | optional, Rollen-Snapshot (Metadaten) |
| `status` | `Aktiv` \| `Gesperrt` |
| `createdAt?`, `updatedAt?` | ISO-Strings (auch Timestamps werden beim Lesen zu ISO normalisiert) |

Typ: `src/types/userMembership.ts`, Converter: `userMembershipConverter` (`createIdConverter(“uid”)`), Collection-Konstante `COLLECTIONS.USER_MEMBERSHIPS`, Pfad-Helfer `userMembershipDocPath(uid)`.

## 4. Architektur im Client

```
AuthProvider (eine Instanz je Layout)
  onAuthStateChanged → invalidateMembershipCache() → getCurrentMembership()
        └── firestoreUserMembershipService   (nur Lesen: getMembership(uid), getCurrentMembership())
  evaluateMembership()   (lib/security/membershipRules.ts, rein funktional)
        └── MembershipState → useAuth().membership

MembershipGate (app/(app)/layout.tsx)   ← UI-Sperre der geschützten App

Service-Facades (12 Services, nur im Firestore-Zweig)
  await resolveActiveCompanyId()   (lib/firebase/activeCompany.ts)
        └── getCurrentMembership() → evaluateMembership() → companyId | MembershipAccessError
```

**Zustände** (`useAuth().membership.status`):

| Status | Bedeutung | App |
|---|---|---|
| `disabled` | Mock-Modus (oder Login-/Registrierungs-Layout) – keine Firmenprüfung | läuft wie bisher |
| `idle` | nicht angemeldet | Guard leitet auf `/login` (wie bisher) |
| `loading` | Membership wird geladen | Spinner |
| `valid` | Aktive Membership mit `companyId` | App wird angezeigt |
| `missing` | kein `userMemberships/{uid}` | **„Kein Unternehmenszugang eingerichtet.“** – kein Datenzugriff |
| `blocked` | `status: "Gesperrt"` | **„Dein Unternehmenszugang ist gesperrt.“** – kein Datenzugriff |
| `invalid` | Dokument unbrauchbar (z. B. ohne `companyId`, unbekannter Status) | „… fehlerhaft eingerichtet.“ – kein Datenzugriff |
| `error` | Laden fehlgeschlagen (Netzwerk, Rules, …) | „… konnte nicht geprüft werden.“ + „Erneut versuchen“ |

`auth.loading` (Auth + Login-Profil) bleibt unverändert; der Membership-Zustand ist davon getrennt.

**Eine Abfrage pro Anmeldung:** `AuthProvider` und `resolveActiveCompanyId()` teilen sich **dasselbe Promise** (`getCurrentMembership`), nicht je Service-Aufruf eine neue Abfrage. Das ist ein **Read-Through-Cache des Server-Dokuments**, nach UID getrennt, mit expliziter Invalidierung bei Auth-Wechsel/Logout/„Erneut versuchen“. Es ist **keine** globale, setzbare `companyId`; niemand kann hier eine Firma „setzen“. Fehlgeschlagene Ladevorgänge werden nicht gecacht. Veraltet der Cache (Membership wird serverseitig gesperrt), schützen die Rules trotzdem jeden Zugriff, denn sie lesen das Dokument live.

Die Gate-Anzeige (`MembershipGateView`) ist von der Auth-Anbindung getrennt, damit sie ohne Login darstellbar ist. Die Gate zeigt einen echten **„Abmelden“**-Button; es wird nicht behauptet, das Firebase-Konto sei deaktiviert.

## 5. Company Resolution: Mock vs. Firestore

| | Mock-Modus (`NEXT_PUBLIC_DATA_SOURCE=mock` oder unset) | Firestore-Modus (`=firestore`) |
|---|---|---|
| Datenquelle | In-Memory-Mockdaten | `companies/{companyId}/…` |
| companyId | **gibt es nicht** (kein Firestore-Zugriff) | **ausschließlich** aus `userMemberships/{uid}` des eingeloggten Users |
| Membership-Prüfung | `disabled` | Pflicht (Gate + Rules) |
| Fallback Demo-Company | – | **keiner** |
| Fallback `users/{uid}.companyId` | – | **keiner** |

`resolveCompanyId()` / `DEMO_COMPANY_ID` (`companyContext.ts`) werden von der App **nicht mehr** genutzt; die Datei bleibt nur für die Emulator-Seed-Skripte (feste Demo-Firma ohne Login). Alle 12 Service-Facades rufen jetzt `await resolveActiveCompanyId()` (nur im Firestore-Zweig) – eine mechanische Umstellung, keine Logikänderung der Slices.

> **Konsequenz im Firestore-Modus:** Ein frisch registrierter User hat **keine** Membership und sieht „Kein Unternehmenszugang eingerichtet.“, bis ein Membership-Dokument serverseitig angelegt wurde (siehe „Provisionierung“).

## 6. Firestore Rules

`belongsToCompany(companyId)` (von allen Firmen-Collections genutzt, unverändert benannt) lautet jetzt:

```
isSignedIn()
&& exists(userMemberships/{auth.uid})
&& membership.companyId == companyId     // .get("companyId", "")
&& membership.status == "Aktiv"          // .get("status", "")
```

- Fehlende Felder → `.get(key, default)` → kein Zugriff (kein Fehler-Fallback).
- Das Membership-Dokument wird pro Request nur einmal gelesen.
- **`userMemberships/{uid}`:** eigener User darf **einzeln lesen** (`get`); `list`, `create`, `update`, `delete` sind für Clients **verboten**.
- **`users/{uid}`:** Das Login-Profil war bisher durch den Fallback `deny` gesperrt, was Registrierung/Login gegen diese Rules gebrochen hätte. Es ist jetzt eng auf den Bedarf des bestehenden Codes (`users.ts`) zugeschnitten – weiterhin **ohne Autorisierungswirkung**:
  - **lesen:** nur der eigene User, nur einzeln (`get`), kein `list`;
  - **anlegen:** nur eigene UID und exakt das von `createUserProfile()` erzeugte Basismodell (genau die 10 Felder `id`, `firstName`, `lastName`, `email`, `role`, `plan`, `language`, `theme`, `createdAt`, `lastLogin`; `id == uid`, `role == "azubi"`, `plan == "azubi"`, `createdAt`/`lastLogin` = Serverzeit; keine `companyId`/`laboratoryId`);
  - **ändern:** nur `lastLogin` (auf die Serverzeit, per `affectedKeys().hasOnly(["lastLogin"])`); `id`, `email`, `role`, `plan`, `companyId`, `laboratoryId`, `createdAt`, `firstName`, `lastName`, `language`, `theme` sind für den Client unveränderlich (heute ändert kein Client-Code diese Felder, auch kein E-Mail-Sync);
  - **löschen:** verboten.
  - Randfall: Ein Konto **ohne** Profil-Dokument (z. B. in der Konsole angelegt) kann sich zwar authentifizieren, aber `updateLastLogin()` (ein `setDoc` mit `merge`, das dann ein *Anlegen* wäre) wird abgelehnt – der Login zeigt dann eine Fehlermeldung. Das ist bewusst strenger als zuvor; neu registrierte Konten sind nicht betroffen.
- **Bewusst keine** rollenbasierten Rules: kein `roleId == "admin"`, keine Permission-Dokumente, keine dynamische Role-Auswertung. Das ist die neue Sicherheits**basis**: Auth vorhanden, gültige Membership, richtige Firma, Membership aktiv.

## 7. Was jetzt sicherer ist

- Ein eingeloggter User kann nur Daten der Firma lesen/schreiben, der ihn ein **nicht vom Client beschreibbares** Dokument zuordnet. Vorher: beliebiger angemeldeter User mit gesetztem `users/{uid}.companyId` (clientschreibbar) bzw. gar keine geprüfte Zuordnung.
- Kein stillschweigender Wechsel auf die Demo-Firma im Firestore-Modus.
- Gesperrte Memberships verlieren **auf Rules-Ebene** den Zugriff auf alle Firmen-Collections.
- Ein User kann sich nicht selbst einer anderen Firma zuordnen (kein Client-Write auf `userMemberships`).

## 8. Was noch nicht geschützt ist

- **Rollenbasierte Durchsetzung nur in Phase 1:** `roles`, `employees`, `invitations`, `locations` prüfen Permissions (Phase 1). In den **acht übrigen** Collections (`customers`, `projects`, `devices`, `samples`, `testValues`, `reports`, `calendarEvents`, `laborbook`) darf jeder aktive Member der Firma weiterhin alles lesen und schreiben – unabhängig von `roleId`/`role`.
- **Mitarbeiter-Sperre ≠ Membership-Sperre:** `Employee.status = "Gesperrt"` (UI-Verwaltung) setzt `userMemberships.status` **nicht** automatisch; das ist eine eigene Operation, die Server-Provisionierung braucht.
- **Profil:** `role`/`plan` sind für den Client nicht mehr änderbar (nur `lastLogin`), das Profil bleibt aber eine reine Anzeige-/Metadatenquelle. Bei der Registrierung setzt der Client selbst das Basisprofil (`role`/`plan` = `"azubi"`, von den Rules erzwungen); Planwechsel/Upgrades brauchen später eine Server-Komponente.
- **Persönliche Subcollections** (`users/{uid}/aiChats`) haben noch keine Rules (bleiben per Fallback gesperrt).
- Andere Collections ohne Rules (`companies/{companyId}` Stammdokument, `integrations`, `webhooks`, `auditLog`, `aiChats`) bleiben gesperrt.
- **Eindeutigkeit/Race-Conditions** der Fach-Slices (z. B. Einladungs-E-Mail, Rollenname) bleiben clientseitige Prüfschritte.
- Kein Audit-Log, keine Rate-Limits, keine App Check.
- Sicherheitsfund am Rand (nicht Teil dieses Slices): `src/lib/firebase/client.ts` schreibt die Firebase-Konfiguration (inkl. API-Key) per `console.log` in die Browser-Konsole. Firebase-Web-API-Keys sind nicht geheim, das Logging gehört aber entfernt.

## 9. Provisionierung (nicht implementiert)

Echte Provisionierung braucht eine **Server-Komponente mit Admin SDK** (z. B. Cloud Function oder Admin-Skript), die:

1. den Auth-Benutzer anlegt (Einladungs-Annahme),
2. `userMemberships/{uid}` mit `companyId`, `employeeId`, `roleId`/`role`, `status` anlegt/ändert (umgeht die Rules),
3. Sperren/Entsperren konsistent zwischen Mitarbeiter und Membership führt.

Das ist hier **nicht** implementiert und nicht simuliert. Bis dahin legt man Memberships manuell in der Firebase-Konsole bzw. per Admin-Skript an.

## 10. Seed (`scripts/seedUserMemberships.ts`)

- Schreibt zwei Demo-Memberships nach `userMemberships/{uid}` im **Emulator**: `demo-uid-active` (aktiv, `demo-company`, Mitarbeiter `emp-max`) und `demo-uid-blocked` (`Gesperrt`, `emp-jonas`). Rolle/Employee-ID kommen aus `config/employees.ts`.
- **Erzeugt keine Auth-Benutzer.** Die Demo-UIDs gehören zu keinem echten Konto. Wer sich damit anmelden will, muss im Auth-Emulator selbst einen Benutzer mit dieser UID anlegen (nicht Teil des Skripts, nicht getestet).
- Dokument-ID = UID, `uid` nicht als Feld, `sanitizeForFirestore()`, idempotent, `--force`, keine Secrets, keine `.env.local`.
- **Dev-Weg wegen der Rules:** Das Skript schreibt per Client-SDK ohne Anmeldung. Die produktiven Rules verbieten Client-Writes auf `userMemberships` absichtlich. Daher den Emulator zum Seeden **ohne geladene `firestore.rules`** starten (wie für die übrigen Seed-Skripte). Die Rules selbst werden separat gegen den Emulator geprüft (z. B. mit `@firebase/rules-unit-testing`) – nicht Teil dieses Slices.
- Ausführen: `npx tsx scripts/seedUserMemberships.ts` (optional `--force`).

## 11. Verifikation

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: siehe Abschlussbericht.
- Isoliert getestet: `evaluateMembership` (fehlend, aktiv, gesperrt, leere/fehlende `companyId`, unbekannter Status, Legacy ohne `employeeId`/Rolle).
- Browser: unauthentifiziert → `/dashboard` leitet auf `/login` (wie bisher). Die vier Sperr-/Ladezustände des Gates (`loading`, `missing`, `blocked`, `invalid`, `error`) und die Freigabe bei `valid`/`disabled` wurden über eine temporäre, wieder entfernte Harness-Seite mit der reinen Anzeige-Komponente geprüft.
- **Nicht getestet (Stand dieses Slices):** echter Login (keine Zugangsdaten, keine Konten angelegt) und damit der echte Pfad Auth → Membership laden → App freigeben/sperren; der Seed gegen den Emulator. *Die Firestore Rules selbst waren damals ohne Emulator ungeprüft; sie werden inzwischen durch die Rules-Tests (`docs/firebase/firestore-rules-testing.md`) im Emulator abgedeckt.*

## 12. Offene Punkte

- **Rules-Test** gegen den Emulator (Fälle: ohne Auth, ohne Membership, falsche Firma, gesperrt, richtige Firma, Client-Write auf Membership, `list`; Profil: eigenes Create mit/ohne Zusatzfelder, `role`/`plan` ändern, nur `lastLogin`, fremdes Profil, Delete).
- **Serverseitige Provisionierung** (Admin SDK) und Verknüpfung Einladung → Auth-Benutzer → Membership.
- **Rollenbasierte Rules** (Claims oder Rollen-Lookup) in einem eigenen Slice; erst dann bekommen `roleId`/`role` Wirkung.
- **Konsistenz Mitarbeiter-Sperre ↔ Membership-Sperre**.
- **Rollenwechsel:** Wird `Employee.roleId` geändert, bleibt der Snapshot in der Membership alt, bis serverseitig synchronisiert wird.
- `aiChats`-Rules, App Check; Profil-Änderungen (Name, Sprache, Theme, E-Mail-Sync) müssen die `users/{uid}`-Update-Regel bewusst erweitern, sobald die UI sie schreibt.
- Entfernen des Konfigurations-`console.log` in `client.ts`.
