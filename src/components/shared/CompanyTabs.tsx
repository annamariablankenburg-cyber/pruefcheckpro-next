import { cn } from "@/lib/utils";

export interface CompanyTab {
  value: string;
  label: string;
}

interface CompanyTabsProps {
  tabs: CompanyTab[];
  value: string;
  onChange: (value: string) => void;
}

export function CompanyTabs({ tabs, value, onChange }: CompanyTabsProps) {
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
