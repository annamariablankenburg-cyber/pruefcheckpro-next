import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  dotClass: string;
}

interface FakeDonutChartProps {
  segments: DonutSegment[];
  gradientClassName: string;
  centerLabel: string;
  centerValue: string;
}

export function FakeDonutChart({
  segments,
  gradientClassName,
  centerLabel,
  centerValue,
}: FakeDonutChartProps) {
  return (
    <div className="flex items-center gap-6">
      <div className={cn("relative size-32 shrink-0 rounded-full", gradientClassName)}>
        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-card text-center">
          <span className="text-xl font-semibold text-foreground">{centerValue}</span>
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2 text-sm">
            <span className={cn("size-2.5 shrink-0 rounded-full", segment.dotClass)} />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="ml-auto font-medium text-foreground">{segment.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
