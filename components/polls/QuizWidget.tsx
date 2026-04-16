'use client';

import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { Quiz } from '@/types';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';

interface QuizWidgetProps {
  quiz: Quiz;
  onAnswer?: (isCorrect: boolean) => void;
}

export function QuizWidget({ quiz, onAnswer }: QuizWidgetProps) {
  const { isLecturer } = useRole();
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_seconds);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);

  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [submitted, timeLeft]);

  const handleSubmit = async () => {
    if (selected === null || submitted || isLecturer) return;
    setSubmitted(true);
    const res = await fetch('/api/quizzes/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quiz.id, answer_index: selected }),
    });
    if (res.ok) {
      const { is_correct } = await res.json();
      setResult(is_correct);
      onAnswer?.(is_correct);
    }
  };

  return (
    <div className="rounded-xl bg-surface-1 border border-border-1 p-4 text-text-1">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-amber-1" />
          <p className="text-xs font-semibold text-amber-1">Quiz</p>
        </div>
        <span className={cn('text-xs font-bold tabular-nums', timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-text-3')}>
          {timeLeft > 0 ? `${timeLeft}s` : 'Time up'}
        </span>
      </div>

      <p className="mb-4 text-sm font-medium text-text-2">{quiz.question}</p>

      <div className="flex flex-col gap-2">
        {quiz.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => !submitted && !isLecturer && setSelected(idx)}
            disabled={submitted || isLecturer || timeLeft <= 0}
            className={cn(
              'rounded-lg border px-3 py-2 text-left text-sm transition-all',
              submitted && idx === quiz.correct_answer ? 'border-amber-1 bg-amber-5 text-amber-1'
                : submitted && idx === selected && !result ? 'border-red-400/40 bg-red-400/10 text-red-400'
                : selected === idx ? 'border-amber-1 bg-amber-5 text-amber-1'
                : 'border-border-1 bg-surface-2 text-text-2 hover:border-border-2'
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {!submitted && !isLecturer && (
        <button
          onClick={handleSubmit}
          disabled={selected === null || timeLeft <= 0}
          className="mt-3 w-full rounded-lg bg-amber-1 py-2 text-sm font-bold text-black disabled:opacity-40 transition-all"
        >
          Submit answer
        </button>
      )}

      {submitted && result !== null && (
        <p className={cn('mt-3 text-center text-sm font-semibold', result ? 'text-amber-1' : 'text-red-400')}>
          {result ? 'Correct!' : 'Incorrect'}
        </p>
      )}
    </div>
  );
}
