import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const voteSchema = z.object({
  poll_id: z.string().uuid(),
  option_index: z.number().int().min(0).max(5),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { poll_id, option_index } = parsed.data;

    // Prevent duplicate votes
    const { error: voteError } = await supabaseAdmin
      .from('poll_votes')
      .upsert(
        { poll_id, user_id: user.id, option_index, created_at: new Date().toISOString() },
        { onConflict: 'poll_id,user_id' }
      );

    if (voteError) throw voteError;

    // Recalculate votes server-side
    const { data: allVotes } = await supabaseAdmin
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', poll_id);

    const votes: Record<string, number> = {};
    allVotes?.forEach((v: { option_index: number }) => {
      const key = String(v.option_index);
      votes[key] = (votes[key] ?? 0) + 1;
    });

    await supabaseAdmin.from('polls').update({ votes }).eq('id', poll_id);
    return NextResponse.json({ success: true, votes });
  } catch (err) {
    console.error('[POST /api/polls/vote]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
