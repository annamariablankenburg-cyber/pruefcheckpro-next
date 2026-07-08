import { BookMarked, Copy, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { cn } from "@/lib/utils";
import type { AiMessage } from "@/types/ai";

interface AiMessageBubbleProps {
  message: AiMessage;
  onCopy: (message: AiMessage) => void;
  onFeedback: (message: AiMessage) => void;
  onSaveToLaborbuch: (message: AiMessage) => void;
}

export function AiMessageBubble({ message, onCopy, onFeedback, onSaveToLaborbuch }: AiMessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-2.5">
        <div className="flex max-w-[80%] flex-col items-end gap-1">
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {message.content}
          </div>
          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
        </div>
        <EmployeeAvatar initials="AN" size="sm" />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-4" />
      </div>
      <div className="flex max-w-[80%] flex-col items-start gap-2">
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm whitespace-pre-line text-foreground"
          )}
        >
          {message.content}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Antwort kopieren"
            onClick={() => onCopy(message)}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Positives Feedback"
            onClick={() => onFeedback(message)}
          >
            <ThumbsUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Negatives Feedback"
            onClick={() => onFeedback(message)}
          >
            <ThumbsDown className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-1 h-7"
            onClick={() => onSaveToLaborbuch(message)}
          >
            <BookMarked className="size-3.5" />
            In Laborbuch speichern
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
      </div>
    </div>
  );
}
