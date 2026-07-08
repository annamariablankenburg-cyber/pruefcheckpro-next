import { Archive, ArchiveRestore, MessageSquarePlus, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AiChat, AiChatCategory } from "@/types/ai";

const categories: AiChatCategory[] = ["Heute", "Diese Woche", "Archiviert"];

interface AiChatSidebarProps {
  chats: AiChat[];
  activeChatId: string | null;
  onSelectChat: (chat: AiChat) => void;
  onNewChat: () => void;
  onArchiveChat: (chat: AiChat) => void;
  onReactivateChat: (chat: AiChat) => void;
  onDeleteChat: (chat: AiChat) => void;
  className?: string;
}

export function AiChatSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onArchiveChat,
  onReactivateChat,
  onDeleteChat,
  className,
}: AiChatSidebarProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Button type="button" variant="outline" className="w-full justify-start" onClick={onNewChat}>
        <MessageSquarePlus className="size-4" />
        Neuer Chat
      </Button>

      <div className="flex flex-col gap-5 overflow-y-auto">
        {categories.map((category) => {
          const items = chats.filter((chat) => chat.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category} className="flex flex-col gap-1.5">
              <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {category}
              </p>
              {items.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-lg px-1 transition-colors",
                    activeChatId === chat.id ? "bg-primary/10" : "hover:bg-muted/60"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectChat(chat)}
                    className="min-w-0 flex-1 py-2 pl-2 text-left"
                  >
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        activeChatId === chat.id ? "text-primary" : "text-foreground"
                      )}
                    >
                      {chat.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{chat.timestamp}</p>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                        aria-label={`Aktionen für ${chat.title}`}
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onSelectChat(chat)}>
                        <MessageSquarePlus />
                        Chat öffnen
                      </DropdownMenuItem>
                      {chat.category === "Archiviert" ? (
                        <DropdownMenuItem onSelect={() => onReactivateChat(chat)}>
                          <ArchiveRestore />
                          Reaktivieren
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => onArchiveChat(chat)}>
                          <Archive />
                          Chat archivieren
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem variant="destructive" onSelect={() => onDeleteChat(chat)}>
                        <Trash2 />
                        Chat löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
