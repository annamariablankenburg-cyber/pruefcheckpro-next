import { Progress } from "@/components/ui/progress";

export interface RankingItem {
  label: string;
  value: string;
  percentage: number;
}

interface ProgressRankingProps {
  items: RankingItem[];
  showRank?: boolean;
}

export function ProgressRanking({ items, showRank = false }: ProgressRankingProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, index) => (
        <div key={item.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
              {showRank && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
              )}
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 text-muted-foreground">{item.value}</span>
          </div>
          <Progress value={item.percentage} />
        </div>
      ))}
    </div>
  );
}
