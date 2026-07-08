import { Sparkles } from "lucide-react";

import { AiToolCard } from "@/components/shared/AiToolCard";
import { RecordList } from "@/components/shared/RecordList";
import type { RecordListItem } from "@/components/shared/RecordList";
import type { AiContextCard, AiTool } from "@/types/ai";

interface AiContextPanelProps {
  contextCards: AiContextCard[];
  tools: AiTool[];
  recentResults: RecordListItem[];
  onToolSelect: (tool: AiTool) => void;
  onViewAllResults: () => void;
}

export function AiContextPanel({
  contextCards,
  tools,
  recentResults,
  onToolSelect,
  onViewAllResults,
}: AiContextPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Kontext</p>
        <div className="flex flex-col gap-2">
          {contextCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="flex items-center gap-2.5 rounded-xl border border-border p-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="truncate text-sm font-medium text-foreground">{card.value}</p>
                  <p className="truncate text-xs text-muted-foreground">{card.meta}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tools</p>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => (
            <AiToolCard key={tool.id} tool={tool} onSelect={onToolSelect} />
          ))}
        </div>
      </div>

      <RecordList
        title="Letzte Ergebnisse"
        icon={Sparkles}
        items={recentResults}
        addLabel="Alle anzeigen"
        onAdd={onViewAllResults}
        emptyLabel="Noch keine Ergebnisse vorhanden."
      />
    </div>
  );
}
