import type { LucideIcon } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  // Optionale laufende Nummer (z. B. "01") als technischer Akzent.
  index?: string;
}

export function FeatureCard({ icon: Icon, title, description, index }: FeatureCardProps) {
  return (
    <Card interactive variant="elevated" className="group h-full gap-0 py-0">
      <CardHeader className="gap-0 px-6 py-6">
        <div className="flex items-start justify-between">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-[background-color,color,transform] duration-200 ease-(--ease-out-soft) group-hover:bg-primary group-hover:text-primary-foreground motion-safe:group-hover:-rotate-3">
            <Icon className="size-5" />
          </div>
          {index && (
            <span className="font-mono text-xs tracking-wider text-muted-foreground/70 tabular-nums">
              {index}
            </span>
          )}
        </div>
        <CardTitle className="mt-5 text-lg">{title}</CardTitle>
        <CardDescription className="mt-1.5 leading-relaxed">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
