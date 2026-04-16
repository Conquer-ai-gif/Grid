'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, BarChart2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { EngagementDashboard } from '@/components/analytics/EngagementDashboard';
import { cn } from '@/lib/utils';

interface LectureOption {
  id: string;
  title: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const { isLecturer, isLoaded } = useUserRole();
  const [lectures, setLectures] = useState<LectureOption[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isLecturer) { setLoadingLectures(false); return; }
    const load = async () => {
      try {
        const res = await fetch('/api/lectures');
        const { lectures: data } = await res.json();
        setLectures(data ?? []);
      } catch { /* silently fail */ }
      finally { setLoadingLectures(false); }
    };
    load();
  }, [isLoaded, isLecturer]);

  if (!isLoaded) return null;

  if (!isLecturer) {
    return (
      <section className="flex h-full items-center justify-center">
        <p className="text-base font-semibold text-text-2">Analytics are only available to lecturers.</p>
      </section>
    );
  }

  const selectedLecture = lectures.find((l) => l.id === selectedId);

  return (
    <section className="flex size-full flex-col gap-6 text-text-1">
      <div>
        <h1 className="text-3xl font-bold text-text-1">Engagement Analytics</h1>
        <p className="mt-1 text-sm text-text-2 opacity-70">
          View attendance, poll participation, and quiz scores for each lecture.
        </p>
      </div>

      {/* Lecture picker */}
      <div className="relative max-w-lg">
        <label className="mb-2 block text-sm font-medium text-text-2">Select a lecture</label>
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-sm hover:border-amber-1 transition-colors"
        >
          <span className={selectedLecture ? 'text-text-1' : 'text-text-3 opacity-60'}>
            {loadingLectures ? 'Loading lectures…' : selectedLecture ? selectedLecture.title : 'Choose a lecture to analyse…'}
          </span>
          <ChevronDown size={16} className={cn('text-text-3 transition-transform', showPicker && 'rotate-180')} />
        </button>

        {showPicker && (
          <ul className="absolute z-50 mt-1 w-full overflow-y-auto max-h-64 rounded-xl border border-border-1 bg-surface-2 shadow-2xl">
            {lectures.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-text-3">No lectures found</li>
            ) : (
              lectures.map((lecture) => (
                <li key={lecture.id}>
                  <button
                    type="button"
                    onClick={() => { setSelectedId(lecture.id); setShowPicker(false); }}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors hover:bg-amber-5 hover:text-amber-1',
                      lecture.id === selectedId ? 'bg-amber-5 text-amber-1' : 'text-text-1'
                    )}
                  >
                    <p className="text-sm font-medium">{lecture.title}</p>
                    <p className="text-xs opacity-60 mt-0.5">
                      {new Date(lecture.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {!selectedId ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border-1 bg-surface-1 gap-4 py-20">
          <BarChart2 size={32} className="text-text-3 opacity-50" />
          <p className="text-sm text-text-3">Select a lecture above to view its analytics</p>
        </div>
      ) : (
        <EngagementDashboard lectureId={selectedId} />
      )}
    </section>
  );
}
