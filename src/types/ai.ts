import type { LucideIcon } from "lucide-react";

export const aiModes = [
  "Allgemein",
  "Beton",
  "Asphalt",
  "Geotechnik",
  "Bericht",
  "Normen",
  "Fehleranalyse",
] as const;
export type AiMode = (typeof aiModes)[number];

export type AiChatCategory = "Heute" | "Diese Woche" | "Archiviert";

export type AiMessageRole = "user" | "assistant";

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  timestamp: string;
}

export interface AiChat {
  id: string;
  title: string;
  category: AiChatCategory;
  mode: AiMode;
  timestamp: string;
  messages: AiMessage[];
}

export interface AiTool {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface AiContextCard {
  id: string;
  label: string;
  value: string;
  meta: string;
  icon: LucideIcon;
}

export interface AiQuickAction {
  id: string;
  label: string;
  prompt: string;
}
