import {
  Barcode,
  Camera,
  Contact,
  Cpu,
  FlaskConical,
  MapPin,
  PlayCircle,
  QrCode,
} from "lucide-react";

import type { ActiveSite, SiteDevice, SiteQuickActionItem, SiteSample } from "@/types/siteMode";

// Mock-Daten für den Baustellenmodus (/baustellenmodus). Eigenständiger
// Datensatz, aber bewusst konsistent mit config/samples.ts, config/devices.ts
// und config/customers.ts gehalten (gleiche Proben-/Geräte-/Kundennamen).

export const siteQuickActions: SiteQuickActionItem[] = [
  { id: "qa-neue-probe", label: "Neue Probe", icon: FlaskConical },
  { id: "qa-pruefung-starten", label: "Prüfung starten", icon: PlayCircle },
  { id: "qa-geraet-waehlen", label: "Gerät auswählen", icon: Cpu },
  { id: "qa-foto", label: "Foto aufnehmen", icon: Camera },
  { id: "qa-qr", label: "QR-Code scannen", icon: QrCode },
  { id: "qa-barcode", label: "Barcode scannen", icon: Barcode },
  { id: "qa-standort", label: "Standort erfassen", icon: MapPin },
  { id: "qa-kunde", label: "Kunden öffnen", icon: Contact },
];

export const activeSite: ActiveSite = {
  projekt: "Neubau Wohnanlage Parkblick",
  kunde: "Musterbau GmbH",
  standort: "Parkstraße 15, 70173 Stuttgart",
  ansprechpartner: "Max Mustermann",
  telefon: "+49 711 998877",
  wetter: "18 °C · Sonnig (Platzhalter)",
  gps: "48,7758° N, 9,1829° E (Platzhalter)",
};

export const siteSamples: SiteSample[] = [
  {
    id: "BET-2026-014",
    bezeichnung: "Beton C25/30",
    status: "In Prüfung",
    pruefalter: "28 Tage",
    projekt: "Neubau Wohnanlage Parkblick",
    kunde: "Musterbau GmbH",
    ansprechpartner: "Max Mustermann",
    gps: "48,7758° N, 9,1829° E (Platzhalter)",
    pruefungen: [
      { id: "pw-1", name: "Druckfestigkeit", status: "In Prüfung" },
      { id: "pw-2", name: "Rohdichte", status: "Abgeschlossen" },
    ],
    fotos: [{ id: "f-1", title: "Foto Probe.jpg", date: "03.03.2026" }],
    anhaenge: [{ id: "a-1", title: "Prüfprotokoll.pdf", date: "03.03.2026" }],
    geraete: ["Druckprüfpresse (DR-001)"],
    notizen: "Würfel bei trockenem Wetter entnommen, keine Auffälligkeiten.",
  },
  {
    id: "ASP-2026-011",
    bezeichnung: "Asphaltbohrkern",
    status: "In Prüfung",
    pruefalter: "7 Tage",
    projekt: "L 342 Fahrbahnerneuerung",
    kunde: "Straßenbau Nord",
    ansprechpartner: "Thomas Weber",
    gps: "48,8987° N, 9,2109° E (Platzhalter)",
    pruefungen: [{ id: "pw-3", name: "Marshall", status: "In Prüfung" }],
    fotos: [{ id: "f-2", title: "Foto Bohrkern.jpg", date: "25.02.2026" }],
    anhaenge: [],
    geraete: ["Siebmaschine (SI-011)"],
    notizen: "Bohrkern aus Bauabschnitt 2 entnommen.",
  },
  {
    id: "GEO-2026-021",
    bezeichnung: "Bodenprobe Sand",
    status: "Überfällig",
    pruefalter: "eigenes Prüfdatum",
    projekt: "Baugebiet Nord",
    kunde: "Musterbau GmbH",
    ansprechpartner: "Max Mustermann",
    gps: "48,7701° N, 9,1620° E (Platzhalter)",
    pruefungen: [{ id: "pw-4", name: "Proctor", status: "Überfällig" }],
    fotos: [],
    anhaenge: [],
    geraete: ["Trockenschrank (TR-005)"],
    notizen: "Prüftermin überschritten – bitte kurzfristig einplanen.",
  },
  {
    id: "BET-2026-022",
    bezeichnung: "Betonwürfel C30/37",
    status: "Offen",
    pruefalter: "28 Tage",
    projekt: "Neubau Wohnanlage Parkblick",
    kunde: "Musterbau GmbH",
    ansprechpartner: "Max Mustermann",
    gps: "48,7758° N, 9,1829° E (Platzhalter)",
    pruefungen: [{ id: "pw-5", name: "Druckfestigkeit", status: "Offen" }],
    fotos: [],
    anhaenge: [],
    geraete: [],
    notizen: "",
  },
];

export const siteDevices: SiteDevice[] = [
  {
    id: "dev-dr-001",
    name: "Druckprüfpresse",
    inventoryNumber: "DR-001",
    status: "Einsatzbereit",
    kalibrierung: "Nächste Kalibrierung: 15.09.2026",
  },
  {
    id: "dev-wa-014",
    name: "Präzisionswaage",
    inventoryNumber: "WA-014",
    status: "Kalibrierung fällig",
    kalibrierung: "Kalibrierung fällig seit: 20.02.2026",
  },
  {
    id: "dev-si-011",
    name: "Siebmaschine",
    inventoryNumber: "SI-011",
    status: "Einsatzbereit",
    kalibrierung: "Nächste Kalibrierung: 12.11.2026",
  },
];
