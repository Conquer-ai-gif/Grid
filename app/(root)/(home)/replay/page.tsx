'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Sparkles, Layout, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptChunk {
  id: string;
  text: string;
  timestamp_ms: number;
  speaker_id: string;
}

interface Summary {
  summary: string;
  word_count: number;
  created_at: string;
}

interface LectureOption {
  id: string;
  title: string;
  created_at: string;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ReplayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lectureId = searchParams.get('lecture_id');

  const [lectures, setLectures] = useState<LectureOption[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const [transcript, setTranscript] = useState<TranscriptChunk[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'whiteboard'>('transcript');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedLecture = lectures.find((l) => l.id === lectureId);

  // Load lecture list for the picker
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/lectures');
        const { lectures: data } = await res.json();
        setLectures(data ?? []);
      } catch { /* silently fail */ }
      finally { setLoadingLectures(false); }
    };
    load();
  }, []);

  // Load transcript + summary when lecture is selected
  useEffect(() => {
    if (!lectureId) return;
    setLoading(true);
    setTranscript([]);
    setSummary(null);
    const load = async () => {
      try {
        const [transcriptRes, summaryRes] = await Promise.all([
          fetch(`/api/lectures/transcript?lecture_id=${lectureId}`),
          fetch(`/api/ai?lecture_id=${lectureId}`),
        ]);
        const [tData, sData] = await Promise.all([transcriptRes.json(), summaryRes.json()]);
        setTranscript(tData.chunks ?? []);
        setSummary(sData.summary ?? null);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    load();
  }, [lectureId]);

  const filteredTranscript = searchQuery
    ? transcript.filter((c) => c.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : transcript;

  const tabs = [
    { key: 'transcript' as const, label: 'Transcript', icon: FileText },
    { key: 'summary' as const, label: 'AI Summary', icon: Sparkles },
    { key: 'whiteboard' as const, label: 'Whiteboard', icon: Layout },
  ];

  return (
    <section className="flex size-full flex-col gap-6 text-text-1">
      <div>
        <h1 className="text-3xl font-bold text-text-1">Lecture Replay</h1>
        <p className="mt-1 text-sm text-text-2 opacity-70">
          Browse transcripts, AI summaries, and whiteboard snapshots from past lectures.
        </p>
      </div>

      {/* Lecture picker */}
      <div className="relative">
        <label className="mb-2 block text-sm font-medium text-text-2">Select a lecture</label>
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-sm text-text-1 hover:border-amber-1 transition-colors"
        >
          <span className={selectedLecture ? 'text-text-1' : 'text-text-3 opacity-60'}>
            {loadingLectures
              ? 'Loading lectures…'
              : selectedLecture
                ? selectedLecture.title
                : 'Choose a lecture to replay…'}
          </span>
          <ChevronDown size={16} className={cn('text-text-3 transition-transform', showPicker && 'rotate-180')} />
        </button>

        {showPicker && (
          <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border-1 bg-surface-2 shadow-2xl max-h-60 overflow-y-auto">
            {lectures.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-text-3">No lectures found</li>
            ) : (
              lectures.map((lecture) => (
                <li key={lecture.id}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/replay?lecture_id=${lecture.id}`);
                      setShowPicker(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors hover:bg-amber-5 hover:text-amber-1',
                      lecture.id === lectureId ? 'bg-amber-5 text-amber-1' : 'text-text-1'
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

      {!lectureId ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border-1 bg-surface-1 gap-4 py-20">
          <FileText size={32} className="text-text-3 opacity-50" />
          <p className="text-sm text-text-3">Select a lecture above to view its replay</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-border-1 bg-surface-1 p-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all',
                  activeTab === key
                    ? 'bg-amber-1 text-black'
                    : 'text-text-3 hover:text-text-2'
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-1 border border-border-1 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Transcript */}
              {activeTab === 'transcript' && (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
                    <input
                      type="text"
                      placeholder="Search transcript…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-border-1 bg-surface-1 py-2.5 pl-9 pr-4 text-sm text-text-1 placeholder:text-text-3 outline-none focus:border-amber-1 transition-colors"
                    />
                  </div>

                  {filteredTranscript.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-border-1 bg-surface-1 py-16 gap-3">
                      <FileText size={28} className="text-text-3 opacity-50" />
                      <p className="text-sm text-text-3">
                        {searchQuery ? 'No matches found' : 'No transcript available for this lecture yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
                      {filteredTranscript.map((chunk) => (
                        <div key={chunk.id} className="flex gap-3 rounded-xl border border-border-1 bg-surface-1 px-4 py-3">
                          <span className="shrink-0 font-mono text-xs text-amber-1 mt-0.5 pt-px">
                            {formatTimestamp(chunk.timestamp_ms)}
                          </span>
                          <p className="text-sm text-text-2 leading-relaxed">{chunk.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI Summary */}
              {activeTab === 'summary' && (
                <div className="rounded-2xl border border-border-1 bg-surface-1 p-6">
                  {summary ? (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-amber-1">
                          <Sparkles size={12} /> AI-generated summary
                        </span>
                        <span className="text-xs text-text-3">
                          {summary.word_count} source words · {new Date(summary.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-text-2 leading-relaxed whitespace-pre-wrap">{summary.summary}</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Sparkles size={28} className="text-text-3 opacity-50" />
                      <p className="text-sm text-text-3">No AI summary generated yet.</p>
                      <p className="text-xs text-text-3 opacity-60 text-center max-w-xs">
                        Lecturers can trigger summarization from the meeting room after the lecture ends.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Whiteboard */}
              {activeTab === 'whiteboard' && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border-1 bg-surface-1 py-16 gap-3">
                  <Layout size={28} className="text-text-3 opacity-50" />
                  <p className="text-sm text-text-3">Whiteboard replay coming soon.</p>
                  <p className="text-xs text-text-3 opacity-60 text-center max-w-xs">
                    Events are stored and will be replayed chronologically in a future update.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
