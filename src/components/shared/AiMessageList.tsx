import { AiMessageBubble } from "@/components/shared/AiMessageBubble";
import type { AiMessage } from "@/types/ai";

interface AiMessageListProps {
  messages: AiMessage[];
  onCopy: (message: AiMessage) => void;
  onFeedback: (message: AiMessage) => void;
  onSaveToLaborbuch: (message: AiMessage) => void;
}

export function AiMessageList({ messages, onCopy, onFeedback, onSaveToLaborbuch }: AiMessageListProps) {
  return (
    <div className="flex flex-col gap-5">
      {messages.map((message) => (
        <AiMessageBubble
          key={message.id}
          message={message}
          onCopy={onCopy}
          onFeedback={onFeedback}
          onSaveToLaborbuch={onSaveToLaborbuch}
        />
      ))}
    </div>
  );
}
