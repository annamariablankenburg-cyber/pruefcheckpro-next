import { cn } from "@/lib/utils";
import type { LearningTab, LearningTabId } from "@/types/learning";

interface LearningTabsProps {
  tabs: LearningTab[];
  value: LearningTabId;
  onChange: (value: LearningTabId) => void;
}

export function LearningTabs({ tabs, value, onChange }: LearningTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
