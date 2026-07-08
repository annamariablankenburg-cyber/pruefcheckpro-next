import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { AiQuickAction } from "@/types/ai";

interface AiQuickActionsProps {
  actions: AiQuickAction[];
  onSelect: (action: AiQuickAction) => void;
}

export function AiQuickActions({ actions, onSelect }: AiQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <Card
          key={action.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(action)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onSelect(action);
          }}
          className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <p className="text-sm font-medium text-foreground">{action.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
