import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TrendCardProps {
  label: string;
  value: string;
  trend: { value: string; direction: "up" | "down" };
}

export function TrendCard({ label, value, trend }: TrendCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
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
        </div>
      </CardContent>
    </Card>
  );
}
