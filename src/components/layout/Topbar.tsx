"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import Logo from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Link href="/dashboard" className="md:hidden">
        <Logo />
      </Link>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Benachrichtigungen">
          <Bell className="size-4" />
        </Button>
        <ThemeToggle />
        <Avatar>
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
