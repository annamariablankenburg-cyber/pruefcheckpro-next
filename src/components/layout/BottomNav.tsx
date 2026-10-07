"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { allNavItems, primaryMobileNavItems } from "@/config/navigation";
import { useDomainPermissions } from "@/hooks/useDomainPermissions";
import { filterNavItems } from "@/lib/permissions/domainAccess";

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  // Nur Bereiche mit *.ansehen (fail-closed, solange die Rechte laden).
  const { permissions } = useDomainPermissions();
  const primaryItems = filterNavItems(primaryMobileNavItems, permissions);
  const moreItems = filterNavItems(allNavItems, permissions);

  return (
    <>
      <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {primaryItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium outline-none transition-colors duration-200 focus-visible:bg-muted",
                isActive ? "text-primary" : "text-muted-foreground active:text-foreground"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-primary transition-[opacity,transform] duration-200 ease-(--ease-out-soft)",
                  isActive ? "scale-x-100 opacity-100" : "scale-x-50 opacity-0"
                )}
              />
              <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setShowMore(true)}
          aria-label="Weitere Bereiche anzeigen"
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground outline-none transition-colors duration-200 focus-visible:bg-muted active:text-foreground"
        >
          <MoreHorizontal className="size-5" />
          Mehr
        </button>
      </nav>

      {showMore && (
        <div className="fixed inset-0 z-40 flex flex-col bg-background md:hidden">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="text-lg font-semibold text-foreground">Menü</span>
            <button
              type="button"
              onClick={() => setShowMore(false)}
              aria-label="Menü schließen"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors duration-200 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-colors duration-200 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
