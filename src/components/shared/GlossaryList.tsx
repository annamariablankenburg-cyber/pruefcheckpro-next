import { Card, CardContent } from "@/components/ui/card";
import type { GlossaryTerm } from "@/types/learning";

interface GlossaryListProps {
  terms: GlossaryTerm[];
}

export function GlossaryList({ terms }: GlossaryListProps) {
  const groups = new Map<string, GlossaryTerm[]>();
  for (const term of terms) {
    const letter = term.term.charAt(0).toUpperCase();
    const group = groups.get(letter) ?? [];
    group.push(term);
    groups.set(letter, group);
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(groups.entries()).map(([letter, groupTerms]) => (
        <div key={letter} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{letter}</h3>
          <Card>
            <CardContent className="flex flex-col divide-y divide-border">
              {groupTerms.map((term) => (
                <div key={term.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-foreground">{term.term}</p>
                  <p className="text-sm text-muted-foreground">{term.definition}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
