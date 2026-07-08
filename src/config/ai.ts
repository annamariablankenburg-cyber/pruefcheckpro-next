import {
  BookOpenCheck,
  Calculator,
  Contact,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  FolderKanban,
  Image as ImageIcon,
  LifeBuoy,
  TestTubeDiagonal,
} from "lucide-react";

import type { RecordListItem } from "@/components/shared/RecordList";
import type { AiChat, AiContextCard, AiQuickAction, AiTool } from "@/types/ai";

export const aiChats: AiChat[] = [
  {
    id: "chat-1",
    title: "Druckfestigkeit BET-2026-014 prüfen",
    category: "Heute",
    mode: "Beton",
    timestamp: "09:42",
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "Warum ist BET-2026-014 auffällig?",
        timestamp: "09:41 Uhr",
      },
      {
        id: "m-2",
        role: "assistant",
        content:
          "Die Druckfestigkeit liegt unter dem erwarteten Bereich. Prüfe Bruchlast, Probenalter und Würfelmaß.",
        timestamp: "09:42 Uhr",
      },
    ],
  },
  {
    id: "chat-2",
    title: "Proctor-Versuch erklären",
    category: "Heute",
    mode: "Geotechnik",
    timestamp: "08:15",
    messages: [
      {
        id: "m-3",
        role: "user",
        content: "Wozu dient der Proctor-Versuch genau?",
        timestamp: "08:14 Uhr",
      },
      {
        id: "m-4",
        role: "assistant",
        content:
          "Der Proctor-Versuch ermittelt den Zusammenhang zwischen Wassergehalt und Trockendichte, um den optimalen Verdichtungsgrad eines Bodens zu bestimmen. Für die genaue Durchführung gilt die jeweils gültige Originalnorm.",
        timestamp: "08:15 Uhr",
      },
    ],
  },
  {
    id: "chat-3",
    title: "PDF-Bericht zusammenfassen",
    category: "Diese Woche",
    mode: "Bericht",
    timestamp: "Gestern",
    messages: [
      {
        id: "m-5",
        role: "user",
        content: "Kannst du den Bericht RPT-2026-002 kurz zusammenfassen?",
        timestamp: "Gestern, 16:20 Uhr",
      },
      {
        id: "m-6",
        role: "assistant",
        content:
          "Der Bericht dokumentiert die Marshall-Prüfung für das Projekt L 342 Fahrbahnerneuerung. Stabilität und Fließwert liegen im Zielbereich. Eine fachliche Freigabe steht noch aus.",
        timestamp: "Gestern, 16:21 Uhr",
      },
    ],
  },
  {
    id: "chat-4",
    title: "Asphalt-Hohlraumgehalt prüfen",
    category: "Diese Woche",
    mode: "Asphalt",
    timestamp: "Vorgestern",
    messages: [
      {
        id: "m-7",
        role: "user",
        content: "Was bedeutet ein hoher Hohlraumgehalt beim Asphalt?",
        timestamp: "Vorgestern, 11:05 Uhr",
      },
      {
        id: "m-8",
        role: "assistant",
        content:
          "Ein erhöhter Hohlraumgehalt kann auf eine geringere Verdichtung hindeuten und die Wasserdurchlässigkeit erhöhen. Eine Bewertung sollte immer im Abgleich mit der geltenden Norm erfolgen.",
        timestamp: "Vorgestern, 11:06 Uhr",
      },
    ],
  },
  {
    id: "chat-5",
    title: "Normhinweis DIN EN 12390",
    category: "Archiviert",
    mode: "Normen",
    timestamp: "15.01.2026",
    messages: [
      {
        id: "m-9",
        role: "user",
        content: "Erkläre mir DIN EN 12390-3.",
        timestamp: "15.01.2026, 10:03 Uhr",
      },
      {
        id: "m-10",
        role: "assistant",
        content:
          "Ich kann dir eine allgemeine Orientierung geben. Maßgeblich ist immer die gültige Originalnorm.",
        timestamp: "15.01.2026, 10:03 Uhr",
      },
    ],
  },
];

export const aiTools: AiTool[] = [
  { id: "tool-formel", label: "Formelmodus", description: "Formeln herleiten & erklären", icon: Calculator },
  { id: "tool-normen", label: "Normenreferenz", description: "Normen & Richtlinien finden", icon: BookOpenCheck },
  { id: "tool-pdf", label: "PDF erklären", description: "Berichte & Dokumente analysieren", icon: FileText },
  { id: "tool-excel", label: "Excel analysieren", description: "Messwerttabellen auswerten", icon: FileSpreadsheet },
  { id: "tool-bild", label: "Bildanalyse", description: "Fotos & Diagramme erklären", icon: ImageIcon },
  { id: "tool-labor", label: "Laborhilfe", description: "Prozesse & Abläufe erklären", icon: LifeBuoy },
];

export const aiContextCards: AiContextCard[] = [
  {
    id: "ctx-probe",
    label: "Aktuelle Probe",
    value: "BET-2026-014",
    meta: "Beton C25/30 – In Prüfung",
    icon: FlaskConical,
  },
  {
    id: "ctx-projekt",
    label: "Aktuelles Projekt",
    value: "Neubau Wohnanlage Parkblick",
    meta: "Musterbau GmbH",
    icon: FolderKanban,
  },
  {
    id: "ctx-kunde",
    label: "Aktueller Kunde",
    value: "Musterbau GmbH",
    meta: "K-2026-001",
    icon: Contact,
  },
  {
    id: "ctx-bericht",
    label: "Aktueller Bericht",
    value: "RPT-2026-001",
    meta: "Prüfbericht – Betonwürfel Druckfestigkeit",
    icon: TestTubeDiagonal,
  },
];

export const aiQuickActions: AiQuickAction[] = [
  {
    id: "qa-druckfestigkeit",
    label: "Druckfestigkeit berechnen",
    prompt: "Hilf mir, die Druckfestigkeit eines Betonwürfels vorzubereiten.",
  },
  {
    id: "qa-wz-wert",
    label: "W/Z-Wert prüfen",
    prompt: "Wie prüfe ich den Wasser-Zement-Wert eines Betonrezepts?",
  },
  {
    id: "qa-norm",
    label: "Normhinweis suchen",
    prompt: "Welche Norm ist für diese Prüfung relevant?",
  },
  {
    id: "qa-bericht",
    label: "Bericht zusammenfassen",
    prompt: "Fasse mir den aktuellen Prüfbericht kurz zusammen.",
  },
  {
    id: "qa-pruefwerte",
    label: "Prüfwerte analysieren",
    prompt: "Analysiere die zuletzt erfassten Prüfwerte auf Auffälligkeiten.",
  },
  {
    id: "qa-baustellenmodus",
    label: "Baustellenmodus erklären",
    prompt: "Was ist der Baustellenmodus und wann nutze ich ihn?",
  },
];

export const aiRecentResults: RecordListItem[] = [
  { id: "res-1", title: "Druckfestigkeit berechnet", date: "Heute, 09:42" },
  { id: "res-2", title: "Wassergehalt erklärt", date: "Gestern, 11:06" },
  { id: "res-3", title: "Bericht geprüft", date: "Gestern, 16:21" },
];
