import { inngest } from './client';
import { supabaseAdmin } from '@/lib/supabase';
import { callOpenRouter, buildSummaryPrompt } from '@/lib/openrouter';

export const lectureSummary = inngest.createFunction(
  { id: 'lecture-summary', retries: 3 },
  { event: 'app/lecture.summarize' },
  async ({ event, step }) => {
    const { lecture_id, triggered_by } = event.data as { lecture_id: string; triggered_by: string };

    // Aggregate all transcript chunks from Supabase
    const transcriptText = await step.run('fetch-transcript', async () => {
      const { data, error } = await supabaseAdmin
        .from('transcripts')
        .select('text, timestamp_ms, speaker_id')
        .eq('lecture_id', lecture_id)
        .order('timestamp_ms', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No transcript found for this lecture');

      return data.map((t: { text: string }) => t.text).join(' ');
    });

    // Call OpenRouter for summary
    const summary = await step.run('generate-summary', async () => {
      return await callOpenRouter(
        buildSummaryPrompt(transcriptText),
        'mistralai/mistral-7b-instruct',
        1500
      );
    });

    // Persist summary to Supabase
    await step.run('save-summary', async () => {
      const { error } = await supabaseAdmin
        .from('lecture_summaries')
        .upsert({
          lecture_id,
          summary,
          generated_by: triggered_by,
          word_count: transcriptText.split(' ').length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'lecture_id' });

      if (error) throw error;
    });

    // Mark lecture as summarized
    await step.run('update-lecture-status', async () => {
      await supabaseAdmin
        .from('lectures')
        .update({ is_summarized: true, updated_at: new Date().toISOString() })
        .eq('id', lecture_id);
    });

    return { success: true, lecture_id, summary_length: summary.length };
  }
);
