import { supabaseAdmin } from '@/lib/supabase';
import {
  Users, BookOpen, MessageSquare, Zap,
  GraduationCap, UserCheck, Building2, CalendarDays,
} from 'lucide-react';

export default async function AdminOverview() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalLecturers },
    { count: totalLectures },
    { count: lecturesToday },
    { count: totalFeedback },
    { count: pendingTraining },
    { data: universitiesData },
    { data: recentFeedback },
    { data: recentLectures },
    { data: recentUsers },
  ] = await Promise.all([
    supabaseAdmin.from('platform_users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('platform_users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabaseAdmin.from('platform_users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer'),
    supabaseAdmin.from('lectures').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('lectures').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
    supabaseAdmin.from('feedback').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('training_queue').select('id', { count: 'exact', head: true }).is('corrected_intent', null),
    supabaseAdmin.from('platform_users').select('university'),
    supabaseAdmin.from('feedback').select('*').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('lectures').select('id, title, lecturer_id, created_at').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('platform_users').select('id, full_name, role, university, created_at').order('created_at', { ascending: false }).limit(6),
  ]);

  // Count distinct universities
  const activeUniversities = new Set(
    (universitiesData ?? []).map((u: { university: string }) => u.university?.toLowerCase().trim()).filter(Boolean)
  ).size;

  const topStats = [
    { label: 'Total registered users', value: totalUsers ?? 0,        icon: Users,         color: 'text-amber-1' },
    { label: 'Students',               value: totalStudents ?? 0,      icon: BookOpen,      color: 'text-sky-400' },
    { label: 'Lecturers',              value: totalLecturers ?? 0,     icon: GraduationCap, color: 'text-purple-400' },
    { label: 'Universities',           value: activeUniversities,      icon: Building2,     color: 'text-emerald-400' },
  ];

  const bottomStats = [
    { label: 'Total lectures',         value: totalLectures ?? 0,     icon: BookOpen,      color: 'text-amber-1' },
    { label: 'Lectures today',         value: lecturesToday ?? 0,     icon: CalendarDays,  color: 'text-sky-400' },
    { label: 'Feedback items',         value: totalFeedback ?? 0,     icon: MessageSquare, color: 'text-purple-400' },
    { label: 'AI training queue',      value: pendingTraining ?? 0,   icon: Zap,           color: 'text-emerald-400' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-1">Platform overview</h1>
        <p className="text-xs text-text-2 opacity-60">
          {new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date())}
        </p>
      </div>

      {/* Users stats */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-1 opacity-70">Users</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {topStats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border-1 bg-surface-1 p-5 flex flex-col gap-3">
              <div className={`flex size-9 items-center justify-center rounded-lg bg-surface-2 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-3xl font-bold text-text-1 tabular-nums">{s.value.toLocaleString()}</p>
                <p className="text-xs text-text-2 opacity-60 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity stats */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-1 opacity-70">Activity</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {bottomStats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border-1 bg-surface-1 p-5 flex flex-col gap-3">
              <div className={`flex size-9 items-center justify-center rounded-lg bg-surface-2 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-3xl font-bold text-text-1 tabular-nums">{s.value.toLocaleString()}</p>
                <p className="text-xs text-text-2 opacity-60 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent users */}
        <div className="rounded-xl border border-border-1 bg-surface-1 p-5">
          <h2 className="mb-4 text-sm font-semibold text-amber-1 flex items-center gap-2">
            <UserCheck size={14} /> Recent sign-ups
          </h2>
          {!recentUsers?.length
            ? <p className="text-sm text-text-2 opacity-50">No users yet.</p>
            : (recentUsers as { id: string; full_name: string; role: string; university: string; created_at: string }[]).map((u) => (
              <div key={u.id} className="mb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-1 truncate">{u.full_name || 'Unknown'}</p>
                  <p className="text-xs text-text-2 opacity-50 truncate">{u.university}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  u.role === 'lecturer'
                    ? 'bg-amber-5 text-amber-1'
                    : 'bg-surface-2 text-text-2'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
        </div>

        {/* Recent feedback */}
        <div className="rounded-xl border border-border-1 bg-surface-1 p-5">
          <h2 className="mb-4 text-sm font-semibold text-amber-1 flex items-center gap-2">
            <MessageSquare size={14} /> Recent feedback
          </h2>
          {!recentFeedback?.length
            ? <p className="text-sm text-text-2 opacity-50">No feedback yet.</p>
            : (recentFeedback as { id: string; category: string; rating: number; subject: string; created_at: string }[]).map((f) => (
              <div key={f.id} className="mb-3 rounded-lg border border-border-1 bg-surface-2 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-amber-1 capitalize">{f.category}</span>
                  <span className="text-xs text-text-2 opacity-60">{'★'.repeat(f.rating)}</span>
                </div>
                <p className="text-sm text-text-1">{f.subject}</p>
                <p className="text-xs text-text-2 opacity-40 mt-1">{new Date(f.created_at).toLocaleDateString()}</p>
              </div>
            ))}
        </div>

        {/* Recent lectures */}
        <div className="rounded-xl border border-border-1 bg-surface-1 p-5">
          <h2 className="mb-4 text-sm font-semibold text-amber-1 flex items-center gap-2">
            <BookOpen size={14} /> Recent lectures
          </h2>
          {!recentLectures?.length
            ? <p className="text-sm text-text-2 opacity-50">No lectures yet.</p>
            : (recentLectures as { id: string; title: string; lecturer_id: string; created_at: string }[]).map((l) => (
              <div key={l.id} className="mb-3 rounded-lg border border-border-1 bg-surface-2 p-3">
                <p className="text-sm font-medium text-text-1">{l.title}</p>
                <p className="text-xs text-text-2 opacity-40 font-mono mt-1">{l.lecturer_id.slice(0, 16)}…</p>
                <p className="text-xs text-text-2 opacity-40">{new Date(l.created_at).toLocaleDateString()}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
