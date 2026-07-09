"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

// Einheitlicher lokaler UI-Hinweis ("Diese Funktion wird später angebunden.",
// Status-Wechsel etc.) – bewusst kein Toast-Framework, nur ein geteiltes
// Pattern für Position, Timing und Stil.
export function useFeedbackToast(duration = 2500) {
  const [message, setMessage] = useState<string | null>(null);

  function showFeedback(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(null), duration);
  }

  return { message, showFeedback };
}

interface FeedbackToastProps {
  message: string | null;
  className?: string;
}

export function FeedbackToast({ message, className }: FeedbackToastProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg",
        className
      )}
    >
      {message}
    </div>
  );
}
