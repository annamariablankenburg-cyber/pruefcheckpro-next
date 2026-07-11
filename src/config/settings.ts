import { companyProfile } from "@/config/company";
import { employees, locationNames } from "@/config/employees";
import type {
  AccessibilitySettings,
  ActiveSession,
  AppearanceSettings,
  AppSettings,
  BillingInfo,
  GeneralSettings,
  InvoiceEntry,
  LinkedAccount,
  LoginHistoryEntry,
  NotificationPreferences,
  PrivacySettings,
  ProfileData,
  RegionSettings,
  ReportSettings,
  TestSettings,
} from "@/types/settings";

// Profil-Persona übernimmt die bestehende Mitarbeiterin "Anna Neumann"
// (config/employees.ts) als eingeloggte Nutzerin, statt eine neue,
// widersprüchliche Person zu erfinden.
const currentEmployee = employees.find((employee) => employee.id === "emp-anna")!;

export const profileData: ProfileData = {
  firstName: "Anna",
  lastName: "Neumann",
  displayName: currentEmployee.name,
  email: currentEmployee.email,
  phone: currentEmployee.phone ?? "",
  mobile: "",
  role: currentEmployee.role,
  company: companyProfile.name,
  location: currentEmployee.location,
  employeeId: currentEmployee.id.toUpperCase(),
  status: currentEmployee.status,
  lastLogin: currentEmployee.lastLogin,
  avatarInitials: currentEmployee.initials,
  language: "Deutsch",
  timezone: "Europe/Berlin (UTC+1)",
};

export const linkedAccounts: LinkedAccount[] = [
  { id: "acc-google", provider: "Google", connected: true, email: currentEmployee.email },
  { id: "acc-microsoft", provider: "Microsoft", connected: false },
];

export const activeSessions: ActiveSession[] = [
  { id: "sess-1", device: "Chrome auf Windows", location: "Stuttgart, Deutschland", lastActive: "Jetzt aktiv", current: true },
  { id: "sess-2", device: "PrüfCheckPro App auf iPhone", location: "Stuttgart, Deutschland", lastActive: "Vor 2 Stunden", current: false },
  { id: "sess-3", device: "Safari auf iPad", location: "München, Deutschland", lastActive: "Vor 3 Tagen", current: false },
];

export const loginHistory: LoginHistoryEntry[] = [
  { id: "login-1", device: "Chrome auf Windows", location: "Stuttgart, Deutschland", timestamp: "Heute, 08:42 Uhr", status: "Erfolgreich" },
  { id: "login-2", device: "PrüfCheckPro App auf iPhone", location: "Stuttgart, Deutschland", timestamp: "Gestern, 17:10 Uhr", status: "Erfolgreich" },
  { id: "login-3", device: "Unbekanntes Gerät", location: "Warschau, Polen", timestamp: "12.03.2026, 03:22 Uhr", status: "Fehlgeschlagen" },
];

export const billingInfo: BillingInfo = {
  plan: companyProfile.plan,
  billingCycle: companyProfile.billingCycle,
  nextBillingDate: "01.01.2027",
  paymentMethod: "Visa •••• 4242",
  billingAddress: "Musterlabor GmbH, Industriestraße 12, 70190 Stuttgart",
};

export const invoices: InvoiceEntry[] = [
  { id: "inv-2026-12", number: "RE-2026-0012", date: "01.12.2025", amount: "249,00 €", status: "Bezahlt" },
  { id: "inv-2026-11", number: "RE-2026-0011", date: "01.11.2025", amount: "249,00 €", status: "Bezahlt" },
  { id: "inv-2026-10", number: "RE-2026-0010", date: "01.10.2025", amount: "249,00 €", status: "Bezahlt" },
];

export const defaultNotificationPreferences: NotificationPreferences = {
  emailReminders: true,
  browserNotifications: true,
  overdueTests: true,
  calibrationDue: true,
  maintenanceDue: false,
  newInvitation: true,
  reportReady: true,
  dailySummary: false,
};

const defaultGeneral: GeneralSettings = {
  defaultLanguage: "Deutsch",
  timezone: "Europe/Berlin (UTC+1)",
  dateFormat: "TT.MM.JJJJ",
  timeFormat: "24-Stunden",
  startPage: "Dashboard",
  defaultLocation: currentEmployee.location,
  autoSave: true,
};

const defaultAppearance: AppearanceSettings = {
  theme: "system",
  compactView: false,
  reducedMotion: false,
  largerText: false,
  tableDensity: "Standard",
  sidebarCollapsed: false,
};

const defaultTests: TestSettings = {
  defaultTestAge: "28 Tage",
  defaultTester: currentEmployee.name,
  autoCalendarEntries: true,
  warnIncompleteValues: true,
  autoShowMean: true,
  confirmBeforeReset: true,
  unitSystem: "Metrisch",
};

const defaultReports: ReportSettings = {
  defaultFormat: "PDF",
  showCompanyLogo: true,
  showCustomerAddress: true,
  showContactPerson: true,
  showDigitalSignature: false,
  showCompanyStamp: false,
  fileNameScheme: "{Berichtsnummer}_{Kunde}_{Datum}",
  defaultTemplate: "Standard-Prüfbericht",
};

const defaultPrivacy: PrivacySettings = {
  analytics: true,
  errorReports: true,
  localStorageEnabled: true,
};

const defaultAccessibility: AccessibilitySettings = {
  highContrast: false,
  largerClickTargets: false,
  keyboardNavHints: false,
  reducedMotion: false,
  screenReaderHints: false,
  strongFocus: true,
};

const defaultRegion: RegionSettings = {
  language: "Deutsch",
  locale: "de-DE",
  decimalSeparator: "Komma",
  thousandsSeparator: "Punkt",
  firstWeekOfYear: "Woche mit erstem Donnerstag",
  weekStart: "Montag",
};

export const defaultAppSettings: AppSettings = {
  general: defaultGeneral,
  appearance: defaultAppearance,
  notifications: defaultNotificationPreferences,
  tests: defaultTests,
  reports: defaultReports,
  privacy: defaultPrivacy,
  accessibility: defaultAccessibility,
  region: defaultRegion,
};

export const languageOptions: AppSettings["general"]["defaultLanguage"][] = ["Deutsch", "Englisch"];

export const timezoneOptions = [
  "Europe/Berlin (UTC+1)",
  "Europe/London (UTC+0)",
  "Europe/Zurich (UTC+1)",
  "Europe/Vienna (UTC+1)",
];

export const dateFormatOptions = ["TT.MM.JJJJ", "JJJJ-MM-TT", "MM/TT/JJJJ"];
export const timeFormatOptions = ["24-Stunden", "12-Stunden (AM/PM)"];
export const startPageOptions = ["Dashboard", "Prüfungen", "Probenmanager", "Kalender", "Statistiken"];
export const tableDensityOptions: AppSettings["appearance"]["tableDensity"][] = [
  "Kompakt",
  "Standard",
  "Komfortabel",
];
export const unitSystemOptions: AppSettings["tests"]["unitSystem"][] = ["Metrisch", "Imperial"];
export const reportFormatOptions: AppSettings["reports"]["defaultFormat"][] = ["PDF", "Excel", "PDF & Excel"];
export const reportTemplateOptions: AppSettings["reports"]["defaultTemplate"][] = [
  "Standard-Prüfbericht",
  "Laborbericht",
  "Prüfprotokoll",
  "Baustellenbericht",
  "Kundenbericht",
  "Kompaktbericht",
];
export const localeOptions = ["de-DE", "de-AT", "de-CH", "en-US", "en-GB"];
export const decimalSeparatorOptions: AppSettings["region"]["decimalSeparator"][] = ["Komma", "Punkt"];
export const thousandsSeparatorOptions: AppSettings["region"]["thousandsSeparator"][] = [
  "Punkt",
  "Komma",
  "Leerzeichen",
];
export const firstWeekOfYearOptions = ["Woche mit erstem Donnerstag", "Woche mit erstem Januartag", "ISO 8601"];
export const weekStartOptions: AppSettings["region"]["weekStart"][] = ["Montag", "Sonntag"];

// Aus bestehenden Mitarbeiter-/Standortdaten abgeleitet, keine Fantasienamen.
export const defaultLocationOptions = locationNames;
export const testerOptions = employees.map((employee) => employee.name);
export const testAgeOptions = ["2 Tage", "7 Tage", "28 Tage", "56 Tage", "eigenes Prüfdatum"];
