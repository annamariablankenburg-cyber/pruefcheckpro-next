import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { TestEntryActionsMenu } from "@/components/shared/TestEntryActionsMenu";
import { TestEntryStatusBadge } from "@/components/shared/TestEntryStatusBadge";
import { TestValueCard } from "@/components/shared/TestValueCard";
import type { TestEntry } from "@/types/testValue";

interface TestEntryTableActionHandlers {
  onOpen: (entry: TestEntry) => void;
  onStart: (entry: TestEntry) => void;
  onComplete: (entry: TestEntry) => void;
  onReopen: (entry: TestEntry) => void;
  onCreateReport: (entry: TestEntry) => void;
  onExportExcel: (entry: TestEntry) => void;
}

interface TestEntryTableProps extends TestEntryTableActionHandlers {
  entries: TestEntry[];
  onResetFilters?: () => void;
}

const columns = [
  "Probe",
  "Projekt",
  "Kunde",
  "Fachbereich",
  "Prüfung",
  "Prüfdatum",
  "Status",
  "Prüfer",
  "Ergebnis",
  "",
];

export function TestEntryTable({ entries, onResetFilters, ...handlers }: TestEntryTableProps) {
  if (entries.length === 0) {
    return (
      <EmptyState message="Keine Prüfungen gefunden. Passe Suche oder Filter an." onReset={onResetFilters} />
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.sampleId}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handlers.onOpen(entry)}
                      className="font-medium text-foreground hover:underline"
                    >
                      {entry.sampleId}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.projekt}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.kunde}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.fachbereich}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">{entry.titel}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.pruefdatum}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <TestEntryStatusBadge status={entry.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.pruefer}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{entry.ergebnis}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <TestEntryActionsMenu
                      entry={entry}
                      onOpenWorkspace={() => handlers.onOpen(entry)}
                      onStart={() => handlers.onStart(entry)}
                      onComplete={() => handlers.onComplete(entry)}
                      onReopen={() => handlers.onReopen(entry)}
                      onCreateReport={() => handlers.onCreateReport(entry)}
                      onExportExcel={() => handlers.onExportExcel(entry)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="grid gap-4 sm:grid-cols-2 md:hidden">
        {entries.map((entry) => (
          <TestValueCard
            key={entry.sampleId}
            entry={entry}
            onOpen={handlers.onOpen}
            onStart={handlers.onStart}
            onComplete={handlers.onComplete}
            onReopen={handlers.onReopen}
            onCreateReport={handlers.onCreateReport}
            onExportExcel={handlers.onExportExcel}
          />
        ))}
      </div>
    </>
  );
}
