import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  href: string;
}

export function QuickActionCard({ icon: Icon, label, href }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-center shadow-sm shadow-foreground/5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" />
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  );
}
