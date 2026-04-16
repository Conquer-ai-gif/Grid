import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, generalRatelimit } from '@/lib/ratelimit';

const feedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'experience', 'lecture']),
  rating: z.number().int().min(0).max(5),
  subject: z.string().min(1).max(200),
  details: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await checkRateLimit(generalRatelimit, user.id);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id: user.id,
        category: parsed.data.category,
        rating: parsed.data.rating,
        subject: parsed.data.subject,
        details: parsed.data.details,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('[POST /api/feedback]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only admin can read all feedback
    const role = (user.publicMetadata as { role?: string })?.role;
    if (role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ feedback: data });
  } catch (err) {
    console.error('[GET /api/feedback]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
