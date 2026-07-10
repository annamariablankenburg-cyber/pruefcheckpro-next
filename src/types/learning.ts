export type LearningCategory = "Beton" | "Asphalt" | "Geotechnik" | "Fachrechnen" | "Normen";

export interface Flashcard {
  id: string;
  term: string;
  definition: string;
  category: LearningCategory;
  learned: boolean;
  favorite: boolean;
}

export interface FormulaVariable {
  symbol: string;
  description: string;
}

export interface Formula {
  id: string;
  name: string;
  formula: string;
  unit: string;
  variables: FormulaVariable[];
  example: string;
  category: LearningCategory;
}

export interface NormReference {
  id: string;
  code: string;
  title: string;
  category: LearningCategory;
  summary: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

export type LearningTabId =
  | "lernkarten"
  | "formeln"
  | "normen"
  | "glossar"
  | "favoriten"
  | "fortschritt";

export interface LearningTab {
  value: LearningTabId;
  label: string;
}
