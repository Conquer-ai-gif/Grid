import { supabaseAdmin } from '@/lib/supabase';

export default async function AdminFeedback() {
  const { data: feedback } = await supabaseAdmin.from('feedback').select('*').order('created_at', { ascending: false });
  const cats = ['bug', 'feature', 'experience', 'lecture'];
  const counts = cats.reduce((acc, cat) => ({ ...acc, [cat]: feedback?.filter((f: { category: string }) => f.category === cat).length ?? 0 }), {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-1">Feedback</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cats.map((cat) => (
          <div key={cat} className="rounded-xl border border-border-1 bg-surface-1 p-4">
            <p className="text-xl font-bold text-text-1">{counts[cat]}</p>
            <p className="text-xs text-text-3 capitalize mt-1">{cat}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border-1 bg-surface-1 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border-1 bg-surface-2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Rating</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Date</th>
            </tr>
          </thead>
          <tbody>
            {!feedback?.length ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-text-3">No feedback yet</td></tr>
            ) : feedback.map((f: { id: string; category: string; rating: number; subject: string; details: string; created_at: string }) => (
              <tr key={f.id} className="border-b border-border-1 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3"><span className="rounded-full border border-amber-1 bg-amber-5 px-2 py-0.5 text-xs font-semibold text-amber-1 capitalize">{f.category}</span></td>
                <td className="px-4 py-3 text-amber-1 text-xs">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</td>
                <td className="px-4 py-3"><p className="text-text-2 font-medium">{f.subject}</p><p className="text-text-3 text-xs mt-0.5 line-clamp-1">{f.details}</p></td>
                <td className="px-4 py-3 text-xs text-text-3">{new Date(f.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
