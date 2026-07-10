import type { SiteQuickActionItem } from "@/types/siteMode";

interface SiteQuickActionsProps {
  actions: SiteQuickActionItem[];
  onSelect: (action: SiteQuickActionItem) => void;
}

export function SiteQuickActions({ actions, onSelect }: SiteQuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onSelect(action)}
            className="flex min-h-28 flex-col items-center justify-center gap-2.5 rounded-xl border border-border bg-card px-3 py-5 text-center shadow-sm shadow-foreground/5 transition-colors hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">{action.label}</p>
          </button>
        );
      })}
    </div>
  );
}
