import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyQuickAction } from "@/types/company";

interface CompanyQuickActionsProps {
  actions: CompanyQuickAction[];
}

export function CompanyQuickActions({ actions }: CompanyQuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schnellaktionen</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="flex items-center gap-3 rounded-xl bg-muted/50 px-3.5 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <action.icon className="size-4 shrink-0 text-muted-foreground" />
            {action.label}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
