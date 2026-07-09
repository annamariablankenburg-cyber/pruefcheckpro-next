import { EmptyState } from "@/components/shared/EmptyState";
import { LaborbookStatusBadge } from "@/components/shared/LaborbookStatusBadge";
import { laborbookTypeIcons } from "@/components/shared/LaborbookTypeBadge";
import { cn } from "@/lib/utils";
import type { LaborbookEntry } from "@/types/laborbook";

interface LaborbookTimelineProps {
  entries: LaborbookEntry[];
  onViewDetails: (entry: LaborbookEntry) => void;
  onResetFilters?: () => void;
}

interface DateGroup {
  datum: string;
  entries: LaborbookEntry[];
}

function groupByDatum(entries: LaborbookEntry[]): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const entry of entries) {
    const group = groups.find((g) => g.datum === entry.datum);
    if (group) {
      group.entries.push(entry);
    } else {
      groups.push({ datum: entry.datum, entries: [entry] });
    }
  }
  return groups;
}

export function LaborbookTimeline({ entries, onViewDetails, onResetFilters }: LaborbookTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState message="Keine Einträge gefunden. Passe Suche oder Filter an." onReset={onResetFilters} />
    );
  }

  const groups = groupByDatum(entries);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group.datum} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {group.datum}
          </h3>
          <div className="flex flex-col gap-1 border-l border-border pl-5">
            {group.entries.map((entry) => {
              const Icon = laborbookTypeIcons[entry.typ];
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onViewDetails(entry)}
                  className="group relative flex items-start gap-3 rounded-lg py-2.5 pr-3 text-left transition-colors hover:bg-muted/40"
                >
                  <span
                    className={cn(
                      "absolute top-3.5 -left-[27px] flex size-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground",
                      "group-hover:border-primary/40 group-hover:text-primary"
                    )}
                  >
                    <Icon className="size-3" />
                  </span>
                  <span className="w-14 shrink-0 pt-0.5 text-xs text-muted-foreground">
                    {entry.uhrzeit}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{entry.titel}</span>
                      <LaborbookStatusBadge status={entry.status} className="hidden sm:inline-flex" />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {entry.beschreibung}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
