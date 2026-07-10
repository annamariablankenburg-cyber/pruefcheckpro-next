import type { AiTool } from "@/types/ai";

interface AiToolCardProps {
  tool: AiTool;
  onSelect: (tool: AiTool) => void;
}

export function AiToolCard({ tool, onSelect }: AiToolCardProps) {
  const Icon = tool.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{tool.label}</p>
        <p className="text-xs text-muted-foreground">{tool.description}</p>
      </div>
    </button>
  );
}
