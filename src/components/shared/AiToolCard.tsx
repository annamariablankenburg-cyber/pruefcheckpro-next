import { Card, CardContent } from "@/components/ui/card";
import type { AiTool } from "@/types/ai";

interface AiToolCardProps {
  tool: AiTool;
  onSelect: (tool: AiTool) => void;
}

export function AiToolCard({ tool, onSelect }: AiToolCardProps) {
  const Icon = tool.icon;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(tool)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(tool);
      }}
      className="cursor-pointer py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <CardContent className="flex flex-col gap-2 px-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{tool.label}</p>
          <p className="text-xs text-muted-foreground">{tool.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
