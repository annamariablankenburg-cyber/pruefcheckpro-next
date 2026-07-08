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

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
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
      { label: "Prüfungen", href: "/pruefungen", icon: FlaskConical },
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
      { label: "Probenmanager", href: "/probekoerper", icon: Package },
      { label: "Baustellenmodus", href: "/baustellenmodus", icon: HardHat },
      { label: "Kalender", href: "/kalender", icon: CalendarDays },
      { label: "Projekte", href: "/projekte", icon: FolderKanban },
      { label: "Kunden", href: "/kunden", icon: Contact },
      { label: "Geräte", href: "/geraete", icon: Cpu },
      { label: "Statistiken", href: "/statistiken", icon: BarChart3 },
      { label: "PDF-Export", href: "/pdf-export", icon: FileDown },
      { label: "Laborbuch", href: "/laborbuch", icon: NotebookText },
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
