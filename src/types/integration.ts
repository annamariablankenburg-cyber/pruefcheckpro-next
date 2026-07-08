import type { LucideIcon } from "lucide-react";

export const integrationCategories = [
  "Cloud",
  "Speicher",
  "Kommunikation",
  "Entwicklung",
  "Export",
  "Sonstige",
] as const;
export type IntegrationCategory = (typeof integrationCategories)[number];

export type IntegrationStatus = "Verbunden" | "Nicht verbunden";

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  icon: LucideIcon;
  lastSync?: string;
}

export type WebhookStatus = "Aktiv" | "Inaktiv";

export interface Webhook {
  id: string;
  url: string;
  event: string;
  status: WebhookStatus;
  createdAt: string;
}

export interface ExportFormatToggle {
  id: string;
  label: string;
  enabled: boolean;
}

export interface CloudStorageInfo {
  provider: string;
  usedGb: number;
  totalGb: number;
  connected: boolean;
  lastSync: string;
}

export interface ApiSettings {
  apiKey: string;
  baseUrl: string;
  apiVersion: string;
}
