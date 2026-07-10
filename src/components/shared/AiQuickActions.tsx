import { Sparkles } from "lucide-react";

import type { AiQuickAction } from "@/types/ai";

interface AiQuickActionsProps {
  actions: AiQuickAction[];
  onSelect: (action: AiQuickAction) => void;
}

export function AiQuickActions({ actions, onSelect }: AiQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onSelect(action)}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <p className="text-sm font-medium text-foreground">{action.label}</p>
        </button>
      ))}
    </div>
  );
}
