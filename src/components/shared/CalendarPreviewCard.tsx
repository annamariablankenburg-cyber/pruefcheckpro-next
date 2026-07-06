import Link from "next/link";
import { ArrowRight, CalendarDays, Flame } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EventTone = "primary" | "success" | "warning";
export type EventPriority = "hoch" | "normal" | "niedrig";

const dotToneStyles: Record<EventTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
};

const priorityDotSize: Record<EventPriority, string> = {
  hoch: "size-3",
  normal: "size-2.5",
  niedrig: "size-2",
};

const priorityTextStyles: Record<EventPriority, string> = {
  hoch: "font-semibold text-foreground",
  normal: "font-medium text-foreground",
  niedrig: "font-normal text-muted-foreground",
};

export interface CalendarPreviewEvent {
  title: string;
  time?: string;
  tone: EventTone;
  priority?: EventPriority;
}

export interface CalendarPreviewDay {
  heading: string;
  isToday?: boolean;
  events: CalendarPreviewEvent[];
}

interface CalendarPreviewCardProps {
  days: CalendarPreviewDay[];
  footerHref: string;
}

export function CalendarPreviewCard({ days, footerHref }: CalendarPreviewCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">Smart-Kalender</CardTitle>
              <p className="text-sm text-muted-foreground">Arbeitsplanung für diese Woche</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Agenda
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {days.map((day, dayIndex) => (
          <div
            key={day.heading}
            className={cn(
              "flex flex-col gap-3",
              day.isToday
                ? "rounded-2xl bg-primary/[0.05] p-4"
                : cn("pb-5", dayIndex > 0 && "border-t border-border pt-6")
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm",
                  day.isToday ? "font-bold text-primary" : "font-semibold text-foreground"
                )}
              >
                {day.heading}
              </span>
              {day.isToday && (
                <Badge className="bg-primary text-primary-foreground">Heute</Badge>
              )}
            </div>

            {day.events.length === 0 ? (
              <p className="pl-1 text-sm text-muted-foreground/50">Keine Termine</p>
            ) : (
              <div className="flex flex-col">
                {day.events.map((event, index) => {
                  const priority = event.priority ?? "normal";
                  return (
                    <div key={event.title} className="flex gap-3">
                      <span className="w-12 shrink-0 pt-2 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                        {event.time ?? ""}
                      </span>
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "mt-2.5 shrink-0 rounded-full",
                            dotToneStyles[event.tone],
                            priorityDotSize[priority]
                          )}
                        />
                        {index < day.events.length - 1 && (
                          <span className="w-0.5 flex-1 rounded-full bg-border" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
                        {priority === "hoch" && (
                          <Flame className="size-3.5 shrink-0 text-warning" />
                        )}
                        <p className={cn("truncate text-sm", priorityTextStyles[priority])}>
                          {event.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <Link
          href={footerHref}
          className="inline-flex w-fit items-center gap-1 pt-1 text-sm font-medium text-primary hover:underline"
        >
          Zum Kalender
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
