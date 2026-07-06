import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "default" | "warning" | "danger" | "success";

const toneStyles: Record<StatTone, { icon: string; meta: string }> = {
  default: { icon: "bg-primary/10 text-primary", meta: "text-muted-foreground" },
  warning: { icon: "bg-warning/10 text-warning", meta: "text-warning" },
  danger: { icon: "bg-destructive/10 text-destructive", meta: "text-destructive" },
  success: { icon: "bg-success/10 text-success", meta: "text-success" },
};

interface DashboardStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  meta: string;
  tone?: StatTone;
  actionLabel?: string;
  actionHref?: string;
}

export function DashboardStatCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = "default",
  actionLabel,
  actionHref,
}: DashboardStatCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className="h-full shadow-sm shadow-foreground/5">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className={cn("flex size-10 items-center justify-center rounded-xl", styles.icon)}>
            <Icon className="size-5" />
          </div>
        </div>

        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>

        {actionHref ? (
          <Link
            href={actionHref}
            className={cn("inline-flex w-fit items-center gap-1 text-xs font-semibold", styles.meta)}
          >
            {actionLabel ?? meta}
            <ArrowRight className="size-3" />
          </Link>
        ) : (
          <p className={cn("text-xs font-medium", styles.meta)}>{meta}</p>
        )}
      </CardContent>
    </Card>
  );
}
