import type { Flashcard, Formula, GlossaryTerm, NormReference } from "@/types/learning";

// Mock-Daten für den Lernbereich (/lernen). Eigenständiger Datensatz,
// keine Firebase-Anbindung, rein lokal.

export const flashcards: Flashcard[] = [
  {
    id: "fc-wz-wert",
    term: "w/z-Wert",
    definition:
      "Verhältnis der Wassermasse zur Zementmasse im Frischbeton. Entscheidend für Festigkeit, Dichtigkeit und Dauerhaftigkeit – je niedriger, desto fester und dichter der Beton.",
    category: "Beton",
    learned: true,
    favorite: true,
  },
  {
    id: "fc-druckfestigkeit",
    term: "Druckfestigkeit",
    definition:
      "Maximale Druckspannung, die ein Probekörper vor dem Bruch aufnehmen kann. Wird als Bruchlast bezogen auf die Querschnittsfläche in N/mm² angegeben.",
    category: "Beton",
    learned: true,
    favorite: false,
  },
  {
    id: "fc-ausbreitmass",
    term: "Ausbreitmaß",
    definition:
      "Kennwert für die Konsistenz von Frischbeton nach DIN EN 12350-5. Ermittelt durch Ausbreiten auf dem Ausbreittisch, angegeben in mm bzw. Konsistenzklasse F1–F6.",
    category: "Beton",
    learned: false,
    favorite: true,
  },
  {
    id: "fc-luftgehalt",
    term: "Luftgehalt",
    definition:
      "Anteil eingeschlossener Luftporen im Frischbeton in Vol.-%. Wichtig für die Frost-Tau-Widerstandsfähigkeit, Messung meist mit dem Luftgehaltsprüfer (Druckausgleichsverfahren).",
    category: "Beton",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-kalkkreislauf",
    term: "Kalkkreislauf",
    definition:
      "Kreislauf von Kalkstein (CaCO₃) über Brennen zu Branntkalk (CaO), Löschen zu Kalkhydrat (Ca(OH)₂) und Erhärten durch Carbonatisierung zurück zu Kalkstein.",
    category: "Beton",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-gips",
    term: "Gips",
    definition:
      "Bindemittel (CaSO₄ · 2H₂O), das dem Zement in geringer Menge als Erstarrungsregler zugesetzt wird, um ein zu schnelles Erstarren zu verhindern.",
    category: "Beton",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-betondeckung",
    term: "Betondeckung",
    definition:
      "Abstand zwischen Bewehrungsstahl und Bauteiloberfläche. Schützt die Bewehrung vor Korrosion und Feuer, Mindestmaß abhängig von der Expositionsklasse.",
    category: "Beton",
    learned: true,
    favorite: false,
  },
  {
    id: "fc-pruefalter",
    term: "Prüfalter",
    definition:
      "Alter des Probekörpers zum Prüfzeitpunkt, meist 7 oder 28 Tage nach Herstellung. Die 28-Tage-Festigkeit gilt als Referenzwert für die Betonfestigkeitsklasse.",
    category: "Beton",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-sieblinie",
    term: "Sieblinie",
    definition:
      "Grafische Darstellung der Korngrößenverteilung eines Gesteinskörnungsgemischs. Ergibt sich aus den Siebdurchgängen verschiedener Siebweiten in Prozent.",
    category: "Asphalt",
    learned: true,
    favorite: false,
  },
  {
    id: "fc-marshall",
    term: "Marshall-Verfahren",
    definition:
      "Prüfverfahren für Asphalt zur Bestimmung von Stabilität und Fließwert an zylindrischen Probekörpern nach genormter Verdichtung mit dem Marshall-Hammer.",
    category: "Asphalt",
    learned: false,
    favorite: true,
  },
  {
    id: "fc-hohlraumgehalt",
    term: "Hohlraumgehalt",
    definition:
      "Anteil der Luftporen im verdichteten Asphalt in Vol.-%. Zu hohe Werte begünstigen Wassereintritt und Alterung, zu niedrige Werte führen zu Verformungen.",
    category: "Asphalt",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-erweichungspunkt",
    term: "Erweichungspunkt Ring und Kugel",
    definition:
      "Temperatur, bei der Bitumen unter definierten Bedingungen so weich wird, dass eine Stahlkugel den Bitumenring durchdrückt. Kennwert für die Temperaturempfindlichkeit von Bitumen.",
    category: "Asphalt",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-wassergehalt",
    term: "Wassergehalt",
    definition:
      "Verhältnis der Masse des im Boden enthaltenen Wassers zur Masse der trockenen Bodenprobe, angegeben in %. Grundlegender Kennwert der Bodenmechanik.",
    category: "Geotechnik",
    learned: true,
    favorite: false,
  },
  {
    id: "fc-proctor",
    term: "Proctor-Versuch",
    definition:
      "Verdichtungsversuch zur Ermittlung der Proctordichte und des optimalen Wassergehalts eines Bodens durch definiertes Verdichten in mehreren Lagen.",
    category: "Geotechnik",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-atterberg",
    term: "Atterberg-Grenzen",
    definition:
      "Zustandsgrenzen bindiger Böden: Fließgrenze, Ausrollgrenze und Schrumpfgrenze. Beschreiben den Übergang zwischen flüssigem, plastischem, halbfestem und festem Zustand.",
    category: "Geotechnik",
    learned: false,
    favorite: true,
  },
  {
    id: "fc-bodenklassifikation",
    term: "Bodenklassifikation",
    definition:
      "Einteilung von Böden nach Korngrößenverteilung und Plastizitätseigenschaften in Bodengruppen, z. B. nach DIN 18196, als Grundlage für die Bauausführung.",
    category: "Geotechnik",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-verdichtungsgrad",
    term: "Verdichtungsgrad",
    definition:
      "Verhältnis der erreichten Trockendichte zur Proctordichte in %. Nachweis, dass eine Bodenschicht ausreichend verdichtet wurde.",
    category: "Geotechnik",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-dichteberechnung",
    term: "Dichteberechnung",
    definition:
      "Berechnung der Dichte als Quotient aus Masse und Volumen einer Probe (ρ = m/V). Grundrechnung für Rohdichte, Trockendichte und Reindichte.",
    category: "Fachrechnen",
    learned: true,
    favorite: false,
  },
  {
    id: "fc-volumenberechnung",
    term: "Volumenberechnung",
    definition:
      "Berechnung des Probekörpervolumens anhand der Geometrie, z. B. Würfel V = a³, Zylinder V = π·r²·h. Grundlage für Dichte- und Festigkeitsberechnungen.",
    category: "Fachrechnen",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-rohdichte",
    term: "Rohdichte",
    definition:
      "Verhältnis von Masse zu Gesamtvolumen eines Stoffes einschließlich Poren, angegeben in kg/m³. Wichtiger Qualitätskennwert für Beton, Asphalt und Boden.",
    category: "Fachrechnen",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-siebkennwerte",
    term: "Siebkennwerte",
    definition:
      "Aus der Sieblinie abgeleitete Kennwerte wie Ungleichförmigkeitszahl Cu = d60/d10 zur Beurteilung der Kornabstufung eines Gemischs.",
    category: "Fachrechnen",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-probenahme",
    term: "Probenahme",
    definition:
      "Genormtes Entnehmen einer repräsentativen Materialprobe (z. B. Frischbeton, Asphaltmischgut, Boden) als Grundlage für aussagekräftige Prüfergebnisse.",
    category: "Normen",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-expositionsklassen",
    term: "Expositionsklassen",
    definition:
      "Klassifikation der Umweltbedingungen, denen ein Bauteil ausgesetzt ist (z. B. XC, XD, XF, XA nach DIN EN 206), maßgeblich für Betonzusammensetzung und -deckung.",
    category: "Normen",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-ce-kennzeichnung",
    term: "CE-Kennzeichnung",
    definition:
      "Nachweis der Konformität eines Bauprodukts mit den geltenden europäischen Normen. Voraussetzung für das Inverkehrbringen im europäischen Wirtschaftsraum.",
    category: "Normen",
    learned: false,
    favorite: false,
  },
  {
    id: "fc-eigen-fremdueberwachung",
    term: "Fremd-/Eigenüberwachung",
    definition:
      "Zweistufiges Qualitätssicherungssystem: Die Eigenüberwachung erfolgt durch den Hersteller selbst, die Fremdüberwachung durch eine unabhängige, akkreditierte Stelle.",
    category: "Normen",
    learned: false,
    favorite: false,
  },
];

export const formulas: Formula[] = [
  {
    id: "fm-wz-wert",
    name: "w/z-Wert",
    formula: "w/z = mW / mZ",
    unit: "–",
    variables: [
      { symbol: "mW", description: "Wassermasse in kg" },
      { symbol: "mZ", description: "Zementmasse in kg" },
    ],
    example: "mW = 180 kg, mZ = 360 kg → w/z = 180 / 360 = 0,50",
    category: "Beton",
  },
  {
    id: "fm-druckfestigkeit",
    name: "Druckfestigkeit",
    formula: "fc = F / A",
    unit: "N/mm²",
    variables: [
      { symbol: "F", description: "Bruchlast in N" },
      { symbol: "A", description: "Querschnittsfläche in mm²" },
    ],
    example: "F = 450.000 N, A = 22.500 mm² → fc = 450.000 / 22.500 = 20 N/mm²",
    category: "Beton",
  },
  {
    id: "fm-ausbreitmass",
    name: "Ausbreitmaß",
    formula: "a = (d1 + d2) / 2",
    unit: "mm",
    variables: [
      { symbol: "d1", description: "Erster gemessener Durchmesser in mm" },
      { symbol: "d2", description: "Zweiter gemessener Durchmesser (90° versetzt) in mm" },
    ],
    example: "d1 = 520 mm, d2 = 500 mm → a = (520 + 500) / 2 = 510 mm",
    category: "Beton",
  },
  {
    id: "fm-betondeckung",
    name: "Nennmaß der Betondeckung",
    formula: "cnom = cmin + Δc",
    unit: "mm",
    variables: [
      { symbol: "cnom", description: "Nennmaß der Betondeckung in mm" },
      { symbol: "cmin", description: "Mindestbetondeckung nach Expositionsklasse in mm" },
      { symbol: "Δc", description: "Vorhaltemaß für Verlegetoleranzen in mm" },
    ],
    example: "cmin = 25 mm, Δc = 10 mm → cnom = 25 + 10 = 35 mm",
    category: "Beton",
  },
  {
    id: "fm-hohlraumgehalt",
    name: "Hohlraumgehalt (Asphalt)",
    formula: "Vm = (ρmax − ρb) / ρmax × 100",
    unit: "%",
    variables: [
      { symbol: "ρmax", description: "Maximale Rohdichte (Bitumen-frei) in kg/m³" },
      { symbol: "ρb", description: "Raumdichte des verdichteten Probekörpers in kg/m³" },
    ],
    example: "ρmax = 2.550 kg/m³, ρb = 2.400 kg/m³ → Vm = (2.550 − 2.400) / 2.550 × 100 ≈ 5,9 %",
    category: "Asphalt",
  },
  {
    id: "fm-wassergehalt",
    name: "Wassergehalt",
    formula: "w = (mfeucht − mtrocken) / mtrocken × 100",
    unit: "%",
    variables: [
      { symbol: "mfeucht", description: "Masse der feuchten Probe in g" },
      { symbol: "mtrocken", description: "Masse der ofengetrockneten Probe in g" },
    ],
    example: "mfeucht = 245 g, mtrocken = 210 g → w = (245 − 210) / 210 × 100 ≈ 16,7 %",
    category: "Geotechnik",
  },
  {
    id: "fm-verdichtungsgrad",
    name: "Verdichtungsgrad",
    formula: "Dpr = ρd / ρpr × 100",
    unit: "%",
    variables: [
      { symbol: "Dpr", description: "Verdichtungsgrad in %" },
      { symbol: "ρd", description: "Erreichte Trockendichte in kg/m³" },
      { symbol: "ρpr", description: "Proctordichte in kg/m³" },
    ],
    example: "ρd = 1.850 kg/m³, ρpr = 1.960 kg/m³ → Dpr = 1.850 / 1.960 × 100 ≈ 94,4 %",
    category: "Geotechnik",
  },
  {
    id: "fm-rohdichte",
    name: "Rohdichte",
    formula: "ρ = m / V",
    unit: "kg/m³",
    variables: [
      { symbol: "m", description: "Masse der Probe in kg" },
      { symbol: "V", description: "Gesamtvolumen der Probe in m³" },
    ],
    example: "m = 2,4 kg, V = 0,001 m³ → ρ = 2,4 / 0,001 = 2.400 kg/m³",
    category: "Fachrechnen",
  },
  {
    id: "fm-volumenberechnung",
    name: "Volumen Würfelprobekörper",
    formula: "V = a³",
    unit: "m³",
    variables: [{ symbol: "a", description: "Kantenlänge des Würfels in m" }],
    example: "a = 0,15 m → V = 0,15³ = 0,003375 m³",
    category: "Fachrechnen",
  },
  {
    id: "fm-ungleichfoermigkeitszahl",
    name: "Ungleichförmigkeitszahl",
    formula: "Cu = d60 / d10",
    unit: "–",
    variables: [
      { symbol: "d60", description: "Korndurchmesser bei 60 % Siebdurchgang in mm" },
      { symbol: "d10", description: "Korndurchmesser bei 10 % Siebdurchgang in mm" },
    ],
    example: "d60 = 2,4 mm, d10 = 0,3 mm → Cu = 2,4 / 0,3 = 8",
    category: "Fachrechnen",
  },
];

export const normDisclaimer =
  "Nur allgemeine Orientierung. Maßgeblich ist immer die gültige Originalnorm.";

export const norms: NormReference[] = [
  {
    id: "norm-din-en-206",
    code: "DIN EN 206",
    title: "Beton – Festlegung, Eigenschaften, Herstellung und Konformität",
    category: "Beton",
    summary: "Grundnorm für Beton, u. a. Expositionsklassen, Konsistenz- und Festigkeitsklassen.",
  },
  {
    id: "norm-din-en-12390",
    code: "DIN EN 12390 (Reihe)",
    title: "Prüfung von Festbeton",
    category: "Beton",
    summary: "Regelt Herstellung, Lagerung und Prüfung von Probekörpern, u. a. Druckfestigkeit und Rohdichte.",
  },
  {
    id: "norm-din-en-12350",
    code: "DIN EN 12350 (Reihe)",
    title: "Prüfung von Frischbeton",
    category: "Beton",
    summary: "Regelt Frischbetonprüfungen wie Ausbreitmaß, Setzmaß, Luftgehalt und Rohdichte.",
  },
  {
    id: "norm-din-1045",
    code: "DIN 1045",
    title: "Tragwerke aus Beton, Stahlbeton und Spannbeton",
    category: "Beton",
    summary: "Nationale Anwendungsregeln zu Eurocode 2 für Bemessung und Ausführung von Betonbauwerken.",
  },
  {
    id: "norm-din-en-12697",
    code: "DIN EN 12697 (Reihe)",
    title: "Prüfverfahren für Asphalt",
    category: "Asphalt",
    summary: "Grundlage für Asphaltprüfungen wie Marshall-Verfahren, Hohlraumgehalt und Sieblinie.",
  },
  {
    id: "norm-ztv-asphalt",
    code: "ZTV Asphalt-StB",
    title: "Zusätzliche Technische Vertragsbedingungen für den Bau von Asphaltbefestigungen",
    category: "Asphalt",
    summary: "Regelt die Ausführung von Asphaltschichten im Straßenbau.",
  },
  {
    id: "norm-din-18196",
    code: "DIN 18196",
    title: "Erd- und Grundbau – Bodenklassifikation für bautechnische Zwecke",
    category: "Geotechnik",
    summary: "Systematik zur Einteilung von Böden nach Korngrößenverteilung und Plastizität.",
  },
  {
    id: "norm-din-18122",
    code: "DIN 18122 (Reihe)",
    title: "Baugrund, Untersuchung von Bodenproben – Zustandsgrenzen",
    category: "Geotechnik",
    summary: "Bestimmung von Fließ-, Ausroll- und Schrumpfgrenze (Atterberg-Grenzen).",
  },
  {
    id: "norm-din-en-iso-17892",
    code: "DIN EN ISO 17892 (Reihe)",
    title: "Geotechnische Erkundung und Untersuchung – Laborversuche an Bodenproben",
    category: "Geotechnik",
    summary: "Regelt bodenmechanische Laborversuche wie Wassergehalt, Proctorversuch und Korngrößenverteilung.",
  },
  {
    id: "norm-din-en-iso-17025",
    code: "DIN EN ISO/IEC 17025",
    title: "Allgemeine Anforderungen an die Kompetenz von Prüf- und Kalibrierlaboratorien",
    category: "Normen",
    summary: "Grundlage für die Akkreditierung von Prüflaboren, regelt Qualitätsmanagement und Kompetenznachweis.",
  },
];

export const glossaryTerms: GlossaryTerm[] = [
  { id: "g-ausbreitmass", term: "Ausbreitmaß", definition: "Kennwert für die Konsistenz von Frischbeton, ermittelt am Ausbreittisch." },
  { id: "g-atterberg", term: "Atterberg-Grenzen", definition: "Zustandsgrenzen bindiger Böden zwischen flüssig, plastisch und fest." },
  { id: "g-betondeckung", term: "Betondeckung", definition: "Abstand zwischen Bewehrung und Bauteiloberfläche zum Korrosionsschutz." },
  { id: "g-bindemittel", term: "Bindemittel", definition: "Stoff wie Zement, Kalk oder Bitumen, der Gesteinskörnungen zu einem festen Gefüge verbindet." },
  { id: "g-druckfestigkeit", term: "Druckfestigkeit", definition: "Maximal aufnehmbare Druckspannung eines Probekörpers bis zum Bruch." },
  { id: "g-expositionsklasse", term: "Expositionsklasse", definition: "Einstufung der Umweltbedingungen eines Bauteils nach DIN EN 206." },
  { id: "g-fremdueberwachung", term: "Fremdüberwachung", definition: "Externe, unabhängige Qualitätskontrolle durch eine akkreditierte Stelle." },
  { id: "g-gesteinskoernung", term: "Gesteinskörnung", definition: "Mineralisches Korngemisch (Sand, Kies, Splitt) als Ausgangsstoff für Beton und Asphalt." },
  { id: "g-hohlraumgehalt", term: "Hohlraumgehalt", definition: "Anteil der Luftporen im verdichteten Asphalt in Vol.-%." },
  { id: "g-konsistenz", term: "Konsistenz", definition: "Verarbeitbarkeit von Frischbeton, beschrieben über Klassen wie F1 bis F6." },
  { id: "g-luftgehalt", term: "Luftgehalt", definition: "Anteil eingeschlossener Luftporen im Frischbeton in Vol.-%." },
  { id: "g-marshall-stabilitaet", term: "Marshall-Stabilität", definition: "Maximale Prüfkraft beim Marshall-Versuch, Kennwert für die Tragfähigkeit von Asphalt." },
  { id: "g-proctordichte", term: "Proctordichte", definition: "Maximal erreichbare Trockendichte eines Bodens beim Proctor-Versuch." },
  { id: "g-pruefalter", term: "Prüfalter", definition: "Alter des Probekörpers zum Prüfzeitpunkt, meist 7 oder 28 Tage." },
  { id: "g-rohdichte", term: "Rohdichte", definition: "Verhältnis von Masse zu Gesamtvolumen eines Stoffes einschließlich Poren." },
  { id: "g-sieblinie", term: "Sieblinie", definition: "Grafische Darstellung der Korngrößenverteilung eines Gesteinskörnungsgemischs." },
  { id: "g-verdichtungsgrad", term: "Verdichtungsgrad", definition: "Verhältnis der erreichten Trockendichte zur Proctordichte in %." },
  { id: "g-wz-wert", term: "w/z-Wert", definition: "Verhältnis von Wassermasse zu Zementmasse im Frischbeton." },
  { id: "g-zuschlagstoff", term: "Zuschlagstoff", definition: "Zusatzstoff, der Beton- oder Asphalteigenschaften gezielt verändert." },
].sort((a, b) => a.term.localeCompare(b.term, "de"));
