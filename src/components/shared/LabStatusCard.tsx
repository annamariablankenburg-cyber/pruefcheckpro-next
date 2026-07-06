import { Activity, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface WeekOverviewDay {
  label: string;
  count: number;
  heightClass: string;
  isToday?: boolean;
}

interface LabStatusCardProps {
  capacity: number;
  activeSamples: number;
  completedThisWeek: number;
  trend: string;
  week: WeekOverviewDay[];
}

export function LabStatusCard({
  capacity,
  activeSamples,
  completedThisWeek,
  trend,
  week,
}: LabStatusCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
            <Activity className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">Laborstatus</CardTitle>
            <CardDescription>Auslastung &amp; Wochenübersicht</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Kapazitätsauslastung</span>
            <span className="font-semibold text-foreground">{capacity}%</span>
          </div>
          <Progress value={capacity} />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Abgeschlossen diese Woche</p>
            <p className="text-lg font-semibold text-foreground">{completedThisWeek}</p>
          </div>
          <Badge variant="secondary" className="gap-1 text-success">
            <TrendingUp className="size-3" />
            {trend}
          </Badge>
        </div>

        <div className="flex items-end justify-between gap-2">
          {week.map((day) => (
            <div key={day.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-16 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-md bg-primary/15",
                    day.isToday && "bg-primary",
                    day.heightClass
                  )}
                />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{activeSamples} aktive Proben im Labor</p>
      </CardContent>
    </Card>
  );
}
