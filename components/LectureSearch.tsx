'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  stream_call_id: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  courses: { name: string; code: string | null } | null;
}

export function LectureSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/lectures/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <div className="flex items-center gap-2 rounded-xl border border-border-1 bg-surface-1 px-3 py-2 focus-within:border-amber-1 transition-all">
        <Search size={15} className="shrink-0 text-text-3" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder="Search lectures, courses…"
          className="flex-1 bg-transparent text-sm text-text-1 placeholder:text-text-3 outline-none"
        />
        {query && (
          <button onClick={clear} className="text-text-3 hover:text-text-1">
            <X size={14} />
          </button>
        )}
        {loading && (
          <div className="size-3 animate-spin rounded-full border border-amber-1 border-t-transparent" />
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-full rounded-2xl border border-border-1 bg-surface-1 shadow-2xl overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-text-3">No lectures found for "{query}"</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border-1">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/meeting/${r.stream_call_id}`}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-1 px-4 py-3 hover:bg-surface-2 transition-colors"
                  >
                    <span className="text-sm font-semibold text-text-1 line-clamp-1">{r.title}</span>
                    <div className="flex items-center gap-3 text-xs text-text-3">
                      {r.courses && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={11} />
                          {r.courses.code ? `${r.courses.code} — ` : ''}{r.courses.name}
                        </span>
                      )}
                      {r.started_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(r.started_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-xs text-text-3 line-clamp-1">{r.description}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
