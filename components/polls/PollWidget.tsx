'use client';

import { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { Poll } from '@/types';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';

interface PollWidgetProps {
  poll: Poll;
  onVote?: (optionIndex: number) => void;
  userVote?: number;
  disabled?: boolean;
}

export function PollWidget({ poll, onVote, userVote, disabled }: PollWidgetProps) {
  const { isLecturer } = useRole();
  const [voting, setVoting] = useState(false);

  const totalVotes = Object.values(poll.votes).reduce((sum, v) => sum + v, 0);

  const handleVote = async (index: number) => {
    if (voting || disabled || userVote !== undefined || isLecturer) return;
    setVoting(true);
    try {
      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: poll.id, option_index: index }),
      });
      if (res.ok) onVote?.(index);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="rounded-xl bg-surface-1 border border-border-1 p-4 text-text-1">
      <div className="mb-3 flex items-center gap-2">
        <BarChart2 size={14} className="text-amber-1" />
        <p className="text-xs font-semibold text-amber-1">Poll</p>
      </div>
      <p className="mb-4 text-sm font-medium text-text-2">{poll.question}</p>

      <div className="flex flex-col gap-2">
        {poll.options.map((option, idx) => {
          const voteCount = poll.votes[String(idx)] ?? 0;
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isMyVote = userVote === idx;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={voting || disabled || userVote !== undefined || isLecturer}
              className={cn(
                'relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-all',
                isMyVote
                  ? 'border-amber-1 bg-amber-5 text-amber-1'
                  : 'border-border-1 bg-surface-2 text-text-2 hover:border-border-2 disabled:hover:border-border-1'
              )}
            >
              <div className="absolute inset-0 bg-amber-1/10 transition-all duration-500" style={{ width: `${pct}%` }} />
              <div className="relative flex items-center justify-between">
                <span>{option}</span>
                <span className="text-xs text-text-3">{pct}% ({voteCount})</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-text-3">{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</p>
    </div>
  );
}
