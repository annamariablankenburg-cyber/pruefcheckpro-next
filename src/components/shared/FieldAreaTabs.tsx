import { cn } from "@/lib/utils";
import type { FieldAreaTab, FieldAreaTabId } from "@/types/fieldArea";

interface FieldAreaTabsProps {
  tabs: FieldAreaTab[];
  value: FieldAreaTabId;
  onChange: (value: FieldAreaTabId) => void;
}

export function FieldAreaTabs({ tabs, value, onChange }: FieldAreaTabsProps) {
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
