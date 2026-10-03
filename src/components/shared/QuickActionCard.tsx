import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  href: string;
}

// Schnellaktion: Karte hebt sich leicht, Rand und Schatten reagieren, das Icon
// kippt minimal und ein feiner Lichtstreifen läuft diagonal durch. Alles nur
// Zugabe – die Karte ist ein normaler Link und per Tastatur voll bedienbar.
export function QuickActionCard({ icon: Icon, label, href }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="swoosh group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card px-3.5 py-3.5 text-left shadow-(--elev-1) outline-none transition-[transform,box-shadow,border-color] duration-200 ease-(--ease-out-soft) hover:border-primary/40 hover:shadow-(--elev-3) focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:hover:-translate-y-0.5"
    >
      <div className="flex w-full items-start justify-between">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-[background-color,color,transform] duration-200 ease-(--ease-out-soft) group-hover:bg-primary group-hover:text-primary-foreground motion-safe:group-hover:-rotate-3 motion-safe:group-hover:scale-105">
          <Icon className="size-[18px]" />
        </div>
        <ArrowUpRight className="size-3.5 text-muted-foreground/60 transition-[transform,color] duration-200 ease-(--ease-out-soft) group-hover:text-primary motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" />
      </div>
      <span className="text-[13px] leading-tight font-semibold tracking-[-0.01em] text-foreground">{label}</span>
    </Link>
  );
}
