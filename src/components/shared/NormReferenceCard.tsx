import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import type { NormReference } from "@/types/learning";

interface NormReferenceCardProps {
  norm: NormReference;
}

export function NormReferenceCard({ norm }: NormReferenceCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{norm.code}</CardTitle>
          <CategoryBadge category={norm.category} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{norm.title}</p>
        <p className="text-sm text-muted-foreground">{norm.summary}</p>
      </CardContent>
    </Card>
  );
}
