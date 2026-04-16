import { inngest } from './client';
import { supabaseAdmin } from '@/lib/supabase';
import { callOpenRouter, buildQuizPrompt, buildHomeworkPrompt } from '@/lib/openrouter';
import { IntentName, WitIntent } from '@/types';

export const handleIntent = inngest.createFunction(
  {
    id: 'handle-intent',
    retries: 3,
    idempotency: 'event.data.lecture_id + "-" + event.data.intent + "-" + event.ts',
  },
  { event: 'app/intent.received' },
  async ({ event, step }) => {
    const { intent, confidence, text, lecture_id, user_id } = event.data as WitIntent;

    // Log all intents to Supabase
    await step.run('log-intent', async () => {
      await supabaseAdmin.from('intent_log').insert({
        lecture_id,
        user_id,
        intent,
        confidence,
        text,
        created_at: new Date().toISOString(),
      });
    });

    // Low confidence → training queue
    if (confidence < 0.7) {
      await step.run('queue-for-training', async () => {
        await supabaseAdmin.from('training_queue').insert({
          text,
          raw_intent: intent,
          confidence,
          created_at: new Date().toISOString(),
        });
      });
      return { routed: false, reason: 'low_confidence', confidence };
    }

    // Route by intent
    switch (intent as IntentName) {
      case 'start_recording': {
        await step.run('trigger-recording', async () => {
          await supabaseAdmin.from('lecture_events').insert({
            lecture_id,
            event_type: 'recording_started',
            triggered_by: user_id,
            created_at: new Date().toISOString(),
          });
        });
        return { routed: true, action: 'recording_started' };
      }

      case 'show_poll': {
        // Extract poll question from text via AI
        const pollQuestion = await step.run('generate-poll-question', async () => {
          const q = await callOpenRouter([
            { role: 'system', content: 'Extract or generate a short poll question from this lecturer speech. Return ONLY the question text, nothing else.' },
            { role: 'user', content: text },
          ], 'mistralai/mistral-7b-instruct', 100);
          return q.trim();
        });

        const poll = await step.run('create-poll', async () => {
          const { data, error } = await supabaseAdmin
            .from('polls')
            .insert({
              lecture_id,
              question: pollQuestion,
              options: ['Yes', 'No', 'Maybe', 'Not sure'],
              votes: {},
              created_by: user_id,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (error) throw error;
          return data;
        });

        return { routed: true, action: 'poll_created', poll_id: poll.id };
      }

      case 'create_quiz': {
        // Get recent transcript for context
        const transcriptChunk = await step.run('fetch-transcript-chunk', async () => {
          const { data } = await supabaseAdmin
            .from('transcripts')
            .select('text')
            .eq('lecture_id', lecture_id)
            .order('created_at', { ascending: false })
            .limit(5);
          return data?.map((t: { text: string }) => t.text).join(' ') ?? text;
        });

        const quizJson = await step.run('generate-quiz', async () => {
          const raw = await callOpenRouter(
            buildQuizPrompt(text, transcriptChunk),
            'mistralai/mistral-7b-instruct',
            300
          );
          try {
            return JSON.parse(raw);
          } catch {
            return { question: text, options: ['A', 'B', 'C', 'D'], correct_answer: 0 };
          }
        });

        const quiz = await step.run('save-quiz', async () => {
          const { data, error } = await supabaseAdmin
            .from('quizzes')
            .insert({
              lecture_id,
              question: quizJson.question,
              options: quizJson.options,
              correct_answer: quizJson.correct_answer,
              time_limit_seconds: 30,
              created_by: user_id,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (error) throw error;
          return data;
        });

        return { routed: true, action: 'quiz_created', quiz_id: quiz.id };
      }

      case 'assign_homework': {
        const homework = await step.run('generate-homework', async () => {
          return await callOpenRouter(
            buildHomeworkPrompt(text),
            'mistralai/mistral-7b-instruct',
            500
          );
        });

        await step.run('save-homework', async () => {
          await supabaseAdmin.from('assignments').insert({
            lecture_id,
            content: homework,
            created_by: user_id,
            created_at: new Date().toISOString(),
          });
        });

        return { routed: true, action: 'homework_created' };
      }

      case 'summarize_lecture': {
        await step.sendEvent('trigger-summary', {
          name: 'app/lecture.summarize',
          data: { lecture_id, triggered_by: user_id },
        });
        return { routed: true, action: 'summary_triggered' };
      }

      case 'mute_all': {
        await step.run('log-mute-event', async () => {
          await supabaseAdmin.from('lecture_events').insert({
            lecture_id,
            event_type: 'mute_all',
            triggered_by: user_id,
            created_at: new Date().toISOString(),
          });
        });
        return { routed: true, action: 'mute_all_logged' };
      }

      default:
        return { routed: false, reason: 'unknown_intent' };
    }
  }
);
