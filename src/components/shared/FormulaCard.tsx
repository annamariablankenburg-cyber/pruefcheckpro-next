import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import type { Formula } from "@/types/learning";

interface FormulaCardProps {
  formula: Formula;
}

export function FormulaCard({ formula }: FormulaCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{formula.name}</CardTitle>
          <CategoryBadge category={formula.category} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted px-3 py-2.5 font-mono text-sm text-foreground">
          {formula.formula}
          <span className="ml-2 text-xs text-muted-foreground">[{formula.unit}]</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {formula.variables.map((variable) => (
            <div key={variable.symbol} className="flex gap-2 text-sm">
              <span className="font-mono font-semibold text-foreground">{variable.symbol}</span>
              <span className="text-muted-foreground">{variable.description}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Beispiel: </span>
          {formula.example}
        </div>
      </CardContent>
    </Card>
  );
}
