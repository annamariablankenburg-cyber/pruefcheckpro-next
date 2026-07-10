"use client";

import { Flame, HelpCircle, ListChecks, Target } from "lucide-react";

import { QuizProgress } from "@/components/shared/QuizProgress";
import { QuizQuestionCard } from "@/components/shared/QuizQuestionCard";
import { QuizResult } from "@/components/shared/QuizResult";
import { QuizSetup } from "@/components/shared/QuizSetup";
import { StatCard } from "@/components/shared/StatCard";
import { useQuiz } from "@/hooks/useQuiz";

export default function QuizPage() {
  const {
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
    kpis,
  } = useQuiz();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Quiz
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Teste dein Wissen und verbessere gezielt deine Schwächen.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={ListChecks} label="Quiz abgeschlossen" value={kpis.completedQuizzes} />
        <StatCard icon={Target} label="Richtige Antworten" value={kpis.totalCorrectAnswers} tone="success" />
        <StatCard icon={Flame} label="Beste Serie" value={kpis.bestStreak} tone="warning" />
        <StatCard icon={ListChecks} label="Heute beantwortet" value={kpis.answeredToday} />
        <StatCard icon={HelpCircle} label="Offene Themen" value={kpis.openTopics} />
      </div>

      {phase === "setup" && (
        <QuizSetup
          category={category}
          onCategoryChange={setCategory}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          questionCount={questionCount}
          onQuestionCountChange={setQuestionCount}
          onStart={startQuiz}
        />
      )}

      {phase === "active" && currentQuestion && (
        <div className="flex flex-col gap-4">
          <QuizProgress current={currentIndex + 1} total={sessionQuestions.length} />
          <QuizQuestionCard
            question={currentQuestion}
            answer={currentAnswer}
            checked={checked}
            onAnswerChange={setAnswer}
            onCheck={checkAnswer}
            onNext={nextQuestion}
            isLast={currentIndex + 1 === sessionQuestions.length}
          />
        </div>
      )}

      {phase === "finished" && (
        <QuizResult
          result={result}
          hasWrongAnswers={hasWrongAnswers}
          onRestart={restartSameSetup}
          onReviewWrong={reviewWrongOnly}
          onNewSetup={backToSetup}
        />
      )}
    </div>
  );
}
