'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserRole } from '@/hooks/useUserRole';
import { GraduationCap, BookOpen, CheckCircle2, Building2, LayoutGrid } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { role, university, department: currentDepartment } = useUserRole();
  const { toast } = useToast();
  const router = useRouter();

  const [department, setDepartment] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill with current department
  useEffect(() => {
    if (isLoaded) setDepartment(currentDepartment ?? '');
  }, [isLoaded, currentDepartment]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch department suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = department.trim();

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (university) params.set('university', university);
        const res = await fetch(`/api/departments?${params.toString()}`);
        const data: string[] = await res.json();
        setSuggestions(data.slice(0, 8));
        setShowDropdown(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [department, university]);

  function selectDepartment(name: string) {
    setDepartment(name);
    setSuggestions([]);
    setShowDropdown(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: department.trim() || null }),
      });

      if (!res.ok) throw new Error('Failed to save');

      // Refresh Clerk session so the new department appears immediately
      await user?.reload();

      setSaved(true);
      toast({ title: 'Department updated successfully' });
      setTimeout(() => {
        setSaved(false);
        router.refresh();
      }, 1500);
    } catch {
      toast({ title: 'Could not save changes. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-amber-1 border-t-transparent" />
      </div>
    );
  }

  const hasChanged = (department.trim() || null) !== (currentDepartment || null);

  return (
    <section className="flex flex-col gap-10 text-text-1">
      <div>
        <h1 className="text-3xl font-bold text-text-1">Settings</h1>
        <p className="mt-1 text-sm text-text-2 opacity-70">
          Manage your profile preferences.
        </p>
      </div>

      {/* Read-only profile info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-border-1 bg-surface-1 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
            {role === 'lecturer'
              ? <GraduationCap size={20} className="text-amber-1" />
              : <BookOpen size={20} className="text-text-2" />}
          </div>
          <div>
            <p className="text-xs text-text-2 opacity-60">Role</p>
            <p className="text-sm font-semibold capitalize text-text-1">{role ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border-1 bg-surface-1 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
            <Building2 size={20} className="text-text-2" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-2 opacity-60">University</p>
            <p className="truncate text-sm font-semibold text-text-1">{university || '—'}</p>
          </div>
        </div>
      </div>

      {/* Editable: Department */}
      <form onSubmit={handleSave} className="flex flex-col gap-6 rounded-xl border border-border-1 bg-surface-1 p-6">
        <div className="flex items-center gap-3 border-b border-border-1 pb-4">
          <LayoutGrid size={18} className="text-amber-1" />
          <h2 className="text-base font-semibold text-text-1">Department</h2>
        </div>

        <p className="text-sm text-text-2 opacity-70">
          Your department controls which lectures are shown to you. Lectures tagged to your
          department will appear alongside any university-wide lectures. If you leave this blank,
          you will see all lectures at your university.
        </p>

        <div ref={wrapperRef} className="relative">
          <label htmlFor="department" className="mb-2 flex items-center justify-between text-sm font-medium text-text-2">
            Department
            <span className="text-xs font-normal opacity-50">Optional</span>
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setSaved(false); }}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="e.g. Computer Science, Medicine, Law…"
            autoComplete="off"
            className="w-full rounded-xl border border-border-1 bg-surface-2 px-4 py-3 text-sm text-text-1 placeholder:text-text-2 placeholder:opacity-40 outline-none transition-colors focus:border-amber-1 focus:ring-1 focus:ring-amber-1"
          />

          {showDropdown && (
            <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border-1 bg-surface-2 shadow-xl">
              {suggestions.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => selectDepartment(name)}
                    className="w-full px-4 py-3 text-left text-sm text-text-1 transition-colors hover:bg-amber-5 hover:text-amber-1"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {loadingSuggestions && (
            <div className="absolute right-3 top-[42px]">
              <span className="size-4 animate-spin rounded-full border-2 border-amber-1 border-t-transparent block" />
            </div>
          )}
        </div>

        {department.trim() === '' && (
          <p className="rounded-lg border border-border-1 bg-surface-2 px-4 py-2.5 text-xs text-text-2 opacity-70">
            With no department set you will see all lectures at {university || 'your university'}.
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !hasChanged}
            className="rounded-xl bg-amber-1 px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <CheckCircle2 size={16} />
              Saved
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
