'use client';

import { useState } from 'react';
import { X, BookOpen, Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/components/ui/use-toast';

interface Course {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  university: string | null;
  department: string | null;
  lectures?: { id: string }[];
}

interface Props {
  onClose: () => void;
  onCreated: (course: Course) => void;
}

export function CreateCourseModal({ onClose, onCreated }: Props) {
  const { department: lecturerDept } = useUserRole();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState(lecturerDept ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          department: department.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create course');
      const { course } = await res.json();
      onCreated(course);
      toast({ title: 'Course created successfully' });
    } catch {
      toast({ title: 'Failed to create course. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border-1 bg-surface-1 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-1 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-amber-1" />
            <h2 className="text-base font-bold text-text-1">Create New Course</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-text-3 hover:text-text-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-2">Course Name <span className="text-amber-1">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Introduction to Programming"
              required
              className="w-full rounded-xl border border-border-1 bg-surface-2 px-4 py-2.5 text-sm text-text-1 placeholder:text-text-3 outline-none focus:border-amber-1 focus:ring-1 focus:ring-amber-1 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-2">
                Course Code <span className="text-xs font-normal opacity-50">Optional</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS101"
                className="w-full rounded-xl border border-border-1 bg-surface-2 px-4 py-2.5 text-sm text-text-1 placeholder:text-text-3 outline-none focus:border-amber-1 focus:ring-1 focus:ring-amber-1 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-2">
                Department <span className="text-xs font-normal opacity-50">Optional</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full rounded-xl border border-border-1 bg-surface-2 px-4 py-2.5 text-sm text-text-1 placeholder:text-text-3 outline-none focus:border-amber-1 focus:ring-1 focus:ring-amber-1 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-2">
              Description <span className="text-xs font-normal opacity-50">Optional</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of what this course covers…"
              rows={3}
              className="w-full rounded-xl border border-border-1 bg-surface-2 px-4 py-2.5 text-sm text-text-1 placeholder:text-text-3 outline-none focus:border-amber-1 focus:ring-1 focus:ring-amber-1 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border-1 py-2.5 text-sm font-medium text-text-2 hover:border-border-2 hover:text-text-1 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-1 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
