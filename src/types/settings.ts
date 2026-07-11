import type { ReportFormat, ReportTemplate } from "@/types/report";

export type ThemeMode = "light" | "dark" | "system";
export type TableDensity = "Kompakt" | "Standard" | "Komfortabel";
export type UnitSystem = "Metrisch" | "Imperial";
export type WeekStart = "Montag" | "Sonntag";
export type AppLanguage = "Deutsch" | "Englisch";
export type ProfileStatus = "Aktiv" | "Gesperrt" | "Ausstehend";

export interface ProfileData {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  mobile?: string;
  role: string;
  company: string;
  location: string;
  employeeId: string;
  status: ProfileStatus;
  lastLogin: string;
  avatarInitials: string;
  language: AppLanguage;
  timezone: string;
}

export interface LinkedAccount {
  id: string;
  provider: "Google" | "Microsoft";
  connected: boolean;
  email?: string;
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  device: string;
  location: string;
  timestamp: string;
  status: "Erfolgreich" | "Fehlgeschlagen";
}

export interface NotificationPreferences {
  emailReminders: boolean;
  browserNotifications: boolean;
  overdueTests: boolean;
  calibrationDue: boolean;
  maintenanceDue: boolean;
  newInvitation: boolean;
  reportReady: boolean;
  dailySummary: boolean;
}

export interface BillingInfo {
  plan: string;
  billingCycle: string;
  nextBillingDate: string;
  paymentMethod: string;
  billingAddress: string;
}

export interface InvoiceEntry {
  id: string;
  number: string;
  date: string;
  amount: string;
  status: "Bezahlt" | "Offen";
}

export interface AppearanceSettings {
  theme: ThemeMode;
  compactView: boolean;
  reducedMotion: boolean;
  largerText: boolean;
  tableDensity: TableDensity;
  sidebarCollapsed: boolean;
}

export interface GeneralSettings {
  defaultLanguage: AppLanguage;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  startPage: string;
  defaultLocation: string;
  autoSave: boolean;
}

export interface TestSettings {
  defaultTestAge: string;
  defaultTester: string;
  autoCalendarEntries: boolean;
  warnIncompleteValues: boolean;
  autoShowMean: boolean;
  confirmBeforeReset: boolean;
  unitSystem: UnitSystem;
}

export interface ReportSettings {
  defaultFormat: ReportFormat;
  showCompanyLogo: boolean;
  showCustomerAddress: boolean;
  showContactPerson: boolean;
  showDigitalSignature: boolean;
  showCompanyStamp: boolean;
  fileNameScheme: string;
  defaultTemplate: ReportTemplate;
}

export interface PrivacySettings {
  analytics: boolean;
  errorReports: boolean;
  localStorageEnabled: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largerClickTargets: boolean;
  keyboardNavHints: boolean;
  reducedMotion: boolean;
  screenReaderHints: boolean;
  strongFocus: boolean;
}

export interface RegionSettings {
  language: AppLanguage;
  locale: string;
  decimalSeparator: "Komma" | "Punkt";
  thousandsSeparator: "Punkt" | "Komma" | "Leerzeichen";
  firstWeekOfYear: string;
  weekStart: WeekStart;
}

export interface AppSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  notifications: NotificationPreferences;
  tests: TestSettings;
  reports: ReportSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  region: RegionSettings;
}

export interface DeviceSession {
  id: string;
  device: string;
  lastActive: string;
}
