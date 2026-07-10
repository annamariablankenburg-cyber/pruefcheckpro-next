import { companyRepository } from "@/lib/repositories/companyRepository";
import { customerRepository } from "@/lib/repositories/customerRepository";
import type { Report } from "@/types/report";

// Baut die Vorbelegung für den E-Mail-Versand-Dialog aus bereits vorhandenen
// Kunden-/Firmendaten (kein doppeltes Hartcodieren von Empfänger-Adressen).
export interface EmailAttachmentOption {
  id: string;
  label: string;
  fileType: string;
  sizeLabel: string;
  selected: boolean;
}

export function buildDefaultRecipients(report: Report): string[] {
  const customer = report.customerId ? customerRepository.getById(report.customerId) : undefined;
  return customer?.email ? [customer.email] : [];
}

export function buildDefaultSubject(report: Report): string {
  return report.probeId
    ? `Prüfbericht ${report.probeId} – ${report.projekt}`
    : `Prüfbericht ${report.berichtsnummer} – ${report.projekt}`;
}

export function buildDefaultMessage(report: Report): string {
  const customer = report.customerId ? customerRepository.getById(report.customerId) : undefined;
  const company = companyRepository.getProfile();
  const contact = report.ansprechpartner || customer?.contactPerson || report.kunde;
  const probeText = report.probeId ? ` zur Probe ${report.probeId}` : "";

  return [
    `Guten Tag ${contact},`,
    "",
    `anbei erhalten Sie den Prüfbericht${probeText} für das Projekt ${report.projekt}.`,
    "",
    "Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.",
    "",
    "Mit freundlichen Grüßen",
    company.name,
  ].join("\n");
}

export function buildAttachmentOptions(report: Report): EmailAttachmentOption[] {
  const options: EmailAttachmentOption[] = [
    {
      id: "pdf",
      label: `${report.berichtsnummer}.pdf`,
      fileType: "PDF",
      sizeLabel: "1,2 MB",
      selected: true,
    },
  ];

  if (report.format !== "PDF") {
    options.push({
      id: "excel",
      label: `${report.berichtsnummer}.xlsx`,
      fileType: "Excel",
      sizeLabel: "480 KB",
      selected: false,
    });
  }

  report.fotos.forEach((foto) => {
    options.push({
      id: `foto-${foto.id}`,
      label: foto.title,
      fileType: "Foto",
      sizeLabel: "2,1 MB",
      selected: false,
    });
  });

  report.dokumente.forEach((doc) => {
    options.push({
      id: `doc-${doc.id}`,
      label: doc.title,
      fileType: "Dokument",
      sizeLabel: "540 KB",
      selected: false,
    });
  });

  report.lieferscheine.forEach((ls) => {
    options.push({
      id: `ls-${ls.id}`,
      label: ls.title,
      fileType: "Lieferschein",
      sizeLabel: "310 KB",
      selected: false,
    });
  });

  return options;
}
