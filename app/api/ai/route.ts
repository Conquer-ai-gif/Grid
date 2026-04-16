import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { callOpenRouter, buildQAPrompt } from '@/lib/openrouter';
import { checkRateLimit, aiRatelimit } from '@/lib/ratelimit';
import { inngest } from '@/inngest/client';

const qaSchema = z.object({
  question: z.string().min(3).max(500),
  lecture_id: z.string().uuid(),
});

const summarizeSchema = z.object({
  lecture_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await checkRateLimit(aiRatelimit, user.id);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const action = req.nextUrl.searchParams.get('action');
    const body = await req.json();

    if (action === 'qa') {
      const parsed = qaSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

      const { question, lecture_id } = parsed.data;

      const { data: chunks } = await supabaseAdmin
        .from('transcripts')
        .select('text')
        .eq('lecture_id', lecture_id)
        .order('timestamp_ms', { ascending: true })
        .limit(20);

      const context = chunks?.map((c: { text: string }) => c.text).join(' ') ?? '';

      if (!context) return NextResponse.json({ answer: 'No transcript available for this lecture yet.' });

      const answer = await callOpenRouter(buildQAPrompt(question, context), undefined, 600);
      return NextResponse.json({ answer });
    }

    if (action === 'summarize') {
      const parsed = summarizeSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

      // Only lecture creator can trigger summarization
      const { data: lecture } = await supabaseAdmin
        .from('lectures')
        .select('lecturer_id')
        .eq('id', parsed.data.lecture_id)
        .single();

      if (lecture?.lecturer_id !== user.id) {
        return NextResponse.json({ error: 'Only the lecture creator can trigger summarization' }, { status: 403 });
      }

      await inngest.send({
        name: 'app/lecture.summarize',
        data: { lecture_id: parsed.data.lecture_id, triggered_by: user.id },
      });

      return NextResponse.json({ success: true, message: 'Summarization triggered' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/ai]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lectureId = req.nextUrl.searchParams.get('lecture_id');
    if (!lectureId) return NextResponse.json({ error: 'lecture_id required' }, { status: 400 });

    const { data } = await supabaseAdmin
      .from('lecture_summaries')
      .select('*')
      .eq('lecture_id', lectureId)
      .single();

    return NextResponse.json({ summary: data ?? null });
  } catch {
    return NextResponse.json({ summary: null });
  }
}
