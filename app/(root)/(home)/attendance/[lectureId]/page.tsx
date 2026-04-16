'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Users, Clock, LogIn, LogOut } from 'lucide-react';
import Loader from '@/components/Loader';

interface AttendanceRecord {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  joined_at: string;
  left_at: string | null;
  duration_seconds: number | null;
}

interface Lecture {
  title: string;
  lecturer_id: string;
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function exportCSV(lecture: Lecture, records: AttendanceRecord[]) {
  const header = 'Name,Email,Joined At,Left At,Duration\n';
  const rows = records
    .map((r) =>
      [
        `"${r.full_name}"`,
        `"${r.email}"`,
        `"${r.joined_at ? new Date(r.joined_at).toLocaleString() : ''}"`,
        `"${r.left_at ? new Date(r.left_at).toLocaleString() : ''}"`,
        `"${formatDuration(r.duration_seconds)}"`,
      ].join(',')
    )
    .join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-${lecture.title.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AttendanceReportPage() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const router = useRouter();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/attendance/report?lecture_id=${lectureId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setLecture(d.lecture);
        setRecords(d.records ?? []);
      })
      .catch(() => setError('Failed to load attendance report'))
      .finally(() => setLoading(false));
  }, [lectureId]);

  if (loading) return <Loader />;

  if (error) {
    return (
      <section className="flex size-full flex-col items-center justify-center gap-4 text-text-1">
        <p className="text-base text-red-400">{error}</p>
        <button onClick={() => router.back()} className="text-sm text-amber-1 hover:underline">
          Go back
        </button>
      </section>
    );
  }

  return (
    <section className="flex size-full flex-col gap-6 text-text-1">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex size-9 items-center justify-center rounded-xl border border-border-1 bg-surface-1 text-text-2 hover:border-amber-1 hover:text-amber-1 transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-text-1 truncate">
            Attendance — {lecture?.title ?? 'Lecture'}
          </h1>
          <p className="text-sm text-text-3 mt-0.5">{records.length} student{records.length !== 1 ? 's' : ''} attended</p>
        </div>
        {records.length > 0 && (
          <button
            onClick={() => exportCSV(lecture!, records)}
            className="flex items-center gap-2 rounded-xl bg-amber-1 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-all"
          >
            <Download size={15} />
            Export CSV
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-1 bg-surface-1 py-20 gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-2 border border-border-1">
            <Users size={24} className="text-text-3" />
          </div>
          <p className="text-base font-semibold text-text-2">No attendance recorded</p>
          <p className="text-sm text-text-3">No students joined this lecture yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-1 bg-surface-1 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-1 bg-surface-2 text-left text-xs text-text-3 uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="flex items-center gap-1.5"><LogIn size={12} /> Joined</span>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <span className="flex items-center gap-1.5"><LogOut size={12} /> Left</span>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <span className="flex items-center gap-1.5"><Clock size={12} /> Duration</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-1">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-1">{r.full_name}</p>
                    <p className="text-xs text-text-3 mt-0.5">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-text-2">
                    {r.joined_at ? new Date(r.joined_at).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-2">
                    {r.left_at ? new Date(r.left_at).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-5 px-2.5 py-0.5 text-xs font-semibold text-amber-1">
                      {formatDuration(r.duration_seconds)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
