"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

import Logo from "@/components/shared/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navGroups } from "@/config/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Azubi-Plan</span>
            <Badge variant="secondary">Aktiv</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Schalte Prüfverfahren, Probekörperverwaltung und mehr frei.
          </p>
          <Button size="sm" variant="outline" className="mt-1 w-full" asChild>
            <Link href="/preise">
              Upgrade ansehen
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
