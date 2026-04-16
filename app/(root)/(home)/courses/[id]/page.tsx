import { currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { BookOpen, Code2, Layers, ChevronLeft, CalendarDays } from 'lucide-react';

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  stream_call_id: string;
  created_at: string;
}

interface Course {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  university: string | null;
  department: string | null;
  created_at: string;
  lectures: Lecture[];
}

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select('*, lectures(id, title, description, stream_call_id, created_at)')
    .eq('id', params.id)
    .single();

  if (error || !course) notFound();

  const typedCourse = course as Course;

  return (
    <section className="flex size-full flex-col gap-6 text-text-1">
      {/* Back + header */}
      <div>
        <Link
          href="/courses"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-3 hover:text-amber-1 transition-colors"
        >
          <ChevronLeft size={15} /> All Courses
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-1 border border-border-1">
            <BookOpen size={22} className="text-amber-1" />
          </div>
          <div>
            {typedCourse.code && (
              <div className="mb-1 flex items-center gap-1.5">
                <Code2 size={12} className="text-amber-1" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-1">{typedCourse.code}</span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-text-1">{typedCourse.name}</h1>
            {typedCourse.description && (
              <p className="mt-1 text-sm text-text-2 opacity-70 max-w-xl">{typedCourse.description}</p>
            )}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {typedCourse.department && (
                <span className="rounded-full border border-border-1 bg-surface-1 px-2.5 py-0.5 text-xs text-text-3">
                  {typedCourse.department}
                </span>
              )}
              {typedCourse.university && (
                <span className="rounded-full border border-border-1 bg-surface-1 px-2.5 py-0.5 text-xs text-text-3">
                  {typedCourse.university}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lectures */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Layers size={16} className="text-amber-1" />
          <h2 className="text-base font-semibold text-text-1">
            Lectures <span className="ml-1 text-sm font-normal text-text-3">({typedCourse.lectures?.length ?? 0})</span>
          </h2>
        </div>

        {!typedCourse.lectures || typedCourse.lectures.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border-1 bg-surface-1 py-16 gap-3">
            <Layers size={28} className="text-text-3 opacity-50" />
            <p className="text-sm text-text-3">No lectures assigned to this course yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {typedCourse.lectures.map((lecture: Lecture) => (
              <div
                key={lecture.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border-1 bg-surface-1 p-4 hover:border-amber-1 transition-all"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-1 truncate">{lecture.title}</p>
                  {lecture.description && (
                    <p className="text-xs text-text-3 mt-0.5 line-clamp-1">{lecture.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-3">
                    <CalendarDays size={11} />
                    {new Date(lecture.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                </div>
                <Link
                  href={`/replay?lecture_id=${lecture.id}`}
                  className="shrink-0 rounded-xl border border-border-1 px-3 py-1.5 text-xs font-medium text-text-2 hover:border-amber-1 hover:text-amber-1 transition-all"
                >
                  Replay
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
