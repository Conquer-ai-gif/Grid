'use client';

import { useState, useEffect } from 'react';
import { UserCheck, UserMinus, Loader2 } from 'lucide-react';

interface Props {
  courseId: string;
}

export function EnrollButton({ courseId }: Props) {
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    fetch(`/api/enrollments?course_id=${courseId}`)
      .then((r) => r.json())
      .then((d) => setEnrolled(d.enrolled ?? false))
      .catch(() => setEnrolled(false))
      .finally(() => setLoading(false));
  }, [courseId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (working) return;
    setWorking(true);
    try {
      if (enrolled) {
        await fetch(`/api/enrollments?course_id=${courseId}`, { method: 'DELETE' });
        setEnrolled(false);
      } else {
        const res = await fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: courseId }),
        });
        if (res.ok) setEnrolled(true);
      }
    } catch {
    } finally {
      setWorking(false);
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={working}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
        enrolled
          ? 'border border-border-1 bg-surface-2 text-text-2 hover:border-red-400 hover:text-red-400'
          : 'bg-amber-1 text-black hover:bg-amber-400'
      }`}
    >
      {working ? (
        <Loader2 size={12} className="animate-spin" />
      ) : enrolled ? (
        <UserMinus size={12} />
      ) : (
        <UserCheck size={12} />
      )}
      {enrolled ? 'Leave' : 'Enroll'}
    </button>
  );
}
