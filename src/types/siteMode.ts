import type { LucideIcon } from "lucide-react";

import type { RecordListItem } from "@/components/shared/RecordList";

export type SiteSampleStatus = "Offen" | "In Prüfung" | "Abgeschlossen" | "Überfällig";

export type SiteDeviceStatus = "Einsatzbereit" | "Kalibrierung fällig" | "Wartung fällig";

export interface SiteQuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface ActiveSite {
  projekt: string;
  kunde: string;
  standort: string;
  ansprechpartner: string;
  telefon: string;
  wetter: string;
  gps: string;
  latitude: number;
  longitude: number;
}

export interface SitePhoto {
  id: string;
  colorClass: string;
  description: string;
  favorite: boolean;
  capturedAt: string;
}

export interface SiteNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface SiteChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export type SiteSyncCategory = "Proben" | "Fotos" | "Messwerte" | "Notizen";

export interface SiteSyncQueueEntry {
  category: SiteSyncCategory;
  count: number;
}

export interface SitePruefung {
  id: string;
  name: string;
  status: SiteSampleStatus;
}

export interface SiteSample {
  id: string;
  bezeichnung: string;
  status: SiteSampleStatus;
  pruefalter: string;
  projekt: string;
  kunde: string;
  ansprechpartner: string;
  gps: string;
  pruefungen: SitePruefung[];
  fotos: RecordListItem[];
  anhaenge: RecordListItem[];
  geraete: string[];
  notizen: string;
}

export interface SiteDevice {
  id: string;
  name: string;
  inventoryNumber: string;
  status: SiteDeviceStatus;
  kalibrierung: string;
}
