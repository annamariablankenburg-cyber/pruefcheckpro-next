import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { MessageSquare, Send, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AiAssistantCategory {
  label: string;
  action: string;
  icon: LucideIcon;
  href: string;
}

export interface AiRecentConversation {
  title: string;
  href: string;
}

interface AiAssistantCardProps {
  userName: string;
  categories: AiAssistantCategory[];
  recentConversations: AiRecentConversation[];
  ctaHref: string;
}

export function AiAssistantCard({
  userName,
  categories,
  recentConversations,
  ctaHref,
}: AiAssistantCardProps) {
  return (
    <Card className="h-full bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <CardTitle className="text-base">PrüfCheck AI</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <p className="text-lg font-medium text-foreground">
          Was liegt heute im Labor an, {userName}?
        </p>

        <Link
          href={ctaHref}
          className="group flex items-center gap-3 rounded-2xl bg-muted/60 px-5 py-4 transition-colors hover:bg-muted"
        >
          <span className="flex-1 text-base text-muted-foreground transition-colors group-hover:text-foreground">
            Frag die KI …
          </span>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Send className="size-4.5" />
          </span>
        </Link>

        <div className="grid grid-cols-3 gap-2">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={category.href}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/60 px-2 py-3 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <category.icon className="size-4 text-primary" />
              <span className="text-xs font-medium text-foreground">{category.label}</span>
              <span className="text-[10px] text-muted-foreground">{category.action}</span>
            </Link>
          ))}
        </div>

        {recentConversations.length > 0 && (
          <div className="flex flex-col gap-0.5 border-t border-border pt-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground/60">
              Letzte Unterhaltungen
            </p>
            {recentConversations.map((conversation) => (
              <Link
                key={conversation.title}
                href={conversation.href}
                className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <MessageSquare className="size-3.5 shrink-0" />
                <span className="truncate">{conversation.title}</span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
