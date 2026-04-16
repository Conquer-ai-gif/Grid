import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, pollRatelimit } from '@/lib/ratelimit';

const createPollSchema = z.object({
  lecture_id: z.string().uuid(),
  question: z.string().min(3).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(6),
});

// Server-side helper: check if user is lecturer for a given lecture UUID
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

    const { success } = await checkRateLimit(pollRatelimit, user.id);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const body = await req.json();
    const parsed = createPollSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { lecture_id, question, options } = parsed.data;

    // Enforce: only the lecture creator can create polls
    const lecturer = await isLecturerForLecture(user.id, lecture_id);
    if (!lecturer) return NextResponse.json({ error: 'Only the lecture creator can create polls' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('polls')
      .insert({
        lecture_id,
        question,
        options,
        votes: {},
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ poll: data });
  } catch (err) {
    console.error('[POST /api/polls]', err);
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
      .from('polls')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ polls: data });
  } catch (err) {
    console.error('[GET /api/polls]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
