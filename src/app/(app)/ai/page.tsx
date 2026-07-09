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
import { useAI } from "@/hooks/useAI";
import type { AiChat, AiContextCard, AiMessage, AiQuickAction, AiTool } from "@/types/ai";

const contextCardRoutes: Record<string, string> = {
  "ctx-probe": "/probekoerper",
  "ctx-projekt": "/projekte",
  "ctx-kunde": "/kunden",
  "ctx-bericht": "/pdf-export",
};

export default function AiPage() {
  const router = useRouter();
  const {
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
    archiveChat: archiveChatData,
    deleteChat: deleteChatData,
    tools: aiTools,
    contextCards: aiContextCards,
    quickActions: aiQuickActions,
    recentResults: aiRecentResults,
  } = useAI();
  const [draft, setDraft] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [archiveChat, setArchiveChat] = useState<AiChat | null>(null);
  const [deleteChat, setDeleteChat] = useState<AiChat | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  function handleContextCardClick(card: AiContextCard) {
    const target = contextCardRoutes[card.id];
    if (target) {
      router.push(target);
      return;
    }
    showFeedback("Diese Funktion wird später angebunden.");
  }

  function handleNewChat() {
    newChat();
    setIsHistoryOpen(false);
  }

  function handleSelectChat(chat: AiChat) {
    selectChat(chat);
    setIsHistoryOpen(false);
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
    reactivateChat(chat);
    showFeedback(`Chat „${chat.title}" wurde reaktiviert.`);
  }

  function handleConfirmArchive(chat: AiChat) {
    archiveChatData(chat);
    setArchiveChat(null);
  }

  function handleConfirmDelete(chat: AiChat) {
    deleteChatData(chat);
    setDeleteChat(null);
  }

  function handleQuickAction(action: AiQuickAction) {
    quickAction(action);
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
            onSend={() => {
              sendMessage(draft);
              setDraft("");
            }}
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
