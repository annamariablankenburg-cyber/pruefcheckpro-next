"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, Save, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyTabs, type CompanyTab } from "@/components/shared/CompanyTabs";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NotificationSettingsCard, type NotificationToggleConfig } from "@/components/shared/NotificationSettingsCard";
import { SettingsSection } from "@/components/shared/SettingsSection";
import { SettingsSelect } from "@/components/shared/SettingsSelect";
import { SettingsToggle } from "@/components/shared/SettingsToggle";
import {
  dateFormatOptions,
  decimalSeparatorOptions,
  defaultAppSettings,
  defaultLocationOptions,
  defaultNotificationPreferences,
  firstWeekOfYearOptions,
  languageOptions,
  localeOptions,
  reportFormatOptions,
  reportTemplateOptions,
  startPageOptions,
  tableDensityOptions,
  testAgeOptions,
  testerOptions,
  thousandsSeparatorOptions,
  timeFormatOptions,
  timezoneOptions,
  unitSystemOptions,
  weekStartOptions,
} from "@/config/settings";
import type { AppSettings, NotificationPreferences, ThemeMode } from "@/types/settings";

const tabs: CompanyTab[] = [
  { value: "allgemein", label: "Allgemein" },
  { value: "darstellung", label: "Darstellung" },
  { value: "benachrichtigungen", label: "Benachrichtigungen" },
  { value: "pruefungen", label: "Prüfungen" },
  { value: "berichte", label: "Berichte & Export" },
  { value: "datenschutz", label: "Datenschutz" },
  { value: "barrierefreiheit", label: "Barrierefreiheit" },
  { value: "sprache", label: "Sprache & Region" },
];

const notificationToggles: NotificationToggleConfig[] = [
  { key: "emailReminders", label: "E-Mail", description: "Benachrichtigungen per E-Mail erhalten." },
  { key: "browserNotifications", label: "Browser", description: "Hinweise direkt im Browser anzeigen." },
  { key: "overdueTests", label: "Prüfalter-Erinnerung", description: "Erinnerung an das Prüfalter einer Probe." },
  { key: "calibrationDue", label: "Gerätewartung", description: "Erinnerung, wenn ein Gerät gewartet werden muss." },
  { key: "maintenanceDue", label: "Kalibrierung", description: "Erinnerung, wenn ein Gerät kalibriert werden muss." },
  { key: "newInvitation", label: "Einladung", description: "Benachrichtigung bei neuen Team-Einladungen." },
  { key: "reportReady", label: "Bericht fertig", description: "Benachrichtigung, sobald ein Prüfbericht fertig ist." },
  { key: "dailySummary", label: "Tägliche Zusammenfassung", description: "Tageszusammenfassung deiner Laboraktivitäten." },
];

function applyThemeMode(mode: ThemeMode) {
  if (mode === "system") {
    window.localStorage.removeItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
    return;
  }
  window.localStorage.setItem("theme", mode);
  document.documentElement.classList.toggle("dark", mode === "dark");
}

function readCurrentThemeMode(): ThemeMode {
  const stored = window.localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return "system";
}

// Liest den aktuell aktiven Theme-Modus (bestehende ThemeToggle-Logik via
// localStorage) einmalig beim Laden der Seite, damit die Auswahl korrekt ist.
function initialAppSettings(): AppSettings {
  if (typeof window === "undefined") return defaultAppSettings;
  return { ...defaultAppSettings, appearance: { ...defaultAppSettings.appearance, theme: readCurrentThemeMode() } };
}

export function SettingsView() {
  const [activeTab, setActiveTab] = useState("allgemein");
  const [settings, setSettings] = useState<AppSettings>(initialAppSettings);
  const [savedSettings, setSavedSettings] = useState<AppSettings>(initialAppSettings);
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const { message: feedback, showFeedback } = useFeedbackToast();

  function updateSection<K extends keyof AppSettings>(section: K, changes: Partial<AppSettings[K]>) {
    setSettings((current) => ({ ...current, [section]: { ...current[section], ...changes } }));
  }

  function handleThemeChange(value: string) {
    const mode = value as ThemeMode;
    updateSection("appearance", { theme: mode });
    applyThemeMode(mode);
  }

  function handleSave() {
    setSavedSettings(settings);
    showFeedback("Einstellungen lokal gespeichert.");
  }

  function handleReset() {
    setSettings(savedSettings);
    showFeedback("Änderungen zurückgesetzt.");
  }

  function handleRestoreDefaults() {
    setSettings(defaultAppSettings);
    setSavedSettings(defaultAppSettings);
    applyThemeMode(defaultAppSettings.appearance.theme);
    showFeedback("Standardeinstellungen wiederhergestellt.");
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Einstellungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">Passe PrüfCheckPro an deine Arbeitsweise an.</p>
        </div>
        <div className="flex w-fit shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleRestoreDefaults}>
            <RotateCcw className="size-3.5" />
            Standard wiederherstellen
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            <Undo2 className="size-3.5" />
            Zurücksetzen
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            <Save className="size-3.5" />
            Einstellungen speichern
          </Button>
        </div>
      </div>

      <CompanyTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === "allgemein" && (
        <SettingsSection title="Allgemein" description="Grundlegende Anwendungseinstellungen.">
          <SettingsSelect
            label="Standardsprache"
            value={settings.general.defaultLanguage}
            options={languageOptions}
            onValueChange={(value) => updateSection("general", { defaultLanguage: value as AppSettings["general"]["defaultLanguage"] })}
          />
          <SettingsSelect
            label="Zeitzone"
            value={settings.general.timezone}
            options={timezoneOptions}
            onValueChange={(value) => updateSection("general", { timezone: value })}
          />
          <SettingsSelect
            label="Datumsformat"
            value={settings.general.dateFormat}
            options={dateFormatOptions}
            onValueChange={(value) => updateSection("general", { dateFormat: value })}
          />
          <SettingsSelect
            label="Zeitformat"
            value={settings.general.timeFormat}
            options={timeFormatOptions}
            onValueChange={(value) => updateSection("general", { timeFormat: value })}
          />
          <SettingsSelect
            label="Startseite nach Login"
            value={settings.general.startPage}
            options={startPageOptions}
            onValueChange={(value) => updateSection("general", { startPage: value })}
          />
          <SettingsSelect
            label="Standardstandort"
            value={settings.general.defaultLocation}
            options={defaultLocationOptions}
            onValueChange={(value) => updateSection("general", { defaultLocation: value })}
          />
          <SettingsToggle
            label="Automatische Speicherung"
            description="Entwürfe automatisch lokal zwischenspeichern."
            checked={settings.general.autoSave}
            onCheckedChange={(value) => updateSection("general", { autoSave: value })}
          />
        </SettingsSection>
      )}

      {activeTab === "darstellung" && (
        <SettingsSection title="Darstellung" description="Design und Layout von PrüfCheckPro.">
          <SettingsSelect
            label="Farbschema"
            description="Hell, Dunkel oder automatisch nach Systemeinstellung."
            value={settings.appearance.theme}
            options={["light", "dark", "system"]}
            onValueChange={handleThemeChange}
          />
          <SettingsToggle
            label="Kompakte Ansicht"
            description="Reduziert Abstände für mehr Inhalt auf dem Bildschirm."
            checked={settings.appearance.compactView}
            onCheckedChange={(value) => updateSection("appearance", { compactView: value })}
          />
          <SettingsToggle
            label="Reduzierte Animationen"
            description="Übergänge und Animationen minimieren."
            checked={settings.appearance.reducedMotion}
            onCheckedChange={(value) => updateSection("appearance", { reducedMotion: value })}
          />
          <SettingsToggle
            label="Größere Schrift"
            description="Erhöht die Standard-Schriftgröße in der Anwendung."
            checked={settings.appearance.largerText}
            onCheckedChange={(value) => updateSection("appearance", { largerText: value })}
          />
          <SettingsSelect
            label="Tabellen-Dichte"
            value={settings.appearance.tableDensity}
            options={tableDensityOptions}
            onValueChange={(value) => updateSection("appearance", { tableDensity: value as AppSettings["appearance"]["tableDensity"] })}
          />
          <SettingsToggle
            label="Sidebar eingeklappt starten"
            description="Die Seitenleiste beim Start eingeklappt anzeigen."
            checked={settings.appearance.sidebarCollapsed}
            onCheckedChange={(value) => updateSection("appearance", { sidebarCollapsed: value })}
          />
        </SettingsSection>
      )}

      {activeTab === "benachrichtigungen" && (
        <NotificationSettingsCard
          toggles={notificationToggles}
          values={notifications}
          onChange={(key, value) => setNotifications((current) => ({ ...current, [key]: value }))}
        />
      )}

      {activeTab === "pruefungen" && (
        <SettingsSection title="Prüfungen" description="Standardwerte und Verhalten bei der Prüfwert-Erfassung.">
          <SettingsSelect
            label="Standard-Prüfalter"
            value={settings.tests.defaultTestAge}
            options={testAgeOptions}
            onValueChange={(value) => updateSection("tests", { defaultTestAge: value })}
          />
          <SettingsSelect
            label="Standard-Prüfer"
            value={settings.tests.defaultTester}
            options={testerOptions}
            onValueChange={(value) => updateSection("tests", { defaultTester: value })}
          />
          <SettingsToggle
            label="Automatische Kalendereinträge"
            description="Legt für neue Prüfungen automatisch Kalendereinträge an."
            checked={settings.tests.autoCalendarEntries}
            onCheckedChange={(value) => updateSection("tests", { autoCalendarEntries: value })}
          />
          <SettingsToggle
            label="Warnung bei unvollständigen Messwerten"
            description="Weist vor dem Speichern auf fehlende Messwerte hin."
            checked={settings.tests.warnIncompleteValues}
            onCheckedChange={(value) => updateSection("tests", { warnIncompleteValues: value })}
          />
          <SettingsToggle
            label="Automatische Mittelwertanzeige"
            description="Berechnungsvorschau direkt bei der Erfassung anzeigen."
            checked={settings.tests.autoShowMean}
            onCheckedChange={(value) => updateSection("tests", { autoShowMean: value })}
          />
          <SettingsToggle
            label="Bestätigung vor Zurücksetzen"
            description="Vor dem Zurücksetzen von Prüfwerten immer nachfragen."
            checked={settings.tests.confirmBeforeReset}
            onCheckedChange={(value) => updateSection("tests", { confirmBeforeReset: value })}
          />
          <SettingsSelect
            label="Einheiten-System"
            value={settings.tests.unitSystem}
            options={unitSystemOptions}
            onValueChange={(value) => updateSection("tests", { unitSystem: value as AppSettings["tests"]["unitSystem"] })}
          />
        </SettingsSection>
      )}

      {activeTab === "berichte" && (
        <SettingsSection title="Berichte & Export" description="Standardeinstellungen für PDF- und Excel-Berichte.">
          <SettingsSelect
            label="Standardformat"
            value={settings.reports.defaultFormat}
            options={reportFormatOptions}
            onValueChange={(value) => updateSection("reports", { defaultFormat: value as AppSettings["reports"]["defaultFormat"] })}
          />
          <SettingsToggle
            label="Firmenlogo anzeigen"
            checked={settings.reports.showCompanyLogo}
            onCheckedChange={(value) => updateSection("reports", { showCompanyLogo: value })}
          />
          <SettingsToggle
            label="Kundenadresse anzeigen"
            checked={settings.reports.showCustomerAddress}
            onCheckedChange={(value) => updateSection("reports", { showCustomerAddress: value })}
          />
          <SettingsToggle
            label="Ansprechpartner anzeigen"
            checked={settings.reports.showContactPerson}
            onCheckedChange={(value) => updateSection("reports", { showContactPerson: value })}
          />
          <SettingsToggle
            label="Digitale Signatur anzeigen"
            checked={settings.reports.showDigitalSignature}
            onCheckedChange={(value) => updateSection("reports", { showDigitalSignature: value })}
          />
          <SettingsToggle
            label="Firmenstempel anzeigen"
            checked={settings.reports.showCompanyStamp}
            onCheckedChange={(value) => updateSection("reports", { showCompanyStamp: value })}
          />
          <div className="flex flex-col gap-1.5 py-3.5">
            <label htmlFor="dateinamen-schema" className="text-sm font-medium text-foreground">
              Dateinamen-Schema
            </label>
            <Input
              id="dateinamen-schema"
              value={settings.reports.fileNameScheme}
              onChange={(event) => updateSection("reports", { fileNameScheme: event.target.value })}
            />
          </div>
          <SettingsSelect
            label="Standard-Berichtsvorlage"
            value={settings.reports.defaultTemplate}
            options={reportTemplateOptions}
            onValueChange={(value) => updateSection("reports", { defaultTemplate: value as AppSettings["reports"]["defaultTemplate"] })}
          />
        </SettingsSection>
      )}

      {activeTab === "datenschutz" && (
        <SettingsSection title="Datenschutz" description="Steuere, welche Daten lokal verarbeitet werden.">
          <SettingsToggle
            label="Analyse-/Telemetrie-Daten"
            description="Anonyme Nutzungsdaten zur Verbesserung von PrüfCheckPro teilen."
            checked={settings.privacy.analytics}
            onCheckedChange={(value) => updateSection("privacy", { analytics: value })}
          />
          <SettingsToggle
            label="Fehlerberichte"
            description="Technische Fehlerberichte automatisch übermitteln."
            checked={settings.privacy.errorReports}
            onCheckedChange={(value) => updateSection("privacy", { errorReports: value })}
          />
          <SettingsToggle
            label="Lokale Speicherung"
            description="Zwischenspeicherung von Entwürfen im Browser erlauben."
            checked={settings.privacy.localStorageEnabled}
            onCheckedChange={(value) => updateSection("privacy", { localStorageEnabled: value })}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Sitzungen anzeigen</p>
              <p className="text-xs text-muted-foreground">Aktive Anmeldungen und Geräte einsehen.</p>
            </div>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/profil">Zu Profil &amp; Sicherheit</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Datenexport anfordern</p>
              <p className="text-xs text-muted-foreground">Eine Kopie deiner Daten anfordern.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => showFeedback("Diese Funktion wird später angebunden.")}>
              Anfordern
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Datenschutzinformationen</p>
              <p className="text-xs text-muted-foreground">Vollständige Datenschutzerklärung öffnen.</p>
            </div>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/datenschutz" target="_blank">Öffnen</Link>
            </Button>
          </div>
        </SettingsSection>
      )}

      {activeTab === "barrierefreiheit" && (
        <SettingsSection title="Barrierefreiheit" description="Passe PrüfCheckPro an deine Bedürfnisse an.">
          <SettingsToggle
            label="Hoher Kontrast"
            description="Erhöht den Farbkontrast für bessere Lesbarkeit."
            checked={settings.accessibility.highContrast}
            onCheckedChange={(value) => updateSection("accessibility", { highContrast: value })}
          />
          <SettingsToggle
            label="Größere Klickflächen"
            description="Vergrößert Buttons und interaktive Elemente."
            checked={settings.accessibility.largerClickTargets}
            onCheckedChange={(value) => updateSection("accessibility", { largerClickTargets: value })}
          />
          <SettingsToggle
            label="Tastaturnavigation-Hinweise"
            description="Zeigt zusätzliche Hinweise für die Tastaturbedienung."
            checked={settings.accessibility.keyboardNavHints}
            onCheckedChange={(value) => updateSection("accessibility", { keyboardNavHints: value })}
          />
          <SettingsToggle
            label="Reduzierte Animationen"
            checked={settings.accessibility.reducedMotion}
            onCheckedChange={(value) => updateSection("accessibility", { reducedMotion: value })}
          />
          <SettingsToggle
            label="Screenreader-Hinweise"
            description="Zusätzliche Beschreibungen für Screenreader aktivieren."
            checked={settings.accessibility.screenReaderHints}
            onCheckedChange={(value) => updateSection("accessibility", { screenReaderHints: value })}
          />
          <SettingsToggle
            label="Fokus stärker hervorheben"
            description="Deutlicherer Fokusring bei Tastaturnavigation."
            checked={settings.accessibility.strongFocus}
            onCheckedChange={(value) => updateSection("accessibility", { strongFocus: value })}
          />
        </SettingsSection>
      )}

      {activeTab === "sprache" && (
        <SettingsSection title="Sprache & Region" description="Sprach- und Formatierungseinstellungen.">
          <SettingsSelect
            label="Sprache"
            value={settings.region.language}
            options={languageOptions}
            onValueChange={(value) => updateSection("region", { language: value as AppSettings["region"]["language"] })}
          />
          <SettingsSelect
            label="Gebietsschema"
            value={settings.region.locale}
            options={localeOptions}
            onValueChange={(value) => updateSection("region", { locale: value })}
          />
          <SettingsSelect
            label="Dezimaltrennzeichen"
            value={settings.region.decimalSeparator}
            options={decimalSeparatorOptions}
            onValueChange={(value) => updateSection("region", { decimalSeparator: value as AppSettings["region"]["decimalSeparator"] })}
          />
          <SettingsSelect
            label="Tausendertrennzeichen"
            value={settings.region.thousandsSeparator}
            options={thousandsSeparatorOptions}
            onValueChange={(value) => updateSection("region", { thousandsSeparator: value as AppSettings["region"]["thousandsSeparator"] })}
          />
          <SettingsSelect
            label="Erste Kalenderwoche"
            value={settings.region.firstWeekOfYear}
            options={firstWeekOfYearOptions}
            onValueChange={(value) => updateSection("region", { firstWeekOfYear: value })}
          />
          <SettingsSelect
            label="Wochenstart"
            value={settings.region.weekStart}
            options={weekStartOptions}
            onValueChange={(value) => updateSection("region", { weekStart: value as AppSettings["region"]["weekStart"] })}
          />
        </SettingsSection>
      )}

      <FeedbackToast message={feedback} />
    </div>
  );
}
