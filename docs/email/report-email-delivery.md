# Prüfbericht-Versand per E-Mail

Dieser Bereich beschreibt den aktuellen Stand (UI-Prototyp) und die geplante produktive Architektur für den E-Mail-Versand von Prüfberichten.

## Aktueller Stand (Prototyp)

Der komplette "Per E-Mail senden"-Flow (`SendReportEmailDialog`, `EmailRecipientFields`, `EmailAttachmentSelector`, `EmailPreview`, `EmailHistoryList`, `EmailSendStatusBadge`) ist **reine UI mit lokalem Mock-State**:

- Es wird keine echte E-Mail versendet.
- Es gibt keine SMTP- oder API-Zugangsdaten im Frontend.
- "Versand" bedeutet ausschließlich: `Report.emailStatus`/`Report.emailHistory` werden lokal im React-State aktualisiert und per `FeedbackToast` bestätigt.
- Alle Anhänge (PDF/Excel/Fotos/Lieferscheine/Laborbericht/weitere Dokumente) sind Mock-Einträge (Dateiname, Typ, Größe) ohne echte Dateien.

## Geplante produktive Architektur

**E-Mails dürfen nicht direkt aus dem Browser per SMTP versendet werden.** SMTP-Zugangsdaten oder API-Keys eines E-Mail-Anbieters dürfen niemals im Client-Bundle liegen (auch nicht als `NEXT_PUBLIC_*`-Umgebungsvariable), da diese für jeden Nutzer im Frontend sichtbar/extrahierbar wären.

Stattdessen ist folgender Ablauf vorgesehen:

1. **Sicherer Server-Endpunkt**: Der Versand erfolgt über eine Firebase Cloud Function (oder einen vergleichbaren serverseitigen Endpunkt), die vom Client per authentifiziertem Request aufgerufen wird. Die eigentlichen Zugangsdaten/API-Keys liegen ausschließlich serverseitig (z. B. als Firebase Secret/Umgebungsvariable der Function).
2. **E-Mail-Anbieter**: Als Versanddienst kommt z. B. Resend, SendGrid, Mailgun oder ein serverseitig angebundenes SMTP-Konto infrage. Die Auswahl ist nicht Teil dieses Sprints.
3. **Anhänge aus Storage laden**: PDF-, Excel- und sonstige Anhänge werden nicht clientseitig erzeugt/übertragen, sondern von der Cloud Function aus Firebase Storage (bzw. dem jeweiligen Ablageort des erzeugten Berichts) geladen und dem Versand-Request beigefügt.
4. **Berechtigungsprüfung vor Versand**: Die Cloud Function muss vor dem Versand prüfen, ob der anfragende Nutzer berechtigt ist, den betreffenden Bericht zu versenden (Rollen-/Rechteprüfung analog zu den bestehenden Zugriffsregeln, nicht nur eine Prüfung im Frontend).
5. **Audit-Log-Eintrag**: Jeder tatsächliche Versand erzeugt einen Audit-Log-Eintrag (wer hat wann an wen welchen Bericht versendet), unabhängig vom lokalen `emailHistory`-Eintrag im UI.
6. **Fehlerbehandlung**: Empfänger- und Versandfehler (z. B. ungültige E-Mail-Adresse, Anbieter-Fehler, Timeout) müssen von der Cloud Function erkannt und als klarer Fehlerstatus an das Frontend zurückgegeben werden, damit der Versandstatus korrekt auf "Versand fehlgeschlagen" gesetzt werden kann statt fälschlich "Versendet".
7. **Keine geheimen Zugangsdaten im Client**: Sämtliche Provider-Keys/SMTP-Zugangsdaten verbleiben in der Server-/Function-Umgebung; im Frontend sind ausschließlich nicht-sensitive Konfigurationswerte (z. B. Absendername) zulässig.

## Betroffene Frontend-Bausteine (bereits vorbereitet)

- `Report.emailStatus`, `Report.emailHistory` (`src/types/report.ts`) — Datenmodell für den späteren echten Versandstatus, bereits vorhanden und mit Mock-Daten befüllbar.
- `SendReportEmailDialog` — Compose-/Vorschau-Flow; beim produktiven Anschluss ersetzt der echte `onSend`-Call den aktuellen lokalen State-Update durch einen Request an die Cloud Function.
- `EmailHistoryList` — "Erneut senden" muss später ebenfalls über den sicheren Endpunkt laufen statt nur den lokalen State zu duplizieren.

In diesem Sprint wurde ausschließlich die UI und der lokale Mock-Flow umgesetzt; die oben beschriebene Server-Anbindung ist bewusst nicht Teil dieser Änderung.
