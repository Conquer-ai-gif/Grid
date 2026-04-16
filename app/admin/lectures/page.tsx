import { supabaseAdmin } from '@/lib/supabase';

export default async function AdminLectures() {
  const { data: lectures } = await supabaseAdmin.from('lectures').select('*, courses(name, code)').order('created_at', { ascending: false }).limit(50);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-1">All Lectures</h1>
      <div className="rounded-xl border border-border-1 bg-surface-1 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border-1 bg-surface-2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Course</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Summarized</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Created</th>
            </tr>
          </thead>
          <tbody>
            {!lectures?.length ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-text-3">No lectures yet</td></tr>
            ) : lectures.map((l: { id: string; title: string; courses?: { name: string; code: string } | null; is_summarized: boolean; created_at: string }) => (
              <tr key={l.id} className="border-b border-border-1 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3 text-text-2 font-medium">{l.title}</td>
                <td className="px-4 py-3 text-text-3 text-xs">{l.courses ? `${l.courses.code} — ${l.courses.name}` : '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold ${l.is_summarized ? 'text-amber-1' : 'text-text-3'}`}>{l.is_summarized ? 'Yes' : 'No'}</span></td>
                <td className="px-4 py-3 text-xs text-text-3">{new Date(l.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
