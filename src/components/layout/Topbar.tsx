"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Sparkles } from "lucide-react";

import { AiChatDrawer } from "@/components/layout/AiChatDrawer";
import Logo from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/firebase/auth";

export function Topbar() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2500);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Link href="/dashboard" className="md:hidden">
        <Logo />
      </Link>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={() => setAiOpen(true)}>
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">KI öffnen</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Benachrichtigungen"
          onClick={() => showFeedback("Diese Funktion wird später angebunden.")}
        >
          <Bell className="size-4" />
        </Button>
        <ThemeToggle />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Abmelden"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="size-4" />
        </Button>
        <Avatar>
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
      </div>

      <AiChatDrawer open={aiOpen} onOpenChange={setAiOpen} />

      {feedback && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg">
          {feedback}
        </div>
      )}
    </header>
  );
}
