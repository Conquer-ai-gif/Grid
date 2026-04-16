import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { callOpenRouter, buildQuizPrompt } from '@/lib/openrouter';
import { checkRateLimit, aiRatelimit } from '@/lib/ratelimit';

const createQuizSchema = z.object({
  lecture_id: z.string().uuid(),
  topic: z.string().min(2).max(200),
  time_limit_seconds: z.number().int().min(10).max(300).default(30),
  auto_generate: z.boolean().default(true),
});

async function isLecturerForLecture(userId: string, lectureId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('lectures')
    .select('lecturer_id')
    .eq('id', lectureId)
    .single();
  return data?.lecturer_id === userId;
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await checkRateLimit(aiRatelimit, user.id);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const body = await req.json();
    const parsed = createQuizSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { lecture_id, topic, time_limit_seconds, auto_generate } = parsed.data;

    // Only lecture creator can create quizzes
    const lecturer = await isLecturerForLecture(user.id, lecture_id);
    if (!lecturer) return NextResponse.json({ error: 'Only the lecture creator can create quizzes' }, { status: 403 });

    let question = topic;
    let options = ['True', 'False', 'Not sure', 'None of the above'];
    let correct_answer = 0;

    if (auto_generate) {
      const { data: transcriptData } = await supabaseAdmin
        .from('transcripts')
        .select('text')
        .eq('lecture_id', lecture_id)
        .order('created_at', { ascending: false })
        .limit(5);

      const context = transcriptData?.map((t: { text: string }) => t.text).join(' ') ?? topic;
      const raw = await callOpenRouter(buildQuizPrompt(topic, context), undefined, 300);

      try {
        const parsed = JSON.parse(raw);
        question = parsed.question;
        options = parsed.options;
        correct_answer = parsed.correct_answer;
      } catch {
        // fallback values already set above
      }
    }

    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .insert({ lecture_id, question, options, correct_answer, time_limit_seconds, created_by: user.id, created_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ quiz: data });
  } catch (err) {
    console.error('[POST /api/quizzes]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lectureId = req.nextUrl.searchParams.get('lecture_id');
    if (!lectureId) return NextResponse.json({ error: 'lecture_id required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .select('*, quiz_responses(id, user_id, is_correct)')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ quizzes: data });
  } catch (err) {
    console.error('[GET /api/quizzes]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
