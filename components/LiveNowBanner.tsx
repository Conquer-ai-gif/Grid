'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Users, X, ArrowRight } from 'lucide-react';
import { useLiveLectures } from '@/hooks/useLiveLectures';
import { cn } from '@/lib/utils';

export function LiveNowBanner() {
  const { liveLectures, isLoading } = useLiveLectures();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const router = useRouter();

  const visible = liveLectures.filter((l) => !dismissed.has(l.callId));

  if (isLoading || visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((lecture) => (
        <div
          key={lecture.callId}
          className="relative flex items-center justify-between gap-4 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3.5 transition-all"
        >
          {/* Pulsing live dot + label */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 flex size-8 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-30" />
              <span className="relative flex size-4 items-center justify-center rounded-full bg-red-500">
                <Radio size={9} className="text-white" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-red-400">Live now</span>
                {lecture.participantCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                    <Users size={10} />
                    {lecture.participantCount}
                  </span>
                )}
              </div>
              <p className="truncate text-sm font-semibold text-text-1 mt-0.5">{lecture.title}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(`/meeting/${lecture.callId}`)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white',
                'hover:bg-red-400 transition-all'
              )}
            >
              Join <ArrowRight size={12} />
            </button>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, lecture.callId]))}
              className="rounded-lg p-1.5 text-text-3 hover:text-text-1 transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
