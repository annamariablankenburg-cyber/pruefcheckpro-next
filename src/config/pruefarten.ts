import type { PruefartDefinition, PruefartKey, PruefartRow } from "@/types/testValue";
import type { SampleField } from "@/types/sample";

// Mock-Katalog der Prüfarten für den Prüfwert-Workspace (/pruefungen).
// Datengetrieben, damit Messwert-Tabellen/Formeln/Normhinweise nicht pro
// Prüfung hart im Workspace dupliziert werden müssen.

export const pruefartDefinitions: Record<PruefartKey, PruefartDefinition> = {
  druckfestigkeit: {
    key: "druckfestigkeit",
    name: "Druckfestigkeit",
    fachbereich: "Beton",
    rowLabel: "Würfel",
    fields: [
      { key: "laenge", label: "Länge", unit: "mm", kind: "input" },
      { key: "breite", label: "Breite", unit: "mm", kind: "input" },
      { key: "hoehe", label: "Höhe", unit: "mm", kind: "input" },
      { key: "masse", label: "Masse", unit: "kg", kind: "input" },
      { key: "bruchlast", label: "Bruchlast", unit: "kN", kind: "input" },
      { key: "druckfestigkeit", label: "Druckfestigkeit", unit: "N/mm²", kind: "calculated" },
      { key: "status", label: "Status", kind: "status" },
    ],
    formeln: [
      { label: "Druckfestigkeit", formel: "fc = F / A", hinweis: "F = Bruchlast (N), A = Belastungsfläche (mm²)" },
      { label: "Belastungsfläche", formel: "A = L × B", hinweis: "L = Länge (mm), B = Breite (mm)" },
    ],
    norm: "DIN EN 12390-3",
    normHinweis: "Prüfung der Druckfestigkeit von Beton-Probekörpern.",
    sollwertLabel: "Betonfestigkeitsklasse",
    sollwert: "C25/30 · Sollwert 25,0 N/mm²",
    anforderungswert: "21,3 N/mm² (85 % von f_ck)",
    mittelwert: "23,2 N/mm²",
    standardabweichung: "0,15 N/mm²",
    bewertung: "Bestanden",
    bewertungsHinweis: "Anforderung erfüllt (f_ck ≥ 21,3 N/mm²)",
  },
  biegezug: {
    key: "biegezug",
    name: "Biegezug",
    fachbereich: "Beton",
    rowLabel: "Prisma",
    fields: [
      { key: "laenge", label: "Länge", unit: "mm", kind: "input" },
      { key: "breite", label: "Breite", unit: "mm", kind: "input" },
      { key: "hoehe", label: "Höhe", unit: "mm", kind: "input" },
      { key: "bruchlast", label: "Bruchlast", unit: "kN", kind: "input" },
      { key: "biegezugfestigkeit", label: "Biegezugfestigkeit", unit: "N/mm²", kind: "calculated" },
      { key: "status", label: "Status", kind: "status" },
    ],
    formeln: [
      {
        label: "Biegezugfestigkeit",
        formel: "fcf = (3 × F × L) / (2 × b × d²)",
        hinweis: "F = Bruchlast (N), L = Stützweite (mm), b/d = Breite/Höhe (mm)",
      },
    ],
    norm: "DIN EN 12390-5",
    normHinweis: "Prüfung der Biegezugfestigkeit von Beton-Probekörpern.",
    sollwertLabel: "Betonfestigkeitsklasse",
    sollwert: "C25/30 · Sollwert 4,0 N/mm²",
    anforderungswert: "3,4 N/mm² (85 % von f_ck,fl)",
    mittelwert: "4,2 N/mm²",
    standardabweichung: "0,12 N/mm²",
    bewertung: "Bestanden",
    bewertungsHinweis: "Anforderung erfüllt (f_ck,fl ≥ 3,4 N/mm²)",
  },
  rohdichte: {
    key: "rohdichte",
    name: "Rohdichte",
    fachbereich: "Beton",
    rowLabel: "Probe",
    fields: [
      { key: "masse", label: "Masse", unit: "kg", kind: "input" },
      { key: "volumen", label: "Volumen", unit: "dm³", kind: "input" },
      { key: "rohdichte", label: "Rohdichte", unit: "kg/m³", kind: "calculated" },
      { key: "status", label: "Status", kind: "status" },
    ],
    formeln: [{ label: "Rohdichte", formel: "ρ = m / V", hinweis: "m = Masse (kg), V = Volumen (m³)" }],
    norm: "DIN EN 1097-6",
    normHinweis: "Rohdichte und Wasseraufnahme von Gesteinskörnungen bzw. Betonproben.",
    sollwertLabel: "Referenzbereich",
    sollwert: "2.200 – 2.500 kg/m³",
    anforderungswert: "≥ 2.200 kg/m³",
    mittelwert: "2.398 kg/m³",
    standardabweichung: "9 kg/m³",
    bewertung: "Bestanden",
    bewertungsHinweis: "Rohdichte innerhalb des Referenzbereichs.",
  },
  wassergehalt: {
    key: "wassergehalt",
    name: "Wassergehalt",
    fachbereich: "Geotechnik",
    rowLabel: "Probe",
    fields: [
      { key: "feuchtmasse", label: "Feuchtmasse", unit: "g", kind: "input" },
      { key: "trockenmasse", label: "Trockenmasse", unit: "g", kind: "input" },
      { key: "tara", label: "Tara", unit: "g", kind: "input" },
      { key: "wassergehalt", label: "Wassergehalt", unit: "%", kind: "calculated" },
      { key: "status", label: "Status", kind: "status" },
    ],
    formeln: [
      {
        label: "Wassergehalt",
        formel: "w = (mFeucht − mTrocken) / (mTrocken − mTara) × 100",
        hinweis: "Massen jeweils inkl. Taragefäß (g)",
      },
    ],
    norm: "DIN EN ISO 17892-1",
    normHinweis: "Bestimmung des Wassergehalts in geotechnischen Laborversuchen.",
    sollwertLabel: "Referenzbereich",
    sollwert: "8 – 14 %",
    anforderungswert: "Optimum ca. 11 %",
    mittelwert: "11,4 %",
    standardabweichung: "0,4 %",
    bewertung: "Bestanden",
    bewertungsHinweis: "Wassergehalt im erwarteten Bereich.",
  },
  "proctor-versuch": {
    key: "proctor-versuch",
    name: "Proctorversuch",
    fachbereich: "Geotechnik",
    rowLabel: "Messpunkt",
    fields: [
      { key: "wassergehalt", label: "Wassergehalt", unit: "%", kind: "input" },
      { key: "feuchtdichte", label: "Feuchtdichte", unit: "g/cm³", kind: "input" },
      { key: "trockendichte", label: "Trockendichte", unit: "g/cm³", kind: "calculated" },
      { key: "verdichtungsgrad", label: "Verdichtungsgrad", unit: "%", kind: "calculated" },
      { key: "status", label: "Status", kind: "status" },
    ],
    formeln: [
      { label: "Trockendichte", formel: "ρd = ρ / (1 + w/100)", hinweis: "ρ = Feuchtdichte, w = Wassergehalt (%)" },
      { label: "Verdichtungsgrad", formel: "DPr = ρd / ρPr,max × 100", hinweis: "ρPr,max = Proctordichte des Referenzversuchs" },
    ],
    norm: "DIN 18127",
    normHinweis: "Proctorversuch zur Bestimmung von Verdichtungswilligkeit und optimalem Wassergehalt.",
    sollwertLabel: "Verdichtungsanforderung",
    sollwert: "DPr ≥ 100 %",
    anforderungswert: "≥ 100 % der Proctordichte",
    mittelwert: "98,6 %",
    standardabweichung: "1,1 %",
    bewertung: "Prüfen",
    bewertungsHinweis: "Verdichtungsgrad knapp unter Anforderung – Nachverdichtung prüfen.",
  },
  marshall: {
    key: "marshall",
    name: "Marshall",
    fachbereich: "Asphalt",
    rowLabel: "Probekörper",
    fields: [
      { key: "stabilitaet", label: "Stabilität", unit: "kN", kind: "input" },
      { key: "fliesswert", label: "Fließwert", unit: "mm", kind: "input" },
      { key: "raumdichte", label: "Raumdichte", unit: "g/cm³", kind: "input" },
      { key: "hohlraumgehalt", label: "Hohlraumgehalt", unit: "%", kind: "calculated" },
      { key: "status", label: "Status", kind: "status" },
    ],
    formeln: [
      {
        label: "Hohlraumgehalt",
        formel: "Vm = (ρmax − ρb) / ρmax × 100",
        hinweis: "ρmax = Rohdichte, ρb = Raumdichte des Probekörpers",
      },
    ],
    norm: "DIN EN 12697-34",
    normHinweis: "Marshall-Prüfung an Asphalt-Probekörpern (Stabilität, Fließwert).",
    sollwertLabel: "Anforderung",
    sollwert: "Hohlraumgehalt 2 – 4 %",
    anforderungswert: "2,0 – 4,0 %",
    mittelwert: "3,1 %",
    standardabweichung: "0,3 %",
    bewertung: "Bestanden",
    bewertungsHinweis: "Hohlraumgehalt im Zielbereich.",
  },
  sieblinie: {
    key: "sieblinie",
    name: "Sieblinie",
    fachbereich: "Asphalt",
    rowLabel: "Sieb",
    fields: [
      { key: "rueckstandG", label: "Rückstand", unit: "g", kind: "input" },
      { key: "rueckstandProzent", label: "Rückstand", unit: "%", kind: "calculated" },
      { key: "durchgang", label: "Durchgang", unit: "%", kind: "calculated" },
      { key: "status", label: "Status", kind: "status" },
    ],
    formeln: [
      { label: "Rückstand", formel: "R (%) = mRückstand / mGesamt × 100", hinweis: "Bezogen auf die Gesamt-Einwaage" },
      { label: "Durchgang", formel: "D (%) = 100 − ΣR (%)", hinweis: "Kumulierter Rückstand aller gröberen Siebe" },
    ],
    norm: "DIN EN 12697-2",
    normHinweis: "Bestimmung der Korngrößenverteilung von Asphaltmischgut.",
    sollwertLabel: "Sollsieblinie",
    sollwert: "AC 11 DS – Sieblinienband",
    anforderungswert: "Innerhalb Sieblinienband",
    mittelwert: "—",
    standardabweichung: "—",
    bewertung: "Bestanden",
    bewertungsHinweis: "Sieblinie liegt innerhalb des zulässigen Bandes.",
  },
};

export const pruefartRows: Record<PruefartKey, PruefartRow[]> = {
  druckfestigkeit: [
    { id: "w1", label: "Würfel 1", status: "OK", values: { laenge: "150,0", breite: "150,0", hoehe: "150,0", masse: "8,12", bruchlast: "523,4", druckfestigkeit: "23,2" } },
    { id: "w2", label: "Würfel 2", status: "OK", values: { laenge: "150,0", breite: "150,0", hoehe: "150,0", masse: "8,08", bruchlast: "518,7", druckfestigkeit: "23,0" } },
    { id: "w3", label: "Würfel 3", status: "OK", values: { laenge: "150,0", breite: "150,0", hoehe: "150,0", masse: "8,15", bruchlast: "525,1", druckfestigkeit: "23,3" } },
    { id: "w4", label: "Würfel 4", status: "Offen", values: { laenge: "150,0", breite: "150,0", hoehe: "150,0", masse: "–", bruchlast: "–", druckfestigkeit: "–" } },
  ],
  biegezug: [
    { id: "p1", label: "Prisma 1", status: "OK", values: { laenge: "400,0", breite: "100,0", hoehe: "100,0", bruchlast: "28,4", biegezugfestigkeit: "4,3" } },
    { id: "p2", label: "Prisma 2", status: "OK", values: { laenge: "400,0", breite: "100,0", hoehe: "100,0", bruchlast: "27,1", biegezugfestigkeit: "4,1" } },
    { id: "p3", label: "Prisma 3", status: "Offen", values: { laenge: "400,0", breite: "100,0", hoehe: "100,0", bruchlast: "–", biegezugfestigkeit: "–" } },
  ],
  rohdichte: [
    { id: "r1", label: "Probe 1", status: "OK", values: { masse: "2,158", volumen: "0,900", rohdichte: "2398" } },
    { id: "r2", label: "Probe 2", status: "OK", values: { masse: "2,161", volumen: "0,900", rohdichte: "2401" } },
  ],
  wassergehalt: [
    { id: "wg1", label: "Probe 1", status: "OK", values: { feuchtmasse: "142,6", trockenmasse: "128,1", tara: "18,4", wassergehalt: "13,2" } },
    { id: "wg2", label: "Probe 2", status: "OK", values: { feuchtmasse: "138,9", trockenmasse: "125,7", tara: "18,2", wassergehalt: "12,3" } },
  ],
  "proctor-versuch": [
    { id: "pr1", label: "Messpunkt 1", status: "OK", values: { wassergehalt: "9,5", feuchtdichte: "2,08", trockendichte: "1,90", verdichtungsgrad: "97,4" } },
    { id: "pr2", label: "Messpunkt 2", status: "OK", values: { wassergehalt: "11,0", feuchtdichte: "2,17", trockendichte: "1,95", verdichtungsgrad: "99,9" } },
    { id: "pr3", label: "Messpunkt 3", status: "Offen", values: { wassergehalt: "–", feuchtdichte: "–", trockendichte: "–", verdichtungsgrad: "–" } },
  ],
  marshall: [
    { id: "m1", label: "Probekörper 1", status: "OK", values: { stabilitaet: "12,4", fliesswert: "3,1", raumdichte: "2,42", hohlraumgehalt: "3,0" } },
    { id: "m2", label: "Probekörper 2", status: "OK", values: { stabilitaet: "12,1", fliesswert: "3,3", raumdichte: "2,41", hohlraumgehalt: "3,2" } },
  ],
  sieblinie: [
    { id: "s1", label: "16 mm", status: "OK", values: { rueckstandG: "0", rueckstandProzent: "0,0", durchgang: "100,0" } },
    { id: "s2", label: "8 mm", status: "OK", values: { rueckstandG: "212", rueckstandProzent: "10,6", durchgang: "89,4" } },
    { id: "s3", label: "2 mm", status: "OK", values: { rueckstandG: "684", rueckstandProzent: "34,2", durchgang: "55,2" } },
    { id: "s4", label: "0,063 mm", status: "Offen", values: { rueckstandG: "–", rueckstandProzent: "–", durchgang: "–" } },
  ],
};

// Zusätzliche, noch nicht datengetrieben hinterlegte Prüfarten je Fachbereich –
// werden in der Prüfungsnavigation nur als "bald verfügbar" angezeigt.
export const inertPruefartenByFachbereich: Record<SampleField, string[]> = {
  Beton: ["Wasseraufnahme", "Spaltzugfestigkeit", "Elastizitätsmodul", "Frost-Tausalz-Widerstand"],
  Asphalt: ["Raumdichte (Bohrkern)", "Spurbildung"],
  Geotechnik: ["Korngrößenverteilung", "Scherfestigkeit"],
};

export function pruefartenForFachbereich(fachbereich: SampleField): PruefartKey[] {
  return (Object.values(pruefartDefinitions) as PruefartDefinition[])
    .filter((def) => def.fachbereich === fachbereich)
    .map((def) => def.key);
}

const nameToPruefart: Record<string, PruefartKey> = {
  druckfestigkeit: "druckfestigkeit",
  biegezug: "biegezug",
  rohdichte: "rohdichte",
  dichte: "rohdichte",
  wassergehalt: "wassergehalt",
  proctor: "proctor-versuch",
  marshall: "marshall",
  sieblinie: "sieblinie",
};

export function mapPruefungNameToPruefart(name: string, fachbereich: SampleField): PruefartKey {
  const key = Object.keys(nameToPruefart).find((needle) => name.toLowerCase().includes(needle));
  if (key) return nameToPruefart[key];
  return pruefartenForFachbereich(fachbereich)[0] ?? "druckfestigkeit";
}
