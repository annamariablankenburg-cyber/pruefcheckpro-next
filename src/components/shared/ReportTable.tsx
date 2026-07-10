import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReportActionsMenu } from "@/components/shared/ReportActionsMenu";
import { ReportFormatBadge } from "@/components/shared/ReportFormatBadge";
import { ReportStatusBadge } from "@/components/shared/ReportStatusBadge";
import type { Report } from "@/types/report";

interface ReportTableActionHandlers {
  onOpenDetails: (report: Report) => void;
  onEdit: (report: Report) => void;
  onPreview: (report: Report) => void;
  onMarkDone: (report: Report) => void;
  onExportPdf: (report: Report) => void;
  onExportExcel: (report: Report) => void;
  onDuplicate: (report: Report) => void;
  onArchive: (report: Report) => void;
  onReactivate: (report: Report) => void;
  onDelete: (report: Report) => void;
  onSendEmail: (report: Report) => void;
}

interface ReportTableProps extends ReportTableActionHandlers {
  reports: Report[];
  onResetFilters?: () => void;
}

const columns = [
  "Bericht",
  "Berichtsnummer",
  "Projekt",
  "Kunde",
  "Probe",
  "Fachbereich",
  "Format",
  "Status",
  "Erstellt am",
  "Bearbeiter",
  "",
];

export function ReportTable({ reports, onResetFilters, ...handlers }: ReportTableProps) {
  if (reports.length === 0) {
    return (
      <EmptyState message="Keine Berichte gefunden. Passe Suche oder Filter an." onReset={onResetFilters} />
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-sm">
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
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handlers.onOpenDetails(report)}
                      className="text-left font-medium text-foreground hover:underline"
                    >
                      {report.titel}
                      <span className="block text-xs font-normal text-muted-foreground">{report.id}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {report.berichtsnummer}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{report.projekt}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{report.kunde}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {report.probeId ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{report.fachbereich}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ReportFormatBadge format={report.format} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ReportStatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{report.erstelltAm}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{report.bearbeiter}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <ReportActionsMenu
                      report={report}
                      onOpenDetails={() => handlers.onOpenDetails(report)}
                      onEdit={() => handlers.onEdit(report)}
                      onPreview={() => handlers.onPreview(report)}
                      onMarkDone={() => handlers.onMarkDone(report)}
                      onExportPdf={() => handlers.onExportPdf(report)}
                      onExportExcel={() => handlers.onExportExcel(report)}
                      onDuplicate={() => handlers.onDuplicate(report)}
                      onArchive={() => handlers.onArchive(report)}
                      onReactivate={() => handlers.onReactivate(report)}
                      onDelete={() => handlers.onDelete(report)}
                      onSendEmail={() => handlers.onSendEmail(report)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="flex flex-col gap-3 md:hidden">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlers.onOpenDetails(report)}
                  className="min-w-0 text-left"
                >
                  <span className="block truncate font-semibold text-foreground">{report.titel}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {report.id} · {report.berichtsnummer}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <ReportStatusBadge status={report.status} />
                  <ReportActionsMenu
                    report={report}
                    onOpenDetails={() => handlers.onOpenDetails(report)}
                    onEdit={() => handlers.onEdit(report)}
                    onPreview={() => handlers.onPreview(report)}
                    onMarkDone={() => handlers.onMarkDone(report)}
                    onExportPdf={() => handlers.onExportPdf(report)}
                    onExportExcel={() => handlers.onExportExcel(report)}
                    onDuplicate={() => handlers.onDuplicate(report)}
                    onArchive={() => handlers.onArchive(report)}
                    onReactivate={() => handlers.onReactivate(report)}
                    onDelete={() => handlers.onDelete(report)}
                    onSendEmail={() => handlers.onSendEmail(report)}
                  />
                </div>
              </div>

              <ReportFormatBadge format={report.format} className="w-fit" />

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Projekt</p>
                  <p className="font-medium text-foreground">{report.projekt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kunde</p>
                  <p className="font-medium text-foreground">{report.kunde}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Probe</p>
                  <p className="font-medium text-foreground">{report.probeId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fachbereich</p>
                  <p className="font-medium text-foreground">{report.fachbereich}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Erstellt</p>
                  <p className="font-medium text-foreground">{report.erstelltAm}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bearbeiter</p>
                  <p className="font-medium text-foreground">{report.bearbeiter}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
