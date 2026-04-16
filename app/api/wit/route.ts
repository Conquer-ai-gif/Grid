import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { checkRateLimit, witRatelimit } from '@/lib/ratelimit';
import { supabaseAdmin } from '@/lib/supabase';
import { inngest } from '@/inngest/client';
import { IntentName } from '@/types';

const witSchema = z.object({
  text: z.string().min(1).max(500),
  lecture_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit by user
    const { success } = await checkRateLimit(witRatelimit, user.id);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const body = await req.json();
    const parsed = witSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

    const { text, lecture_id } = parsed.data;

    // Verify user is in this lecture
    const { data: attendance } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('lecture_id', lecture_id)
      .eq('user_id', user.id)
      .single();

    if (!attendance) {
      return NextResponse.json({ error: 'Not enrolled in this lecture' }, { status: 403 });
    }

    // Call Wit.ai
    const witToken = process.env.WIT_AI_TOKEN;
    if (!witToken) return NextResponse.json({ error: 'Wit.ai not configured' }, { status: 500 });

    const witRes = await fetch(
      `https://api.wit.ai/message?v=20240101&q=${encodeURIComponent(text)}`,
      { headers: { Authorization: `Bearer ${witToken}` } }
    );

    if (!witRes.ok) throw new Error('Wit.ai request failed');

    const witData = await witRes.json();
    const topIntent = witData.intents?.[0];
    const intent: IntentName = (topIntent?.name as IntentName) ?? 'unknown';
    const confidence: number = topIntent?.confidence ?? 0;

    // Store transcript chunk in Supabase
    await supabaseAdmin.from('transcripts').insert({
      lecture_id,
      speaker_id: user.id,
      text,
      timestamp_ms: Date.now(),
      created_at: new Date().toISOString(),
    });

    // Send to Inngest for processing (fire and forget)
    await inngest.send({
      name: 'app/intent.received',
      data: { intent, confidence, text, lecture_id, user_id: user.id },
    });

    return NextResponse.json({ intent, confidence });
  } catch (err) {
    console.error('[/api/wit]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
