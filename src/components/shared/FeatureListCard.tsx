import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureListCardProps {
  icon: LucideIcon;
  title: string;
  items: string[];
}

export function FeatureListCard({ icon: Icon, title, items }: FeatureListCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <CardTitle className="mt-4 text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
