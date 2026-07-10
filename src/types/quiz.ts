export type QuizCategory = "Beton" | "Asphalt" | "Geotechnik" | "Fachrechnen" | "Normen";

export type QuizSelectionCategory = QuizCategory | "Gemischt";

export type QuizDifficulty = "Leicht" | "Mittel" | "Schwer";

export type QuizQuestionCount = 5 | 10 | 20;

export type QuizQuestionType = "multiple-choice" | "true-false" | "numeric" | "matching" | "ordering";

interface QuizQuestionBase {
  id: string;
  category: QuizCategory;
  difficulty: QuizDifficulty;
  question: string;
  explanation: string;
}

export interface MultipleChoiceQuestion extends QuizQuestionBase {
  type: "multiple-choice";
  options: string[];
  correctIndex: number;
}

export interface TrueFalseQuestion extends QuizQuestionBase {
  type: "true-false";
  correctAnswer: boolean;
}

export interface NumericQuestion extends QuizQuestionBase {
  type: "numeric";
  correctValue: number;
  unit?: string;
  tolerance?: number;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface MatchingQuestion extends QuizQuestionBase {
  type: "matching";
  pairs: MatchingPair[];
}

export interface OrderingQuestion extends QuizQuestionBase {
  type: "ordering";
  steps: string[];
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | NumericQuestion
  | MatchingQuestion
  | OrderingQuestion;

export interface QuizAnswerRecord {
  questionId: string;
  correct: boolean;
}

export interface QuizResultSummary {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  percentage: number;
  passed: boolean;
  weakCategories: QuizCategory[];
}

export interface QuizCategoryStat {
  correct: number;
  total: number;
}
