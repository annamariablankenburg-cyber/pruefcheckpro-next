import { customers } from "@/config/customers";
import { samples } from "@/config/samples";
import type { Project } from "@/types/project";

// Mock-Daten für die Projektverwaltung (/projekte). Eigenständiger Datensatz,
// keine Firebase-Anbindung. `customer`/`customerId` referenzieren echte
// Datensätze aus config/customers.ts. `sampleCount`/`testCount` werden aus
// den tatsächlich verknüpften Proben (config/samples.ts, via `projectId`)
// abgeleitet statt unabhängig gepflegt zu werden.

type ProjectSeed = Omit<Project, "sampleCount" | "testCount">;

const projectSeeds: ProjectSeed[] = [
  {
    id: "proj-parkblick",
    name: "Neubau Wohnanlage Parkblick",
    number: "P-2026-0457",
    customer: "Musterbau GmbH",
    customerId: "cust-musterbau",
    address: "Parkstraße 15, Stuttgart",
    field: "Beton",
    status: "Aktiv",
    startDate: "15.01.2026",
    dueDate: "30.11.2026",
    progress: 45,
    projectLead: "Anna Neumann",
    projectLeadInitials: "AN",
    contactPerson: "Herr Krause",
    phone: "+49 711 998877",
    email: "krause@musterbau.de",
    orderNumber: "AB-2026-0091",
    documentsCount: 9,
    deliveryNotes: [
      { id: "ls-001", title: "LS-2026-001 Betonlieferung", date: "20.01.2026" },
      { id: "ls-002", title: "LS-2026-002 Zusatzmittel", date: "28.01.2026" },
      { id: "ls-003", title: "LS-2026-003 Asphaltmischgut", date: "05.02.2026" },
    ],
    history: [
      { message: "Projekt angelegt.", timestamp: "15.01.2026" },
      { message: "Erste Betonproben entnommen.", timestamp: "20.01.2026" },
      { message: "Lieferschein LS-2026-001 hinzugefügt.", timestamp: "20.01.2026" },
    ],
  },
  {
    id: "proj-b17",
    name: "Brückensanierung B17",
    number: "P-2026-0412",
    customer: "Baresel AG",
    customerId: "cust-baresel",
    address: "B17 Remseck",
    field: "Mehrere",
    status: "Aktiv",
    startDate: "01.02.2026",
    dueDate: "31.08.2026",
    progress: 60,
    projectLead: "Tom Müller",
    projectLeadInitials: "TM",
    contactPerson: "Frau Bergmann",
    phone: "+49 7146 55210",
    email: "bergmann@baresel.de",
    orderNumber: "AB-2026-0074",
    documentsCount: 6,
    deliveryNotes: [{ id: "ls-004", title: "LS-2026-004 Asphaltmischgut", date: "10.02.2026" }],
    history: [
      { message: "Projekt angelegt.", timestamp: "01.02.2026" },
      { message: "Prüfplan für Beton und Asphalt abgestimmt.", timestamp: "03.02.2026" },
    ],
  },
  {
    id: "proj-l342",
    name: "L 342 Fahrbahnerneuerung",
    number: "P-2026-0388",
    customer: "Straßenbau Nord",
    customerId: "cust-strassenbau-nord",
    address: "L342",
    field: "Asphalt",
    status: "Aktiv",
    startDate: "10.02.2026",
    dueDate: "15.06.2026",
    progress: 35,
    projectLead: "S. Wolf",
    projectLeadInitials: "SW",
    contactPerson: "Herr Ostermann",
    phone: "+49 5121 44120",
    email: "ostermann@strassenbau-nord.de",
    documentsCount: 4,
    deliveryNotes: [{ id: "ls-005", title: "LS-2026-005 Asphaltmischgut", date: "14.02.2026" }],
    history: [{ message: "Projekt angelegt.", timestamp: "10.02.2026" }],
  },
  {
    id: "proj-baugebiet-nord",
    name: "Baugebiet Nord",
    number: "P-2026-0321",
    customer: "Musterbau GmbH",
    customerId: "cust-musterbau",
    address: "Stuttgart Nord",
    field: "Geotechnik",
    status: "Aktiv",
    overdue: true,
    startDate: "05.01.2026",
    dueDate: "28.02.2026",
    progress: 70,
    projectLead: "A. Meier",
    projectLeadInitials: "AM",
    contactPerson: "Herr Krause",
    phone: "+49 711 998877",
    email: "krause@musterbau.de",
    documentsCount: 5,
    deliveryNotes: [],
    history: [
      { message: "Projekt angelegt.", timestamp: "05.01.2026" },
      { message: "Fälligkeitsdatum überschritten.", timestamp: "28.02.2026" },
    ],
  },
  {
    id: "proj-gewerbepark-ost",
    name: "Gewerbepark Ost",
    number: "P-2025-0290",
    customer: "Industriebau Süd GmbH",
    customerId: "cust-industriebau-sued",
    address: "Gewerbepark Ost",
    field: "Beton",
    status: "Abgeschlossen",
    startDate: "01.06.2025",
    dueDate: "20.12.2025",
    progress: 100,
    projectLead: "T. Keller",
    projectLeadInitials: "TK",
    contactPerson: "Frau Lindner",
    phone: "+49 731 22110",
    email: "lindner@industriebau-sued.de",
    documentsCount: 14,
    deliveryNotes: [{ id: "ls-006", title: "LS-2025-118 Betonlieferung", date: "15.11.2025" }],
    history: [
      { message: "Projekt angelegt.", timestamp: "01.06.2025" },
      { message: "Alle Prüfungen abgeschlossen.", timestamp: "18.12.2025" },
      { message: "Projekt als abgeschlossen markiert.", timestamp: "20.12.2025" },
    ],
  },
];

// customerId zur Laufzeit gegen config/customers.ts validieren, statt sich
// blind auf die Literale in projectSeeds zu verlassen.
projectSeeds.forEach((seed) => {
  const customerExists = customers.some((customer) => customer.id === seed.customerId);
  if (!customerExists && process.env.NODE_ENV !== "production") {
    console.warn(`[projects.ts] Unbekannte customerId "${seed.customerId}" bei Projekt "${seed.name}".`);
  }
});

export const projects: Project[] = projectSeeds.map((seed) => {
  const projectSamples = samples.filter((sample) => sample.projectId === seed.id);
  const testCount = projectSamples.reduce((sum, sample) => sum + sample.pruefungen.length, 0);

  return {
    ...seed,
    sampleCount: projectSamples.length,
    testCount,
  };
});
