'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BookOpen, GraduationCap } from 'lucide-react';

type Role = 'student' | 'lecturer' | null;

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);

  // University autocomplete
  const [query, setQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Department autocomplete
  const [department, setDepartment] = useState('');
  const [deptSuggestions, setDeptSuggestions] = useState<string[]>([]);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [loadingDeptSuggestions, setLoadingDeptSuggestions] = useState(false);
  const deptDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deptWrapperRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (deptWrapperRef.current && !deptWrapperRef.current.contains(e.target as Node)) {
        setShowDeptDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();

    if (selectedUniversity && query !== selectedUniversity) {
      setSelectedUniversity('');
    }

    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/universities?q=${encodeURIComponent(trimmed)}`);
        const data: string[] = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedUniversity]);

  // Fetch department suggestions whenever the university is set and department query changes
  useEffect(() => {
    if (deptDebounceRef.current) clearTimeout(deptDebounceRef.current);

    deptDebounceRef.current = setTimeout(async () => {
      setLoadingDeptSuggestions(true);
      try {
        const params = new URLSearchParams({ q: department.trim() });
        if (selectedUniversity) params.set('university', selectedUniversity);
        const res = await fetch(`/api/departments?${params.toString()}`);
        const data: string[] = await res.json();
        setDeptSuggestions(data.slice(0, 8));
        setShowDeptDropdown(data.length > 0);
      } catch {
        setDeptSuggestions([]);
      } finally {
        setLoadingDeptSuggestions(false);
      }
    }, 200);

    return () => {
      if (deptDebounceRef.current) clearTimeout(deptDebounceRef.current);
    };
  }, [department, selectedUniversity]);

  function handleSelectDepartment(name: string) {
    setDepartment(name);
    setDeptSuggestions([]);
    setShowDeptDropdown(false);
  }

  function handleSelect(name: string) {
    setQuery(name);
    setSelectedUniversity(name);
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError('Please select whether you are a student or a lecturer.');
      return;
    }

    const university = selectedUniversity || query.trim();
    if (!university) {
      setError('Please enter your university name.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          university: toTitleCase(university),
          department: department.trim() ? toTitleCase(department.trim()) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Something went wrong. Please try again.');
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = role !== null && (selectedUniversity.length > 0 || query.trim().length >= 4);

  const roles = [
    { key: 'student' as const, label: 'Student', description: 'I attend lectures', icon: BookOpen },
    { key: 'lecturer' as const, label: 'Lecturer', description: 'I host lectures', icon: GraduationCap },
  ];

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Image src="/images/grid-logo.jpeg" alt="Grid" width={120} height={40} priority />
        </div>

        <div className="rounded-2xl border border-border-1 bg-surface-1 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-text-1">Welcome to Grid</h1>
            <p className="mt-2 text-sm text-text-2 opacity-70">
              Let us personalise your experience. This only takes a moment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Role selection */}
            <div>
              <p className="mb-3 text-sm font-medium text-text-2">I am joining as a</p>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(({ key, label, description, icon: Icon }) => {
                  const selected = role === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRole(key)}
                      className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all duration-200 ${
                        selected
                          ? 'border-amber-1 bg-amber-5 text-amber-1'
                          : 'border-border-1 bg-surface-2 text-text-2 hover:border-border-2 hover:bg-surface-1'
                      }`}
                    >
                      <div className={`flex size-10 items-center justify-center rounded-xl ${selected ? 'bg-amber-1/20' : 'bg-surface-1'}`}>
                        <Icon size={22} className={selected ? 'text-amber-1' : 'text-text-2'} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs opacity-60 mt-0.5">{description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* University autocomplete */}
            <div ref={wrapperRef} className="relative">
              <label htmlFor="university" className="mb-2 block text-sm font-medium text-text-2">
                University
              </label>
              <div className="relative">
                <input
                  id="university"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                  placeholder="Start typing your university name…"
                  autoComplete="off"
                  className={`w-full rounded-xl border px-4 py-3 pr-10 text-sm bg-surface-2 outline-none transition-colors focus:ring-1 ${
                    selectedUniversity
                      ? 'border-amber-1 text-text-1 focus:ring-amber-1'
                      : 'border-border-1 text-text-1 placeholder:text-text-2 placeholder:opacity-40 focus:border-amber-1 focus:ring-amber-1'
                  }`}
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  {loadingSuggestions ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-amber-1 border-t-transparent block" />
                  ) : selectedUniversity ? (
                    <span className="text-amber-1 font-bold text-sm">✓</span>
                  ) : null}
                </div>
              </div>

              {showDropdown && (
                <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border-1 bg-surface-2 shadow-xl">
                  {suggestions.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => handleSelect(name)}
                        className="w-full px-4 py-3 text-left text-sm text-text-1 transition-colors hover:bg-amber-5 hover:text-amber-1"
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {query.trim().length > 0 && !selectedUniversity && !showDropdown && !loadingSuggestions && (
                <p className="mt-1.5 text-xs text-text-2 opacity-60">
                  Don&apos;t see your university? You can type the full name and continue.
                </p>
              )}
            </div>

            {/* Department autocomplete */}
            <div ref={deptWrapperRef} className="relative">
              <label htmlFor="department" className="mb-2 flex items-center justify-between text-sm font-medium text-text-2">
                Department
                <span className="text-xs font-normal opacity-50">Optional</span>
              </label>
              <div className="relative">
                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  onFocus={() => deptSuggestions.length > 0 && setShowDeptDropdown(true)}
                  placeholder="e.g. Computer Science, Medicine, Law…"
                  autoComplete="off"
                  className="w-full rounded-xl border border-border-1 bg-surface-2 px-4 py-3 pr-10 text-sm text-text-1 placeholder:text-text-2 placeholder:opacity-40 outline-none transition-colors focus:border-amber-1 focus:ring-1 focus:ring-amber-1"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  {loadingDeptSuggestions && (
                    <span className="size-4 animate-spin rounded-full border-2 border-amber-1 border-t-transparent block" />
                  )}
                </div>
              </div>

              {showDeptDropdown && deptSuggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border-1 bg-surface-2 shadow-xl">
                  {deptSuggestions.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => handleSelectDepartment(name)}
                        className="w-full px-4 py-3 text-left text-sm text-text-1 transition-colors hover:bg-amber-5 hover:text-amber-1"
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-1.5 text-xs text-text-2 opacity-50">
                If filled in, you will only see lectures for this department plus any
                university-wide lectures. Leave blank to see all lectures at your university.
              </p>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="mt-2 w-full rounded-xl bg-amber-1 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Saving…' : 'Continue to Grid'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-text-2 opacity-50">
          You can update your profile details later from your account settings.
        </p>
      </div>
    </main>
  );
}
