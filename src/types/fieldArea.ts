import type { LucideIcon } from "lucide-react";

import type { Formula, GlossaryTerm, NormReference } from "@/types/learning";

export type FieldAreaId = "beton" | "asphalt" | "geotechnik";

export type FieldAreaFilterTag =
  | "Labor"
  | "Baustelle"
  | "Frischzustand"
  | "Festzustand"
  | "Vorbereitung"
  | "Auswertung";

export type ProcedureLocation = "Labor" | "Baustelle" | "Labor & Baustelle";

export type ProcedureStatus = "Verfügbar" | "In Vorbereitung";

export interface FieldAreaProcedure {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  location: ProcedureLocation;
  status: ProcedureStatus;
  tags: FieldAreaFilterTag[];
  favorite: boolean;
  learned: boolean;
  purpose: string;
  equipment: string[];
  preparation: string[];
  steps: string[];
  inputs: string[];
  outputs: string[];
  pitfalls: string[];
  normHint: string;
}

export interface CalculatorField {
  key: string;
  label: string;
  unit?: string;
  type?: "number" | "date";
  placeholder?: string;
}

export interface CalculatorDefinition {
  id: string;
  name: string;
  description: string;
  inputs: CalculatorField[];
  resultLabel: string;
  resultUnit?: string;
  plausibilityHint?: string;
  compute: (values: Record<string, string>) => number | null;
}

export type FieldAreaTabId = "uebersicht" | "verfahren" | "rechner" | "formeln" | "normen" | "glossar";

export interface FieldAreaTab {
  value: FieldAreaTabId;
  label: string;
}

export interface FieldAreaConfig {
  id: FieldAreaId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  applicableFilterTags: FieldAreaFilterTag[];
  procedures: FieldAreaProcedure[];
  calculators: CalculatorDefinition[];
  formulas: Formula[];
  norms: NormReference[];
  glossary: GlossaryTerm[];
}
