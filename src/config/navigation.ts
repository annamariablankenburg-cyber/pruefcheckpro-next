import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Contact,
  Cpu,
  FileDown,
  FlaskConical,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  Landmark,
  Layers,
  Mountain,
  NotebookText,
  Package,
  Plug,
  Settings,
  Sparkles,
  Target,
  User,
  Users,
} from "lucide-react";

import { DOMAIN_PERMISSION_KEYS } from "@/lib/permissions/domainAccess";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // Ohne dieses Recht erscheint der Punkt nicht in der Navigation (UX; die Seite sperrt sich bei
  // direktem Aufruf selbst, die Firestore Rules bleiben die Sicherheitsgrenze).
  requiredPermission?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Übersicht",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "PrüfCheck AI", href: "/ai", icon: Sparkles },
    ],
  },
  {
    label: "Lernen",
    items: [
      { label: "Lernen", href: "/lernen", icon: BookOpen },
      { label: "Quiz", href: "/quiz", icon: Target },
      { label: "Prüfungen", href: "/pruefungen", icon: FlaskConical, requiredPermission: DOMAIN_PERMISSION_KEYS.testValues.view },
    ],
  },
  {
    label: "Fachbereiche",
    items: [
      { label: "Beton", href: "/beton", icon: Building2 },
      { label: "Asphalt", href: "/asphalt", icon: Layers },
      { label: "Geotechnik", href: "/geotechnik", icon: Mountain },
    ],
  },
  {
    label: "Verwaltung",
    items: [
      { label: "Probenmanager", href: "/probekoerper", icon: Package, requiredPermission: DOMAIN_PERMISSION_KEYS.samples.view },
      { label: "Baustellenmodus", href: "/baustellenmodus", icon: HardHat },
      { label: "Kalender", href: "/kalender", icon: CalendarDays, requiredPermission: DOMAIN_PERMISSION_KEYS.calendarEvents.view },
      { label: "Projekte", href: "/projekte", icon: FolderKanban, requiredPermission: DOMAIN_PERMISSION_KEYS.projects.view },
      { label: "Kunden", href: "/kunden", icon: Contact, requiredPermission: DOMAIN_PERMISSION_KEYS.customers.view },
      { label: "Geräte", href: "/geraete", icon: Cpu, requiredPermission: DOMAIN_PERMISSION_KEYS.devices.view },
      { label: "Statistiken", href: "/statistiken", icon: BarChart3 },
      { label: "PDF-Export", href: "/pdf-export", icon: FileDown, requiredPermission: DOMAIN_PERMISSION_KEYS.reports.view },
      { label: "Laborbuch", href: "/laborbuch", icon: NotebookText, requiredPermission: DOMAIN_PERMISSION_KEYS.laborbook.view },
    ],
  },
  {
    label: "Unternehmen",
    items: [{ label: "Unternehmen", href: "/company", icon: Landmark }],
  },
  {
    label: "Konto",
    items: [
      { label: "Profil", href: "/profil", icon: User },
      { label: "Einstellungen", href: "/einstellungen", icon: Settings },
      { label: "Integrationen", href: "/integrationen", icon: Plug },
      { label: "Administration", href: "/admin", icon: Users },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((group) => group.items);

export const primaryMobileNavItems: NavItem[] = [
  navGroups[0].items[0],
  navGroups[1].items[0],
  navGroups[0].items[1],
  navGroups[3].items[2],
];
