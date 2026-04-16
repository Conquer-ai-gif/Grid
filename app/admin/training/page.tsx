import { supabaseAdmin } from '@/lib/supabase';

export default async function AdminTraining() {
  const { data: queue } = await supabaseAdmin.from('training_queue').select('*').is('corrected_intent', null).order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-1">AI Training Queue</h1>
        <p className="text-sm text-text-3 mt-1">Low-confidence intents that need correction before retraining Wit.ai.</p>
      </div>
      <div className="rounded-xl border border-border-1 bg-surface-1 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border-1 bg-surface-2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Text</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Raw intent</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Confidence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-amber-1">Date</th>
            </tr>
          </thead>
          <tbody>
            {!queue?.length ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-text-3">Queue is empty</td></tr>
            ) : queue.map((item: { id: string; text: string; raw_intent: string; confidence: number; created_at: string }) => (
              <tr key={item.id} className="border-b border-border-1 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3 text-text-2 max-w-[240px] truncate">{item.text}</td>
                <td className="px-4 py-3 text-text-3 font-mono text-xs">{item.raw_intent}</td>
                <td className="px-4 py-3"><span className="text-xs font-semibold text-red-400">{(item.confidence * 100).toFixed(0)}%</span></td>
                <td className="px-4 py-3 text-xs text-text-3">{new Date(item.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
