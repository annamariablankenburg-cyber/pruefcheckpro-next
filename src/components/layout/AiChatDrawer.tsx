"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  BookOpen,
  Building2,
  Calculator,
  FileText,
  FlaskConical,
  Layers,
  Maximize2,
  MessageSquare,
  MessageSquarePlus,
  Mountain,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";

interface AiChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickActions = [
  { label: "Beton", icon: Building2 },
  { label: "Asphalt", icon: Layers },
  { label: "Geotechnik", icon: Mountain },
  { label: "DIN-Normen", icon: BookOpen },
  { label: "Berechnungen", icon: Calculator },
  { label: "PDF erklären", icon: FileText },
  { label: "Laborhilfe", icon: FlaskConical },
];

const chatHistory = [
  { title: "Warum wurde C30/37 nicht erreicht?", time: "Heute" },
  { title: "DIN EN 12390 erklären", time: "Gestern" },
  { title: "Proctor berechnen", time: "Montag" },
];

export function AiChatDrawer({ open, onOpenChange }: AiChatDrawerProps) {
  const [message, setMessage] = useState("");
  const { message: feedback, showFeedback } = useFeedbackToast();

  function handleSend() {
    if (message.trim().length === 0) return;
    setMessage("");
    showFeedback("Diese Funktion wird später angebunden.");
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border bg-card text-card-foreground shadow-2xl outline-none duration-300 data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right sm:max-w-md"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-4.5" />
              </div>
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                PrüfCheck AI
              </DialogPrimitive.Title>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Neuer Chat"
                onClick={() => showFeedback("Diese Funktion wird später angebunden.")}
              >
                <MessageSquarePlus className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Vollbild öffnen" asChild>
                <Link href="/ai">
                  <Maximize2 className="size-4" />
                </Link>
              </Button>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Schließen">
                  <X className="size-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-foreground">👋 Wie kann ich helfen?</p>
              <p className="text-sm text-muted-foreground">
                Wähle einen Bereich oder stelle direkt deine Frage.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => showFeedback("Diese Funktion wird später angebunden.")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <action.icon className="size-3.5" />
                  {action.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1 border-t border-border pt-5">
              <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Chatverlauf
              </p>
              {chatHistory.map((entry) => (
                <button
                  key={entry.title}
                  type="button"
                  onClick={() => showFeedback("Diese Funktion wird später angebunden.")}
                  className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/60"
                >
                  <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{entry.time}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border p-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary/40"
            >
              <Input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Frag die KI …"
                className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
              <Button type="submit" size="icon-sm" aria-label="Senden" disabled={message.trim().length === 0}>
                <Send className="size-4" />
              </Button>
            </form>
          </div>

          <FeedbackToast message={feedback} className="pointer-events-none absolute bottom-20 z-10" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
