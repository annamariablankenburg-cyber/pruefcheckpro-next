"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, Settings, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AiChatSidebar } from "@/components/shared/AiChatSidebar";
import { AiContextPanel } from "@/components/shared/AiContextPanel";
import { AiInputBar } from "@/components/shared/AiInputBar";
import { AiMessageList } from "@/components/shared/AiMessageList";
import { AiModeSelector } from "@/components/shared/AiModeSelector";
import { AiQuickActions } from "@/components/shared/AiQuickActions";
import { AiSafetyNotice } from "@/components/shared/AiSafetyNotice";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { aiRepository } from "@/lib/repositories/aiRepository";
import type { AiChat, AiContextCard, AiMessage, AiMode, AiQuickAction, AiTool } from "@/types/ai";

const initialChats = aiRepository.getAll();
const aiContextCards = aiRepository.getContextCards();
const aiQuickActions = aiRepository.getQuickActions();
const aiRecentResults = aiRepository.getRecentResults();
const aiTools = aiRepository.getTools();

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

const contextCardRoutes: Record<string, string> = {
  "ctx-probe": "/probekoerper",
  "ctx-projekt": "/projekte",
  "ctx-kunde": "/kunden",
  "ctx-bericht": "/pdf-export",
};

export default function AiPage() {
  const router = useRouter();
  const [chats, setChats] = useState<AiChat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChats[0]?.id ?? null);
  const [mode, setMode] = useState<AiMode>("Allgemein");
  const [draft, setDraft] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [archiveChat, setArchiveChat] = useState<AiChat | null>(null);
  const [deleteChat, setDeleteChat] = useState<AiChat | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

  function handleContextCardClick(card: AiContextCard) {
    const target = contextCardRoutes[card.id];
    if (target) {
      router.push(target);
      return;
    }
    showFeedback("Diese Funktion wird später angebunden.");
  }

  function handleNewChat() {
    const newChat: AiChat = {
      id: `chat-${Date.now()}`,
      title: "Neuer Chat",
      category: "Heute",
      mode,
      timestamp: "Jetzt",
      messages: [],
    };
    setChats((current) => [newChat, ...current]);
    setActiveChatId(newChat.id);
    setIsHistoryOpen(false);
  }

  function handleSelectChat(chat: AiChat) {
    setActiveChatId(chat.id);
    setMode(chat.mode);
    setIsHistoryOpen(false);
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
      const newChat: AiChat = {
        id: newChatId,
        title: trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed,
        category: "Heute",
        mode,
        timestamp,
        messages: [userMessage, assistantMessage],
      };
      setChats((current) => [newChat, ...current]);
      setActiveChatId(newChatId);
    }
    setDraft("");
  }

  function handleQuickAction(action: AiQuickAction) {
    sendMessage(action.prompt);
  }

  function handleCopy(message: AiMessage) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(message.content)
        .then(() => showFeedback("Antwort kopiert."))
        .catch(() => showFeedback("Kopieren nicht möglich."));
    } else {
      showFeedback("Kopieren nicht möglich.");
    }
  }

  function handleFeedback() {
    showFeedback("Danke für dein Feedback.");
  }

  function handleSaveToLaborbuch() {
    showFeedback("Diese Funktion wird später angebunden.");
  }

  function handleReactivateChat(chat: AiChat) {
    setChats((current) =>
      current.map((item) => (item.id === chat.id ? { ...item, category: "Heute" } : item))
    );
    showFeedback(`Chat „${chat.title}" wurde reaktiviert.`);
  }

  function handleConfirmArchive(chat: AiChat) {
    setChats((current) =>
      current.map((item) => (item.id === chat.id ? { ...item, category: "Archiviert" } : item))
    );
    setArchiveChat(null);
  }

  function handleConfirmDelete(chat: AiChat) {
    setChats((current) => current.filter((item) => item.id !== chat.id));
    setActiveChatId((current) => (current === chat.id ? null : current));
    setDeleteChat(null);
  }

  function handleToolSelect(tool: AiTool) {
    showFeedback(`${tool.label}: Diese Funktion wird später angebunden.`);
  }

  const sidebar = (
    <AiChatSidebar
      chats={chats}
      activeChatId={activeChatId}
      onSelectChat={handleSelectChat}
      onNewChat={handleNewChat}
      onArchiveChat={setArchiveChat}
      onReactivateChat={handleReactivateChat}
      onDeleteChat={setDeleteChat}
    />
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            PrüfCheck AI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dein intelligenter Assistent für Prüfwerte, Normen, Berichte und Laborprozesse.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setIsHistoryOpen(true)} className="lg:hidden">
            <History className="size-4" />
            Verlauf
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => showFeedback("Diese Funktion wird später angebunden.")}
          >
            <Settings className="size-4" />
            Einstellungen
          </Button>
          <Button type="button" onClick={handleNewChat}>
            <Sparkles className="size-4" />
            Neuer Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_300px]">
        <Card className="hidden max-h-[calc(100vh-10rem)] lg:block">
          <CardContent className="flex h-full flex-col overflow-y-auto">{sidebar}</CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <AiModeSelector mode={mode} onModeChange={setMode} />
          <AiSafetyNotice />

          {activeChat && activeChat.messages.length > 0 ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
              <AiMessageList
                messages={activeChat.messages}
                onCopy={handleCopy}
                onFeedback={handleFeedback}
                onSaveToLaborbuch={handleSaveToLaborbuch}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Was möchtest du heute prüfen?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Wähle eine Schnellaktion oder stelle direkt deine Frage.
                </p>
              </div>
              <AiQuickActions actions={aiQuickActions} onSelect={handleQuickAction} />
            </div>
          )}

          <AiInputBar
            value={draft}
            onChange={setDraft}
            onSend={() => sendMessage(draft)}
            onAttach={() => showFeedback("Diese Funktion wird später angebunden.")}
            onAnalyzeImage={() => showFeedback("Diese Funktion wird später angebunden.")}
            onVoiceNote={() => showFeedback("Diese Funktion wird später angebunden.")}
          />
        </div>

        <div>
          <AiContextPanel
            contextCards={aiContextCards}
            tools={aiTools}
            recentResults={aiRecentResults}
            onToolSelect={handleToolSelect}
            onViewAllResults={() => showFeedback("Diese Funktion wird später angebunden.")}
            onContextCardClick={handleContextCardClick}
          />
        </div>
      </div>

      <Drawer open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Chat-Verlauf</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>{sidebar}</DrawerBody>
        </DrawerContent>
      </Drawer>

      <ConfirmActionDialog<AiChat>
        subject={archiveChat}
        title="Chat archivieren?"
        description="Der Chat wird aus der aktiven Übersicht ausgeblendet, bleibt aber erhalten."
        confirmLabel="Archivieren"
        onOpenChange={(open) => !open && setArchiveChat(null)}
        onConfirm={handleConfirmArchive}
      />

      <ConfirmActionDialog<AiChat>
        subject={deleteChat}
        title="Chat wirklich löschen?"
        description="Diese Aktion kann nicht rückgängig gemacht werden. Der Chatverlauf wird dauerhaft entfernt."
        confirmLabel="Löschen"
        confirmVariant="destructive"
        onOpenChange={(open) => !open && setDeleteChat(null)}
        onConfirm={handleConfirmDelete}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
