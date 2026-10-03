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
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative shrink-0 rounded-t-md px-3.5 py-2.5 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive ? "text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-2 bottom-0 h-0.5 origin-center rounded-full bg-primary transition-[transform,opacity] duration-250 ease-(--ease-out-soft)",
                isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
