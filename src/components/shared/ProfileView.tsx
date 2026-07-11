"use client";

import { useState } from "react";
import {
  CreditCard,
  Download,
  FileText,
  Pencil,
  Receipt,
  RotateCcw,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountSecurityCard } from "@/components/shared/AccountSecurityCard";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { DangerZoneCard } from "@/components/shared/DangerZoneCard";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NotificationSettingsCard, type NotificationToggleConfig } from "@/components/shared/NotificationSettingsCard";
import { ProfileAvatarCard } from "@/components/shared/ProfileAvatarCard";
import { SettingsSection } from "@/components/shared/SettingsSection";
import {
  activeSessions as initialActiveSessions,
  billingInfo,
  defaultNotificationPreferences,
  invoices,
  languageOptions,
  linkedAccounts as initialLinkedAccounts,
  loginHistory,
  profileData,
  timezoneOptions,
} from "@/config/settings";
import type { ActiveSession, LinkedAccount, NotificationPreferences, ProfileData } from "@/types/settings";

const notificationToggles: NotificationToggleConfig[] = [
  { key: "emailReminders", label: "E-Mail-Erinnerungen", description: "Wichtige Erinnerungen per E-Mail erhalten." },
  { key: "browserNotifications", label: "Browser-Benachrichtigungen", description: "Hinweise direkt im Browser anzeigen." },
  { key: "overdueTests", label: "Überfällige Prüfungen", description: "Benachrichtigung bei überfälligen Prüfungen." },
  { key: "calibrationDue", label: "Kalibrierung fällig", description: "Erinnerung, wenn ein Gerät kalibriert werden muss." },
  { key: "maintenanceDue", label: "Wartung fällig", description: "Erinnerung, wenn ein Gerät gewartet werden muss." },
  { key: "newInvitation", label: "Neue Einladung", description: "Benachrichtigung bei neuen Team-Einladungen." },
  { key: "reportReady", label: "Bericht fertig", description: "Benachrichtigung, sobald ein Prüfbericht fertig ist." },
  { key: "dailySummary", label: "Tägliche Zusammenfassung", description: "Tageszusammenfassung deiner Laboraktivitäten." },
];

function ProfileDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium break-words text-foreground sm:text-right">{value}</span>
    </div>
  );
}

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileData>(profileData);
  const [draftProfile, setDraftProfile] = useState<ProfileData>(profileData);
  const [isEditing, setIsEditing] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>(initialActiveSessions);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>(initialLinkedAccounts);

  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotificationPreferences);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { message: feedback, showFeedback } = useFeedbackToast();

  function handleStartEdit() {
    setDraftProfile(profile);
    setIsEditing(true);
  }

  function handleSave() {
    setProfile(draftProfile);
    setIsEditing(false);
    showFeedback("Profil lokal gespeichert.");
  }

  function handleDiscard() {
    setDraftProfile(profile);
    setIsEditing(false);
    showFeedback("Änderungen verworfen.");
  }

  function updateDraft<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setDraftProfile((current) => ({ ...current, [key]: value }));
  }

  function handleEndSession(session: ActiveSession) {
    setSessions((current) => current.filter((item) => item.id !== session.id));
    showFeedback(`Sitzung "${session.device}" wurde beendet.`);
  }

  function handleToggleLinkedAccount(account: LinkedAccount) {
    setLinkedAccounts((current) =>
      current.map((item) => (item.id === account.id ? { ...item, connected: !item.connected } : item))
    );
    showFeedback(
      account.connected ? `${account.provider}-Konto getrennt.` : `${account.provider}-Konto verbunden.`
    );
  }

  function handleNotificationChange(key: keyof NotificationPreferences, value: boolean) {
    setNotifications((current) => ({ ...current, [key]: value }));
  }

  function handleDeleteAccount() {
    setIsDeleteConfirmOpen(false);
    showFeedback("Konto wurde zur Löschung vorgemerkt.");
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Profil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte deine persönlichen Daten, dein Nutzerkonto und deine Sicherheit.
          </p>
        </div>
        <div className="flex w-fit shrink-0 flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button type="button" variant="outline" onClick={handleDiscard}>
                <RotateCcw className="size-4" />
                Änderungen verwerfen
              </Button>
              <Button type="button" onClick={handleSave}>
                <Save className="size-4" />
                Speichern
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={handleStartEdit}>
              <Pencil className="size-4" />
              Profil bearbeiten
            </Button>
          )}
        </div>
      </div>

      {/* A) Profilübersicht */}
      <div className="flex flex-col gap-6">
        <ProfileAvatarCard
          profile={profile}
          onChangeAvatar={() => showFeedback("Diese Funktion wird später angebunden.")}
        />
        <SettingsSection title="Profilübersicht" description="Deine wichtigsten Konto-Informationen auf einen Blick.">
          <ProfileDetailRow label="Vorname" value={profile.firstName} />
          <ProfileDetailRow label="Nachname" value={profile.lastName} />
          <ProfileDetailRow label="Anzeigename" value={profile.displayName} />
          <ProfileDetailRow label="E-Mail" value={profile.email} />
          <ProfileDetailRow label="Telefonnummer" value={profile.phone || "—"} />
          <ProfileDetailRow label="Rolle" value={profile.role} />
          <ProfileDetailRow label="Unternehmen" value={profile.company} />
          <ProfileDetailRow label="Standort" value={profile.location} />
          <ProfileDetailRow label="Mitarbeiter-ID" value={profile.employeeId} />
          <ProfileDetailRow label="Status" value={profile.status} />
          <ProfileDetailRow label="Letzte Anmeldung" value={profile.lastLogin} />
        </SettingsSection>
      </div>

      {/* B) Persönliche Daten */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profil-vorname" className="text-sm font-medium text-foreground">Vorname</label>
            <Input
              id="profil-vorname"
              value={draftProfile.firstName}
              disabled={!isEditing}
              onChange={(event) => updateDraft("firstName", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profil-nachname" className="text-sm font-medium text-foreground">Nachname</label>
            <Input
              id="profil-nachname"
              value={draftProfile.lastName}
              disabled={!isEditing}
              onChange={(event) => updateDraft("lastName", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profil-anzeigename" className="text-sm font-medium text-foreground">Anzeigename</label>
            <Input
              id="profil-anzeigename"
              value={draftProfile.displayName}
              disabled={!isEditing}
              onChange={(event) => updateDraft("displayName", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profil-email" className="text-sm font-medium text-foreground">E-Mail</label>
            <Input
              id="profil-email"
              type="email"
              value={draftProfile.email}
              disabled={!isEditing}
              onChange={(event) => updateDraft("email", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profil-telefon" className="text-sm font-medium text-foreground">Telefonnummer</label>
            <Input
              id="profil-telefon"
              value={draftProfile.phone}
              disabled={!isEditing}
              onChange={(event) => updateDraft("phone", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profil-mobil" className="text-sm font-medium text-foreground">
              Mobilnummer <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="profil-mobil"
              value={draftProfile.mobile ?? ""}
              disabled={!isEditing}
              onChange={(event) => updateDraft("mobile", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profil-sprache" className="text-sm font-medium text-foreground">Sprache</label>
            <Select
              value={draftProfile.language}
              onValueChange={(value) => updateDraft("language", value as ProfileData["language"])}
              disabled={!isEditing}
            >
              <SelectTrigger id="profil-sprache" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profil-zeitzone" className="text-sm font-medium text-foreground">Zeitzone</label>
            <Select
              value={draftProfile.timezone}
              onValueChange={(value) => updateDraft("timezone", value)}
              disabled={!isEditing}
            >
              <SelectTrigger id="profil-zeitzone" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* C) Sicherheit */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Sicherheit</h2>
        <AccountSecurityCard
          twoFactorEnabled={twoFactorEnabled}
          onToggleTwoFactor={(value) => {
            setTwoFactorEnabled(value);
            showFeedback(
              value ? "Zwei-Faktor-Authentifizierung aktiviert." : "Zwei-Faktor-Authentifizierung deaktiviert."
            );
          }}
          onChangePassword={() => showFeedback("Diese Funktion wird später angebunden.")}
          sessions={sessions}
          onEndSession={handleEndSession}
          loginHistory={loginHistory}
          linkedAccounts={linkedAccounts}
          onToggleLinkedAccount={handleToggleLinkedAccount}
        />
      </div>

      {/* D) Benachrichtigungen */}
      <NotificationSettingsCard
        toggles={notificationToggles}
        values={notifications}
        onChange={handleNotificationChange}
      />

      {/* E) Abo & Rechnungen */}
      <SettingsSection
        title="Abo & Rechnungen"
        description="Dein aktueller Tarif und deine letzten Rechnungen."
        actions={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => showFeedback("Diese Funktion wird später angebunden.")}>
              <CreditCard className="size-3.5" />
              Zahlungsmethode ändern
            </Button>
            <Button type="button" size="sm" onClick={() => showFeedback("Diese Funktion wird später angebunden.")}>
              Tarif verwalten
            </Button>
          </>
        }
      >
        <ProfileDetailRow label="Aktueller Tarif" value={billingInfo.plan} />
        <ProfileDetailRow label="Laufzeit" value={billingInfo.billingCycle} />
        <ProfileDetailRow label="Nächste Abrechnung" value={billingInfo.nextBillingDate} />
        <ProfileDetailRow label="Zahlungsmethode" value={billingInfo.paymentMethod} />
        <ProfileDetailRow label="Rechnungsadresse" value={billingInfo.billingAddress} />
        <div className="py-2.5">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Letzte Rechnungen
          </p>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="font-medium text-foreground">{invoice.number}</span>
                  <span className="text-xs text-muted-foreground">{invoice.date}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className={invoice.status === "Bezahlt" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                    {invoice.status}
                  </Badge>
                  <span className="font-medium text-foreground">{invoice.amount}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Rechnung ${invoice.number} ansehen`}
                    onClick={() => showFeedback("Diese Funktion wird später angebunden.")}
                  >
                    <Download className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* F) Konto löschen */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Danger Zone</h2>
        <DangerZoneCard
          title="Konto löschen"
          description="Das Konto wird dauerhaft zur Löschung vorgemerkt. Unternehmensdaten und bestehende Prüfberichte bleiben entsprechend der späteren Aufbewahrungsregeln erhalten."
          actionLabel="Konto löschen"
          onAction={() => setIsDeleteConfirmOpen(true)}
        />
      </div>

      <ConfirmActionDialog<boolean>
        subject={isDeleteConfirmOpen ? true : null}
        title="Konto wirklich löschen?"
        description="Diese Aktion kann später nicht rückgängig gemacht werden."
        confirmLabel="Konto löschen"
        confirmVariant="destructive"
        onOpenChange={(open) => !open && setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
      />

      <FeedbackToast message={feedback} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Receipt className="size-3.5" />
        Alle Änderungen auf dieser Seite werden aktuell nur lokal gespeichert.
      </div>
    </div>
  );
}
