import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TaskListItem {
  id: string;
  title: string;
  tag: string;
  meta: string;
}

interface TaskListCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tasks: TaskListItem[];
  tone?: "default" | "danger";
  footerLabel: string;
  footerHref: string;
}

export function TaskListCard({
  icon: Icon,
  title,
  description,
  tasks,
  tone = "default",
  footerLabel,
  footerHref,
}: TaskListCardProps) {
  const isDanger = tone === "danger";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                isDanger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              )}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant={isDanger ? "destructive" : "secondary"}>{tasks.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="-mx-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  isDanger ? "bg-destructive" : "bg-primary"
                )}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground" title={task.title}>
                  {task.title}
                </p>
                <p className="truncate text-xs text-muted-foreground" title={task.tag}>
                  {task.tag}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                isDanger ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {task.meta}
            </span>
          </div>
        ))}

        <Link
          href={footerHref}
          className="mt-2 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {footerLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
