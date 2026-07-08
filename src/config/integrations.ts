import { Box, Cloud, Code2, FolderOpen, HardDrive, Mail, MessageCircle, MessagesSquare, Server, Webhook as WebhookIcon } from "lucide-react";

import type {
  ApiSettings,
  CloudStorageInfo,
  ExportFormatToggle,
  Integration,
  Webhook,
} from "@/types/integration";

// Mock-Daten für die Integrationen-/API-Center-Seite (/integrationen).
// Eigenständiger Datensatz, keine echte API-/OAuth-Anbindung.

export const integrations: Integration[] = [
  {
    id: "int-google-drive",
    name: "Google Drive",
    description: "Dateien speichern und synchronisieren",
    category: "Speicher",
    status: "Verbunden",
    icon: Cloud,
    lastSync: "Heute, 08:42 Uhr",
  },
  {
    id: "int-onedrive",
    name: "OneDrive",
    description: "Dateien in Microsoft OneDrive ablegen",
    category: "Speicher",
    status: "Nicht verbunden",
    icon: HardDrive,
  },
  {
    id: "int-sharepoint",
    name: "SharePoint",
    description: "Dokumente im Team-Sharepoint verwalten",
    category: "Speicher",
    status: "Nicht verbunden",
    icon: FolderOpen,
  },
  {
    id: "int-dropbox",
    name: "Dropbox",
    description: "Dateien speichern und mit Dropbox teilen",
    category: "Speicher",
    status: "Verbunden",
    icon: Box,
    lastSync: "Gestern, 16:30 Uhr",
  },
  {
    id: "int-aws-s3",
    name: "AWS S3",
    description: "Dateien in einem S3-Bucket ablegen",
    category: "Cloud",
    status: "Nicht verbunden",
    icon: Server,
  },
  {
    id: "int-smtp",
    name: "SMTP",
    description: "E-Mail-Versand über einen eigenen Mailserver",
    category: "Kommunikation",
    status: "Verbunden",
    icon: Mail,
    lastSync: "Heute, 07:10 Uhr",
  },
  {
    id: "int-teams",
    name: "Microsoft Teams",
    description: "Benachrichtigungen und Team-Kommunikation",
    category: "Kommunikation",
    status: "Nicht verbunden",
    icon: MessagesSquare,
  },
  {
    id: "int-slack",
    name: "Slack",
    description: "Benachrichtigungen und Team-Kommunikation",
    category: "Kommunikation",
    status: "Verbunden",
    icon: MessageCircle,
    lastSync: "Heute, 09:15 Uhr",
  },
  {
    id: "int-rest-api",
    name: "REST API",
    description: "Direkter Zugriff auf PrüfCheckPro-Daten über die API",
    category: "Entwicklung",
    status: "Verbunden",
    icon: Code2,
    lastSync: "Heute, 09:42 Uhr",
  },
  {
    id: "int-webhook",
    name: "Webhook",
    description: "Ereignisse in Echtzeit an externe Systeme senden",
    category: "Entwicklung",
    status: "Nicht verbunden",
    icon: WebhookIcon,
  },
];

export const webhooks: Webhook[] = [
  {
    id: "wh-1",
    url: "https://hooks.musterbau.de/pruefcheckpro/berichte",
    event: "Bericht exportiert",
    status: "Aktiv",
    createdAt: "15.02.2026",
  },
  {
    id: "wh-2",
    url: "https://hooks.baresel.de/pruefcheckpro/proben",
    event: "Probe archiviert",
    status: "Aktiv",
    createdAt: "20.02.2026",
  },
  {
    id: "wh-3",
    url: "https://example.org/pruefcheckpro/test",
    event: "Prüfwert erfasst",
    status: "Inaktiv",
    createdAt: "01.03.2026",
  },
];

export const exportFormats: ExportFormatToggle[] = [
  { id: "fmt-pdf", label: "PDF", enabled: true },
  { id: "fmt-excel", label: "Excel", enabled: true },
  { id: "fmt-csv", label: "CSV", enabled: false },
  { id: "fmt-json", label: "JSON", enabled: false },
  { id: "fmt-xml", label: "XML", enabled: false },
];

export const cloudStorage: CloudStorageInfo = {
  provider: "Google Drive",
  usedGb: 1.8,
  totalGb: 5,
  connected: true,
  lastSync: "Heute, 08:42 Uhr",
};

export const apiSettings: ApiSettings = {
  apiKey: "pcp_live_4f8a1c2d9e6b7a3f5c0d1e2b3a4f5c6d",
  baseUrl: "https://api.pruefcheckpro.de/v1",
  apiVersion: "v1.4",
};
