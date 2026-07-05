"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { allNavItems, primaryMobileNavItems } from "@/config/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        {primaryMobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setShowMore(true)}
          aria-label="Weitere Bereiche anzeigen"
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
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
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
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
