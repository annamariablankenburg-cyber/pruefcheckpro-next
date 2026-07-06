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
    <Card className="h-full shadow-sm shadow-foreground/5">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className={cn("flex size-10 items-center justify-center rounded-xl", toneStyles[tone])}>
            <Icon className="size-5" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {trend && (
            <span
              className={cn(
                "mb-1 inline-flex items-center gap-1 text-xs font-semibold",
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
