'use client';

import { useEffect, useState } from 'react';
import { Users, BarChart2, Clock, Target } from 'lucide-react';

interface AttendanceRecord { user_id: string; joined_at: string; left_at?: string; duration_seconds?: number; }
interface Poll { id: string; votes: Record<string, number>; }
interface QuizResponse { is_correct: boolean; }
interface Quiz { id: string; quiz_responses: QuizResponse[]; }

export function EngagementDashboard({ lectureId }: { lectureId: string }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [attRes, pollRes, quizRes] = await Promise.all([
          fetch(`/api/attendance?lecture_id=${lectureId}`),
          fetch(`/api/polls?lecture_id=${lectureId}`),
          fetch(`/api/quizzes?lecture_id=${lectureId}`),
        ]);
        const [attData, pollData, quizData] = await Promise.all([attRes.json(), pollRes.json(), quizRes.json()]);
        setAttendance(attData.attendance ?? []);
        setPolls(pollData.polls ?? []);
        setQuizzes(quizData.quizzes ?? []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [lectureId]);

  const totalParticipants = attendance.length;
  const avgDuration = attendance.length > 0
    ? Math.round(attendance.reduce((s, a) => s + (a.duration_seconds ?? 0), 0) / attendance.length) : 0;
  const totalPollVotes = polls.reduce((sum, p) => sum + Object.values(p.votes).reduce((s, v) => s + v, 0), 0);
  const pollRate = totalParticipants > 0 ? Math.round((totalPollVotes / (polls.length * totalParticipants || 1)) * 100) : 0;
  const allResponses = quizzes.flatMap((q) => q.quiz_responses ?? []);
  const quizScore = allResponses.length > 0 ? Math.round((allResponses.filter((r) => r.is_correct).length / allResponses.length) * 100) : 0;

  const stats = [
    { label: 'Participants', value: totalParticipants, icon: Users },
    { label: 'Avg duration', value: avgDuration > 0 ? `${Math.floor(avgDuration / 60)}m` : '—', icon: Clock },
    { label: 'Poll participation', value: `${pollRate}%`, icon: BarChart2 },
    { label: 'Quiz avg score', value: `${quizScore}%`, icon: Target },
  ];

  if (loading) return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-surface-1 border border-border-1 animate-pulse" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-surface-1 border border-border-1 p-4">
            <stat.icon size={18} className="text-amber-1 mb-2" />
            <p className="text-2xl font-bold text-text-1">{stat.value}</p>
            <p className="text-xs text-text-3 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {attendance.length > 0 && (
        <div className="rounded-xl bg-surface-1 border border-border-1 p-4">
          <h3 className="mb-3 text-sm font-semibold text-amber-1">Attendance log</h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {attendance.map((a) => (
              <div key={a.user_id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                <span className="text-xs text-text-2 font-mono">{a.user_id.slice(0, 14)}...</span>
                <span className="text-xs text-text-3">{a.duration_seconds ? `${Math.floor(a.duration_seconds / 60)}m` : 'Active'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
