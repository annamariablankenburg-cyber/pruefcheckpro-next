"use client";

import { useMemo, useState } from "react";

import { quizQuestions } from "@/config/quiz";
import type {
  QuizAnswerRecord,
  QuizCategory,
  QuizCategoryStat,
  QuizDifficulty,
  QuizQuestion,
  QuizQuestionCount,
  QuizResultSummary,
  QuizSelectionCategory,
} from "@/types/quiz";

type QuizPhase = "setup" | "active" | "finished";

const quizCategories: QuizCategory[] = ["Beton", "Asphalt", "Geotechnik", "Fachrechnen", "Normen"];

// Mock-Startwerte, damit die KPI-Kacheln nicht bei Null beginnen. Werden im
// Laufe der Session durch echte (lokale) Antworten fortgeschrieben.
const initialCategoryStats: Record<QuizCategory, QuizCategoryStat> = {
  Beton: { correct: 8, total: 10 },
  Asphalt: { correct: 4, total: 8 },
  Geotechnik: { correct: 6, total: 9 },
  Fachrechnen: { correct: 3, total: 6 },
  Normen: { correct: 2, total: 5 },
};
const INITIAL_COMPLETED_QUIZZES = 12;
const INITIAL_BEST_STREAK = 9;
const INITIAL_ANSWERED_TODAY = 6;
const PASS_THRESHOLD = 60;
const WEAK_THRESHOLD = 0.6;

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function initialAnswerFor(question: QuizQuestion | undefined): unknown {
  if (!question) return null;
  switch (question.type) {
    case "multiple-choice":
      return null;
    case "true-false":
      return null;
    case "numeric":
      return "";
    case "matching":
      return {};
    case "ordering":
      return shuffle(question.steps);
    default:
      return null;
  }
}

export function evaluateAnswer(question: QuizQuestion, answer: unknown): boolean {
  switch (question.type) {
    case "multiple-choice":
      return answer === question.correctIndex;
    case "true-false":
      return answer === question.correctAnswer;
    case "numeric": {
      const numeric =
        typeof answer === "number" ? answer : parseFloat(String(answer).replace(",", "."));
      if (Number.isNaN(numeric)) return false;
      return Math.abs(numeric - question.correctValue) <= (question.tolerance ?? 0.01);
    }
    case "matching": {
      const mapping = (answer ?? {}) as Record<string, string>;
      return question.pairs.every((pair) => mapping[pair.left] === pair.right);
    }
    case "ordering": {
      const order = (answer ?? []) as string[];
      return (
        order.length === question.steps.length &&
        order.every((step, index) => step === question.steps[index])
      );
    }
    default:
      return false;
  }
}

function buildQuestionPool(
  category: QuizSelectionCategory,
  difficulty: QuizDifficulty,
  count: QuizQuestionCount
): QuizQuestion[] {
  const byCategory =
    category === "Gemischt"
      ? quizQuestions
      : quizQuestions.filter((question) => question.category === category);

  const preferred = shuffle(byCategory.filter((question) => question.difficulty === difficulty));
  const rest = shuffle(byCategory.filter((question) => question.difficulty !== difficulty));

  return [...preferred, ...rest].slice(0, count);
}

function computeResult(questions: QuizQuestion[], answers: QuizAnswerRecord[]): QuizResultSummary {
  const total = questions.length;
  const correctCount = answers.filter((answer) => answer.correct).length;
  const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  const stats = new Map<QuizCategory, QuizCategoryStat>();
  questions.forEach((question) => {
    const answer = answers.find((entry) => entry.questionId === question.id);
    const entry = stats.get(question.category) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (answer?.correct) entry.correct += 1;
    stats.set(question.category, entry);
  });

  const weakCategories = Array.from(stats.entries())
    .filter(([, stat]) => stat.total > 0 && stat.correct / stat.total < WEAK_THRESHOLD)
    .map(([category]) => category);

  return {
    totalQuestions: total,
    correctCount,
    incorrectCount: total - correctCount,
    percentage,
    passed: percentage >= PASS_THRESHOLD,
    weakCategories,
  };
}

export function useQuiz() {
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [category, setCategory] = useState<QuizSelectionCategory>("Gemischt");
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("Mittel");
  const [questionCount, setQuestionCount] = useState<QuizQuestionCount>(10);

  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<unknown>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);

  const [, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(INITIAL_BEST_STREAK);
  const [completedQuizzes, setCompletedQuizzes] = useState(INITIAL_COMPLETED_QUIZZES);
  const [answeredToday, setAnsweredToday] = useState(INITIAL_ANSWERED_TODAY);
  const [categoryStats, setCategoryStats] =
    useState<Record<QuizCategory, QuizCategoryStat>>(initialCategoryStats);

  const currentQuestion = sessionQuestions[currentIndex];

  function launchQuiz(questions: QuizQuestion[]) {
    setSessionQuestions(questions);
    setCurrentIndex(0);
    setCurrentAnswer(initialAnswerFor(questions[0]));
    setChecked(false);
    setAnswers([]);
    setCurrentStreak(0);
    setPhase("active");
  }

  function startQuiz() {
    launchQuiz(buildQuestionPool(category, difficulty, questionCount));
  }

  function restartSameSetup() {
    startQuiz();
  }

  function reviewWrongOnly() {
    const wrongIds = new Set(answers.filter((answer) => !answer.correct).map((a) => a.questionId));
    const wrongQuestions = sessionQuestions.filter((question) => wrongIds.has(question.id));
    if (wrongQuestions.length === 0) return;
    launchQuiz(wrongQuestions);
  }

  function backToSetup() {
    setPhase("setup");
  }

  function setAnswer(value: unknown) {
    if (checked) return;
    setCurrentAnswer(value);
  }

  function checkAnswer() {
    if (checked || !currentQuestion) return;
    const correct = evaluateAnswer(currentQuestion, currentAnswer);
    setChecked(true);
    setAnswers((prev) => [...prev, { questionId: currentQuestion.id, correct }]);
    setAnsweredToday((n) => n + 1);
    setCategoryStats((prev) => {
      const entry = prev[currentQuestion.category];
      return {
        ...prev,
        [currentQuestion.category]: {
          correct: entry.correct + (correct ? 1 : 0),
          total: entry.total + 1,
        },
      };
    });

    if (correct) {
      setCurrentStreak((streak) => {
        const next = streak + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      setCurrentStreak(0);
    }
  }

  function nextQuestion() {
    if (!checked) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sessionQuestions.length) {
      setCompletedQuizzes((n) => n + 1);
      setPhase("finished");
      return;
    }
    setCurrentIndex(nextIndex);
    setCurrentAnswer(initialAnswerFor(sessionQuestions[nextIndex]));
    setChecked(false);
  }

  const result = useMemo(() => computeResult(sessionQuestions, answers), [sessionQuestions, answers]);

  const totalCorrectAnswers = useMemo(
    () => Object.values(categoryStats).reduce((sum, stat) => sum + stat.correct, 0),
    [categoryStats]
  );

  const openTopics = useMemo(
    () =>
      quizCategories.filter((cat) => {
        const stat = categoryStats[cat];
        return stat.total === 0 || stat.correct / stat.total < WEAK_THRESHOLD;
      }).length,
    [categoryStats]
  );

  const hasWrongAnswers = answers.some((answer) => !answer.correct);

  return {
    phase,
    category,
    setCategory,
    difficulty,
    setDifficulty,
    questionCount,
    setQuestionCount,
    startQuiz,
    restartSameSetup,
    reviewWrongOnly,
    backToSetup,
    hasWrongAnswers,

    sessionQuestions,
    currentIndex,
    currentQuestion,
    currentAnswer,
    setAnswer,
    checked,
    checkAnswer,
    nextQuestion,
    result,

    kpis: {
      completedQuizzes,
      totalCorrectAnswers,
      bestStreak,
      answeredToday,
      openTopics,
    },
  };
}
