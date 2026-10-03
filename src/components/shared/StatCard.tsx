import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "default" | "success" | "danger" | "warning";

const toneStyles: Record<StatTone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
};

// Feine Akzentlinie am oberen Rand: gibt der Kennzahl eine Tonalität, ohne die
// ganze Karte einzufärben.
const accentStyles: Record<StatTone, string> = {
  default: "from-primary/70 via-primary/25",
  success: "from-success/70 via-success/25",
  danger: "from-destructive/70 via-destructive/25",
  warning: "from-warning/80 via-warning/25",
};

interface StatCardTrend {
  value: string;
  direction: "up" | "down";
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: StatCardTrend;
  tone?: StatTone;
}

export function StatCard({ icon: Icon, label, value, trend, tone = "default" }: StatCardProps) {
  return (
    <Card variant="elevated" className="relative h-full gap-0 py-0">
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r to-transparent",
          accentStyles[tone]
        )}
      />
      <CardContent className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="label-caps leading-tight">{label}</span>
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              toneStyles[tone]
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <p className="num text-4xl leading-none font-semibold text-foreground">{value}</p>
          {trend && (
            <span
              className={cn(
                "mb-0.5 inline-flex items-center gap-1 text-xs font-semibold",
                trend.direction === "up" ? "text-success" : "text-destructive"
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
