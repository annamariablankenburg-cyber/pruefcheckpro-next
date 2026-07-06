export type SampleField = "Beton" | "Asphalt" | "Geotechnik";

export type SampleStatus =
  | "In Prüfung"
  | "Vorbereitung"
  | "Überfällig"
  | "Abgeschlossen"
  | "Archiviert";

export interface Sample {
  id: string;
  bezeichnung: string;
  fachbereich: SampleField;
  pruefverfahren: string;
  kunde: string;
  projekt: string;
  entnahmedatum: string;
  pruefdatum: string;
  pruefalter: string;
  status: SampleStatus;
  pruefer: string;
}
