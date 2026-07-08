import { Card, CardContent } from "@/components/ui/card";
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
          <Card
            key={action.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(action)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelect(action);
            }}
            className="cursor-pointer py-0 transition-colors hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10"
          >
            <CardContent className="flex min-h-28 flex-col items-center justify-center gap-2.5 px-3 py-5 text-center">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">{action.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
