import { KeyRound, LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/shared/GoogleIcon";
import { SettingsToggle } from "@/components/shared/SettingsToggle";
import { cn } from "@/lib/utils";
import type { ActiveSession, LinkedAccount, LoginHistoryEntry } from "@/types/settings";

interface AccountSecurityCardProps {
  twoFactorEnabled: boolean;
  onToggleTwoFactor: (value: boolean) => void;
  onChangePassword: () => void;
  sessions: ActiveSession[];
  onEndSession: (session: ActiveSession) => void;
  loginHistory: LoginHistoryEntry[];
  linkedAccounts: LinkedAccount[];
  onToggleLinkedAccount: (account: LinkedAccount) => void;
}

export function AccountSecurityCard({
  twoFactorEnabled,
  onToggleTwoFactor,
  onChangePassword,
  sessions,
  onEndSession,
  loginHistory,
  linkedAccounts,
  onToggleLinkedAccount,
}: AccountSecurityCardProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Passwort</CardTitle>
            <CardDescription>Ändere regelmäßig dein Passwort, um dein Konto zu schützen.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={onChangePassword} className="w-fit shrink-0">
            <KeyRound className="size-4" />
            Passwort ändern
          </Button>
        </CardHeader>
        <CardContent>
          <SettingsToggle
            label="Zwei-Faktor-Authentifizierung"
            description="Zusätzlicher Anmeldeschutz per Code, z. B. über eine Authenticator-App."
            checked={twoFactorEnabled}
            onCheckedChange={onToggleTwoFactor}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktive Sitzungen</CardTitle>
          <CardDescription>Geräte, auf denen du aktuell angemeldet bist.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium break-words text-foreground">
                  {session.device}
                  {session.current && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                      Diese Sitzung
                    </span>
                  )}
                </p>
                <p className="text-xs break-words text-muted-foreground">
                  {session.location} · {session.lastActive}
                </p>
              </div>
              {!session.current && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit shrink-0 text-destructive hover:text-destructive"
                  onClick={() => onEndSession(session)}
                >
                  <LogOut className="size-3.5" />
                  Abmelden
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Letzte Anmeldungen</CardTitle>
          <CardDescription>Verlauf der letzten Anmeldeversuche an deinem Konto.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {loginHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium break-words text-foreground">{entry.device}</p>
                <p className="text-xs break-words text-muted-foreground">
                  {entry.location} · {entry.timestamp}
                </p>
              </div>
              <span
                className={cn(
                  "w-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                  entry.status === "Erfolgreich" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}
              >
                {entry.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verknüpfte Konten</CardTitle>
          <CardDescription>Externe Konten für die Anmeldung bei PrüfCheckPro.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {linkedAccounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                {account.provider === "Google" ? (
                  <GoogleIcon />
                ) : (
                  <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{account.provider}-Konto</p>
                  <p className="text-xs break-words text-muted-foreground">
                    {account.connected ? (account.email ?? "Verbunden") : "Nicht verbunden"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit shrink-0"
                onClick={() => onToggleLinkedAccount(account)}
              >
                {account.connected ? "Trennen" : "Verbinden"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
