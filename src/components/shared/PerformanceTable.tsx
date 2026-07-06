import { Card, CardContent } from "@/components/ui/card";
import type { PerformanceRow } from "@/config/statistics";

interface PerformanceTableProps {
  rows: PerformanceRow[];
}

export function PerformanceTable({ rows }: PerformanceTableProps) {
  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 whitespace-nowrap">Prüfer</th>
                <th className="px-4 py-3 whitespace-nowrap">Anzahl Prüfungen</th>
                <th className="px-4 py-3 whitespace-nowrap">Ø Bearbeitungszeit</th>
                <th className="px-4 py-3 whitespace-nowrap">Offene Prüfungen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.pruefer} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                    {row.pruefer}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{row.anzahl}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {row.bearbeitungszeit}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{row.offen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <Card key={row.pruefer}>
            <CardContent className="flex flex-col gap-3">
              <p className="font-semibold text-foreground">{row.pruefer}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Prüfungen</p>
                  <p className="font-medium text-foreground">{row.anzahl}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ø Zeit</p>
                  <p className="font-medium text-foreground">{row.bearbeitungszeit}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Offen</p>
                  <p className="font-medium text-foreground">{row.offen}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
