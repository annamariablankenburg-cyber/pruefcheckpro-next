import { ClipboardCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { SiteChecklistItem } from "@/types/siteMode";

interface SiteChecklistCardProps {
  items: SiteChecklistItem[];
  onToggle: (item: SiteChecklistItem) => void;
}

export function SiteChecklistCard({ items, onToggle }: SiteChecklistCardProps) {
  const doneCount = items.filter((item) => item.checked).length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">Baustellen-Checkliste</CardTitle>
            <CardDescription>Vor Verlassen der Baustelle prüfen.</CardDescription>
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-foreground">
          {doneCount}/{items.length}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={progress} />
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-foreground hover:bg-muted/50"
            >
              <Checkbox checked={item.checked} onCheckedChange={() => onToggle(item)} />
              <span className={item.checked ? "text-muted-foreground line-through" : undefined}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
