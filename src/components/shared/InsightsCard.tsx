import { Lightbulb, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InsightsCardProps {
  insights: string[];
}

export function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lightbulb className="size-4.5" />
          </div>
          <CardTitle className="text-sm">Automatische Hinweise</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {insight}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
