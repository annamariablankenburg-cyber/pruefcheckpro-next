"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

import Logo from "@/components/shared/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navGroups } from "@/config/navigation";
import { useDomainPermissions } from "@/hooks/useDomainPermissions";
import { filterNavGroups } from "@/lib/permissions/domainAccess";

export function Sidebar() {
  const pathname = usePathname();
  // Fachbereiche ohne *.ansehen erscheinen nicht (fail-closed, solange die Rechte laden).
  const { permissions } = useDomainPermissions();
  const visibleGroups = filterNavGroups(navGroups, permissions);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="relative flex h-16 items-center border-b border-border px-5">
        <Link
          href="/dashboard"
          className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Logo />
        </Link>
        <div aria-hidden="true" className="ruler-x pointer-events-none absolute inset-x-0 bottom-0 h-2.5 opacity-70" />
      </div>

      <nav aria-label="Hauptnavigation" className="flex-1 overflow-y-auto px-3 py-5">
        <div className="flex flex-col gap-6">
          {visibleGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <p className="label-caps mb-1 flex items-center gap-2 px-3">
                {group.label}
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group/nav relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-[background-color,color,transform] duration-200 ease-(--ease-out-soft) focus-visible:ring-3 focus-visible:ring-ring/50",
                      isActive
                        ? "bg-primary/[0.09] font-semibold text-primary"
                        : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full bg-primary transition-[opacity,transform] duration-200 ease-(--ease-out-soft)",
                        isActive ? "scale-y-100 opacity-100" : "scale-y-50 opacity-0"
                      )}
                    />
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-[transform,color] duration-200 ease-(--ease-out-soft)",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover/nav:text-foreground motion-safe:group-hover/nav:translate-x-0.5"
                      )}
                      strokeWidth={isActive ? 2.25 : 2}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <div className="surface-flat relative flex flex-col gap-2 overflow-hidden rounded-xl p-4">
          <div aria-hidden="true" className="tech-grid-fine pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Azubi-Plan</span>
            <Badge variant="secondary">Aktiv</Badge>
          </div>
          <p className="relative text-xs text-muted-foreground">
            Schalte Prüfverfahren, Probekörperverwaltung und mehr frei.
          </p>
          <Button size="sm" variant="outline" className="relative mt-1 w-full" asChild>
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
