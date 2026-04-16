import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const respondSchema = z.object({
  quiz_id: z.string().uuid(),
  answer_index: z.number().int().min(0).max(5),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { quiz_id, answer_index } = parsed.data;

    // Get quiz to check correct answer
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('correct_answer')
      .eq('id', quiz_id)
      .single();

    if (quizError || !quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    const is_correct = answer_index === quiz.correct_answer;

    // Upsert to prevent duplicate responses
    const { error } = await supabaseAdmin
      .from('quiz_responses')
      .upsert(
        {
          quiz_id,
          user_id: user.id,
          answer_index,
          is_correct,
          responded_at: new Date().toISOString(),
        },
        { onConflict: 'quiz_id,user_id' }
      );

    if (error) throw error;
    return NextResponse.json({ success: true, is_correct });
  } catch (err) {
    console.error('[POST /api/quizzes/respond]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
