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

import { customers } from "@/config/customers";
import { devices } from "@/config/devices";
import { projects } from "@/config/projects";
import { samples } from "@/config/samples";
import type { DeviceStatus, DeviceType } from "@/types/device";
import type { Sample, SampleField, SampleStatus } from "@/types/sample";
import type {
  ActiveSite,
  SiteDevice,
  SiteDeviceStatus,
  SiteQuickActionItem,
  SiteSample,
  SiteSampleStatus,
} from "@/types/siteMode";

// Mock-Daten für den Baustellenmodus (/baustellenmodus). Werden aus den
// echten Datensätzen abgeleitet (config/projects.ts, config/samples.ts,
// config/customers.ts, config/devices.ts) statt unabhängig gepflegt, damit
// Baustellenmodus, Probenmanager, Kunden und Geräte konsistent bleiben.

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

const ACTIVE_PROJECT_ID = "proj-parkblick";
const activeProject = projects.find((project) => project.id === ACTIVE_PROJECT_ID);
const activeCustomer = customers.find((customer) => customer.id === activeProject?.customerId);

export const activeSite: ActiveSite = {
  projekt: activeProject?.name ?? "—",
  kunde: activeProject?.customer ?? "—",
  standort: activeProject?.address ?? "—",
  ansprechpartner: activeProject?.contactPerson ?? activeCustomer?.contactPerson ?? "—",
  telefon: activeProject?.phone ?? activeCustomer?.phone ?? "—",
  wetter: "18 °C · Sonnig (Platzhalter)",
  gps: "48,7758° N, 9,1829° E (Platzhalter)",
};

function toSiteSampleStatus(status: SampleStatus): SiteSampleStatus {
  if (status === "Vorbereitung") return "Offen";
  if (status === "Archiviert") return "Abgeschlossen";
  return status;
}

// Gerätetypen, die für eine Prüfung im jeweiligen Fachbereich typischerweise
// benötigt werden – reine UI-Heuristik zur Vorauswahl, keine feste Regel.
const deviceTypesByField: Record<SampleField, DeviceType[]> = {
  Beton: ["Druckpresse", "Waage", "Klimaschrank"],
  Asphalt: ["Siebanlage", "Waage"],
  Geotechnik: ["Trockenschrank", "Waage"],
};

const availableDeviceStatuses: DeviceStatus[] = ["Einsatzbereit", "Kalibrierung fällig", "Wartung fällig"];

function devicesForSample(sample: Sample): string[] {
  const wantedTypes = deviceTypesByField[sample.fachbereich];
  return devices
    .filter((device) => wantedTypes.includes(device.type) && availableDeviceStatuses.includes(device.status))
    .slice(0, 1)
    .map((device) => `${device.name} (${device.inventoryNumber})`);
}

// Auswahl echter, nicht archivierter Proben aus config/samples.ts für die
// Baustellenmodus-Übersicht.
const siteSampleIds = ["BET-2026-014", "ASP-2026-011", "GEO-2026-021", "BET-2026-022"];

export const siteSamples: SiteSample[] = siteSampleIds
  .map((id) => samples.find((sample) => sample.id === id))
  .filter((sample): sample is Sample => sample !== undefined)
  .map((sample) => {
    const customer = customers.find((entry) => entry.id === sample.customerId);
    return {
      id: sample.id,
      bezeichnung: sample.bezeichnung,
      status: toSiteSampleStatus(sample.status),
      pruefalter: sample.pruefalter,
      projekt: sample.projekt,
      kunde: sample.kunde,
      ansprechpartner: customer?.contactPerson ?? "—",
      gps:
        sample.projectId === ACTIVE_PROJECT_ID
          ? activeSite.gps
          : "GPS wird bei Standortwechsel aktualisiert (Platzhalter)",
      pruefungen: sample.pruefungen.map((pruefung) => ({
        id: pruefung.id,
        name: pruefung.name,
        status: pruefung.status,
      })),
      fotos: sample.anhaenge,
      anhaenge: sample.dokumente,
      geraete: devicesForSample(sample),
      notizen: sample.historie[sample.historie.length - 1]?.message ?? "",
    };
  });

const siteDeviceStatuses: DeviceStatus[] = ["Einsatzbereit", "Kalibrierung fällig", "Wartung fällig"];

export const siteDevices: SiteDevice[] = devices
  .filter((device) => siteDeviceStatuses.includes(device.status))
  .map((device) => ({
    id: device.id,
    name: device.name,
    inventoryNumber: device.inventoryNumber,
    status: device.status as SiteDeviceStatus,
    kalibrierung:
      device.status === "Kalibrierung fällig"
        ? `Kalibrierung fällig seit: ${device.nextCalibration ?? "—"}`
        : `Nächste Kalibrierung: ${device.nextCalibration ?? "—"}`,
  }));
