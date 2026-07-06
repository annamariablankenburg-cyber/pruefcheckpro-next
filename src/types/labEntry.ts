export type LabField = "Beton" | "Asphalt" | "Geotechnik";

export type LabEntryStatus = "Entwurf" | "Abgeschlossen" | "Archiviert";

export interface LabEntry {
  id: string;
  datum: string;
  sampleId: string;
  bezeichnung: string;
  projekt: string;
  kunde: string;
  fachbereich: LabField;
  pruefung: string;
  pruefer: string;
  status: LabEntryStatus;
  documentsCount: number;
}
