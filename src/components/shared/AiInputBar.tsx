import type { KeyboardEvent } from "react";
import { Image as ImageIcon, Mic, Paperclip, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AiInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onAnalyzeImage: () => void;
  onVoiceNote: () => void;
}

export function AiInputBar({ value, onChange, onSend, onAttach, onAnalyzeImage, onVoiceNote }: AiInputBarProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Frag PrüfCheck AI zu Proben, Prüfwerten, Normen oder Berichten…"
        className="min-h-16 resize-none border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={onAttach}>
            <Paperclip className="size-4" />
            Datei anhängen
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Bild analysieren" onClick={onAnalyzeImage}>
            <ImageIcon className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Sprachnotiz" onClick={onVoiceNote}>
            <Mic className="size-4" />
          </Button>
        </div>
        <Button type="button" size="icon" aria-label="Nachricht senden" onClick={onSend} disabled={value.trim().length === 0}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
