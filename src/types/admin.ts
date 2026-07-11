import type { LucideIcon } from "lucide-react";

export type AuditActionType = "Erstellt" | "Geändert" | "Gelöscht" | "System";
export type AuditStatus = "Erfolg" | "Fehler";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userInitials: string;
  action: AuditActionType;
  module: string;
  record: string;
  status: AuditStatus;
  details: string;
}

export type SystemServiceStatus = "Bereit" | "Nicht verbunden" | "Wartung" | "Fehler";

export interface SystemServiceStatusEntry {
  id: string;
  name: string;
  status: SystemServiceStatus;
  detail: string;
}

export type SupportRequestStatus = "Offen" | "In Bearbeitung" | "Gelöst";

export interface SupportRequest {
  id: string;
  subject: string;
  requestedBy: string;
  status: SupportRequestStatus;
  createdAt: string;
}

export interface AdminContentGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  count: number;
}
