'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Code2, Layers, Users } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import Loader from '@/components/Loader';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { EnrollButton } from '@/components/courses/EnrollButton';

interface Course {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  university: string | null;
  department: string | null;
  lectures?: { id: string }[];
}

export default function CoursesPage() {
  const { role, isLoaded } = useUserRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  if (!isLoaded || loading) return <Loader />;

  return (
    <section className="flex size-full flex-col gap-6 text-text-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-1">Courses</h1>
          <p className="mt-1 text-sm text-text-2 opacity-70">
            {role === 'lecturer' ? 'Courses you have created' : 'Courses available at your university'}
          </p>
        </div>
        {role === 'lecturer' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-1 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-all"
          >
            <Plus size={16} /> New Course
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-1 bg-surface-1 py-20 gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-surface-2 border border-border-1">
            <BookOpen size={28} className="text-text-3" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-text-2">No courses yet</p>
            <p className="mt-1 text-sm text-text-3">
              {role === 'lecturer'
                ? 'Create your first course to start organising your lectures.'
                : 'No courses have been created for your university yet.'}
            </p>
          </div>
          {role === 'lecturer' && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 flex items-center gap-2 rounded-xl bg-amber-1 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-all"
            >
              <Plus size={15} /> Create first course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group flex flex-col gap-4 rounded-2xl border border-border-1 bg-surface-1 p-5 transition-all hover:border-amber-1 hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-border-1 group-hover:border-amber-1 transition-all">
                  <BookOpen size={18} className="text-amber-1" />
                </div>
                <div className="flex-1 min-w-0">
                  {course.code && (
                    <div className="mb-1 flex items-center gap-1.5">
                      <Code2 size={11} className="text-amber-1 shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-1">{course.code}</span>
                    </div>
                  )}
                  <h2 className="text-sm font-bold text-text-1 leading-snug line-clamp-2">{course.name}</h2>
                  {course.description && (
                    <p className="mt-1.5 text-xs text-text-3 line-clamp-2 leading-relaxed">{course.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-1 pt-3">
                <div className="flex items-center gap-1.5 text-xs text-text-3">
                  <Layers size={12} />
                  {course.lectures?.length ?? 0} lecture{(course.lectures?.length ?? 0) !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  {course.department && (
                    <span className="rounded-full border border-border-1 bg-surface-2 px-2.5 py-0.5 text-xs text-text-3">
                      {course.department}
                    </span>
                  )}
                  {role === 'student' && <EnrollButton courseId={course.id} />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreated={(course) => {
            setCourses((prev) => [course, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </section>
  );
}
