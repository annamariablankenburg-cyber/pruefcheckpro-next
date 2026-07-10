import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyActivity } from "@/types/company";

interface CompanyActivityFeedProps {
  activities: CompanyActivity[];
  onViewAll?: () => void;
}

export function CompanyActivityFeed({ activities, onViewAll }: CompanyActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Letzte Aktivitäten</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <Avatar size="sm" className="mt-0.5 shrink-0">
              <AvatarFallback>{activity.actorInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm text-foreground">{activity.message}</p>
              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={onViewAll}
          className="flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Alle Aktivitäten anzeigen
        </button>
      </CardContent>
    </Card>
  );
}
