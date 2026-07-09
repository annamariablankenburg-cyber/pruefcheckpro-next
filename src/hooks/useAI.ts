"use client";

import { useState } from "react";
import { aiService } from "@/lib/services/aiService";
import type { AiChat, AiMessage, AiMode, AiQuickAction } from "@/types/ai";

function getCannedReply(prompt: string, mode: AiMode): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("bet-2026-014") || lower.includes("auffällig")) {
    return "Die Druckfestigkeit liegt unter dem erwarteten Bereich. Prüfe Bruchlast, Probenalter und Würfelmaß.";
  }
  if (lower.includes("din en 12390")) {
    return "Ich kann dir eine allgemeine Orientierung geben. Maßgeblich ist immer die gültige Originalnorm.";
  }
  if (lower.includes("druckfestigkeit")) {
    return "Die Druckfestigkeit berechnet sich aus der Bruchlast geteilt durch die Belastungsfläche. Eine genaue Berechnung bereite ich im Formelmodus vor – die Bewertung sollte fachlich geprüft werden.";
  }
  if (lower.includes("w/z") || lower.includes("wasser-zement")) {
    return "Der W/Z-Wert beschreibt das Verhältnis von Wasser- zu Zementmasse im Frischbeton. Er beeinflusst Festigkeit und Dauerhaftigkeit – die genaue Rezeptur sollte gegen die Norm geprüft werden.";
  }
  if (lower.includes("norm")) {
    return "Ich kann dir passende Normenhinweise zusammenstellen. Maßgeblich bleibt immer die gültige Originalnorm.";
  }
  if (lower.includes("bericht")) {
    return "Ich kann dir eine Zusammenfassung der wichtigsten Kennwerte und Bewertungen aus dem Bericht vorbereiten.";
  }
  if (lower.includes("baustellenmodus")) {
    return "Der Baustellenmodus ist für die schnelle Dateneingabe direkt vor Ort gedacht – mit vereinfachter Ansicht und größeren Eingabefeldern.";
  }
  if (lower.includes("prüfwerte") || lower.includes("analysier")) {
    return "Ich kann die zuletzt erfassten Prüfwerte auf Ausreißer und Auffälligkeiten hin einordnen. Eine fachliche Prüfung bleibt weiterhin erforderlich.";
  }

  const modeHints: Record<AiMode, string> = {
    Allgemein: "Ich unterstütze dich gerne weiter – wie kann ich konkret helfen?",
    Beton: "Im Beton-Modus kann ich dir bei Druckfestigkeit, Rohdichte und weiteren Betonprüfungen helfen.",
    Asphalt: "Im Asphalt-Modus kann ich dir bei Marshall-Prüfung, Sieblinie und weiteren Asphaltprüfungen helfen.",
    Geotechnik:
      "Im Geotechnik-Modus kann ich dir bei Proctorversuch, Wassergehalt und weiteren Bodenprüfungen helfen.",
    Bericht: "Im Berichts-Modus kann ich dir beim Zusammenfassen und Prüfen von Prüfberichten helfen.",
    Normen: "Im Normen-Modus gebe ich dir eine allgemeine Orientierung. Maßgeblich ist immer die gültige Originalnorm.",
    Fehleranalyse: "Im Fehleranalyse-Modus helfe ich dir, Auffälligkeiten in Prüfwerten einzuordnen.",
  };
  return modeHints[mode];
}

export function useAI() {
  const initialChats = aiService.getAiChats();
  const [chats, setChats] = useState<AiChat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChats[0]?.id ?? null);
  const [mode, setMode] = useState<AiMode>("Allgemein");

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

  function newChat() {
    const chat: AiChat = {
      id: `chat-${Date.now()}`,
      title: "Neuer Chat",
      category: "Heute",
      mode,
      timestamp: "Jetzt",
      messages: [],
    };
    setChats((current) => [chat, ...current]);
    setActiveChatId(chat.id);
    return chat;
  }

  function selectChat(chat: AiChat) {
    setActiveChatId(chat.id);
    setMode(chat.mode);
  }

  function sendMessage(content: string) {
    const trimmed = content.trim();
    if (trimmed.length === 0) return;

    const timestamp = "Jetzt";
    const userMessage: AiMessage = { id: `m-${Date.now()}`, role: "user", content: trimmed, timestamp };
    const assistantMessage: AiMessage = {
      id: `m-${Date.now() + 1}`,
      role: "assistant",
      content: getCannedReply(trimmed, mode),
      timestamp,
    };

    if (activeChatId) {
      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, userMessage, assistantMessage] }
            : chat
        )
      );
    } else {
      const newChatId = `chat-${Date.now()}`;
      const chat: AiChat = {
        id: newChatId,
        title: trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed,
        category: "Heute",
        mode,
        timestamp,
        messages: [userMessage, assistantMessage],
      };
      setChats((current) => [chat, ...current]);
      setActiveChatId(newChatId);
    }
  }

  function quickAction(action: AiQuickAction) {
    sendMessage(action.prompt);
  }

  function reactivateChat(chat: AiChat) {
    setChats((current) => current.map((item) => (item.id === chat.id ? { ...item, category: "Heute" } : item)));
  }

  function archiveChat(chat: AiChat) {
    setChats((current) => current.map((item) => (item.id === chat.id ? { ...item, category: "Archiviert" } : item)));
  }

  function deleteChat(chat: AiChat) {
    setChats((current) => current.filter((item) => item.id !== chat.id));
    setActiveChatId((current) => (current === chat.id ? null : current));
  }

  return {
    chats,
    activeChatId,
    activeChat,
    mode,
    setMode,
    newChat,
    selectChat,
    sendMessage,
    quickAction,
    reactivateChat,
    archiveChat,
    deleteChat,
    tools: aiService.getAiTools(),
    contextCards: aiService.getAiContextCards(),
    quickActions: aiService.getAiQuickActions(),
    recentResults: aiService.getAiRecentResults(),
  };
}
