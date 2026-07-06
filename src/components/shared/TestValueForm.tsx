import { Info } from "lucide-react";

import { CalculationPreview } from "@/components/shared/CalculationPreview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TestType, TestValueField } from "@/types/testValue";

const fieldSets: Record<TestType, TestValueField[]> = {
  "beton-wuerfel": [
    { key: "kante1", label: "Kantenlänge 1 (mm)", kind: "input" },
    { key: "kante2", label: "Kantenlänge 2 (mm)", kind: "input" },
    { key: "kante3", label: "Kantenlänge 3 (mm)", kind: "input" },
    { key: "bruchlast", label: "Bruchlast (kN)", kind: "input" },
    {
      key: "druckfestigkeit",
      label: "Druckfestigkeit (N/mm²)",
      kind: "calculated",
      hint: "Druckfestigkeit wird später automatisch aus Bruchlast und Fläche berechnet.",
    },
  ],
  "beton-prisma": [
    { key: "laenge", label: "Länge (mm)", kind: "input" },
    { key: "breite", label: "Breite (mm)", kind: "input" },
    { key: "hoehe", label: "Höhe (mm)", kind: "input" },
    { key: "biegezugkraft", label: "Biegezugkraft (kN)", kind: "input" },
    {
      key: "biegezugfestigkeit",
      label: "Biegezugfestigkeit (N/mm²)",
      kind: "calculated",
      hint: "Wird später automatisch aus der Biegezugkraft berechnet.",
    },
    { key: "druck1", label: "Druckfestigkeit Bruchhälfte 1 (N/mm²)", kind: "input" },
    { key: "druck2", label: "Druckfestigkeit Bruchhälfte 2 (N/mm²)", kind: "input" },
    {
      key: "mittelwert",
      label: "Mittelwert (N/mm²)",
      kind: "calculated",
      hint: "Wird später automatisch aus beiden Bruchhälften berechnet.",
    },
  ],
  proctor: [
    { key: "wassergehalt", label: "Wassergehalt (%)", kind: "input" },
    { key: "feuchtdichte", label: "Feuchtdichte (g/cm³)", kind: "input" },
    {
      key: "trockendichte",
      label: "Trockendichte (g/cm³)",
      kind: "calculated",
      hint: "Wird später automatisch aus Feuchtdichte und Wassergehalt berechnet.",
    },
    {
      key: "verdichtungsgrad",
      label: "Verdichtungsgrad (%)",
      kind: "calculated",
      hint: "Wird später automatisch aus Trockendichte und Proctordichte berechnet.",
    },
  ],
  asphalt: [
    { key: "marshall", label: "Marshall-Stabilität (kN)", kind: "input" },
    { key: "fliesswert", label: "Fließwert (mm)", kind: "input" },
    { key: "raumdichte", label: "Raumdichte (g/cm³)", kind: "input" },
    {
      key: "hohlraumgehalt",
      label: "Hohlraumgehalt (%)",
      kind: "calculated",
      hint: "Wird später automatisch aus Raumdichte und Rohdichte berechnet.",
    },
  ],
};

function toIsoDate(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split(".");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
}

interface TestValueFormProps {
  testType: TestType;
  defaultPruefer: string;
  defaultPruefdatum: string;
}

export function TestValueForm({ testType, defaultPruefer, defaultPruefdatum }: TestValueFormProps) {
  const fields = fieldSets[testType];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
        <Info className="mt-0.5 size-4 shrink-0" />
        Berechnung noch nicht aktiv — UI-Vorbereitung. Werte werden aktuell nicht gespeichert.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) =>
          field.kind === "calculated" ? (
            <CalculationPreview key={field.key} label={field.label} hint={field.hint ?? ""} />
          ) : (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{field.label}</label>
              <Input type="number" inputMode="decimal" placeholder="0,00" />
            </div>
          )
        )}
      </div>

      <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Prüfer</label>
          <Input defaultValue={defaultPruefer} placeholder="Name des Prüfers" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Prüfdatum</label>
          <Input type="date" defaultValue={toIsoDate(defaultPruefdatum)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Bemerkung</label>
        <Textarea placeholder="Besonderheiten bei der Prüfung …" />
      </div>
    </div>
  );
}
