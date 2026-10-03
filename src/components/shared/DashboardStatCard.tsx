import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "default" | "warning" | "danger" | "success";

const toneStyles: Record<StatTone, { icon: string; meta: string; accent: string; featuredIcon: string }> = {
  default: {
    icon: "bg-primary/10 text-primary",
    meta: "text-muted-foreground",
    accent: "from-primary/70 via-primary/25",
    featuredIcon: "bg-primary text-primary-foreground",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    meta: "text-warning",
    accent: "from-warning/80 via-warning/25",
    featuredIcon: "bg-warning text-warning-foreground",
  },
  danger: {
    icon: "bg-destructive/10 text-destructive",
    meta: "text-destructive",
    accent: "from-destructive/70 via-destructive/25",
    featuredIcon: "bg-destructive text-white",
  },
  success: {
    icon: "bg-success/10 text-success",
    meta: "text-success",
    accent: "from-success/70 via-success/25",
    featuredIcon: "bg-success text-success-foreground",
  },
};

interface DashboardStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  meta: string;
  tone?: StatTone;
  actionLabel?: string;
  actionHref?: string;
  // Hervorgehobene Kennzahl: größere Zahl, Akzentfläche. Rein visuell.
  featured?: boolean;
  className?: string;
}

export function DashboardStatCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = "default",
  actionLabel,
  actionHref,
  featured = false,
  className,
}: DashboardStatCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card
      variant={featured ? "highlight" : "elevated"}
      className={cn("relative h-full gap-0 py-0", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r to-transparent",
          styles.accent
        )}
      />
      <CardContent className={cn("flex flex-col px-4", featured ? "gap-5 py-5" : "gap-4 py-4")}>
        <div className="flex items-center justify-between gap-2">
          <span className="label-caps leading-tight">{label}</span>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg",
              featured ? "size-10 shadow-(--elev-2)" : "size-8",
              featured ? styles.featuredIcon : styles.icon
            )}
          >
            <Icon className={featured ? "size-5" : "size-4"} />
          </div>
        </div>

        <p
          className={cn(
            "num leading-none font-semibold text-foreground",
            featured ? "text-5xl sm:text-6xl" : "text-4xl"
          )}
        >
          {value}
        </p>

        {actionHref ? (
          <Link
            href={actionHref}
            className={cn(
              "group/link inline-flex w-fit items-center gap-1 rounded-sm text-xs font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              styles.meta
            )}
          >
            {actionLabel ?? meta}
            <ArrowRight className="size-3 transition-transform duration-200 ease-(--ease-out-soft) motion-safe:group-hover/link:translate-x-0.5" />
          </Link>
        ) : (
          <p className={cn("text-xs font-medium", styles.meta)}>{meta}</p>
        )}
      </CardContent>
    </Card>
  );
}
