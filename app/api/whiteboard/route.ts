import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const whiteboardEventSchema = z.object({
  lecture_id: z.string().uuid(),
  event_type: z.enum(['draw', 'erase', 'clear', 'permission_grant', 'permission_revoke']),
  payload: z.record(z.unknown()),
  timestamp_ms: z.number().int().positive(),
});

const batchSchema = z.object({
  events: z.array(whiteboardEventSchema).min(1).max(50),
});

// POST /api/whiteboard — Save batch of whiteboard events
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const rows = parsed.data.events.map((e) => ({
      ...e,
      user_id: user.id,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin.from('whiteboard_events').insert(rows);
    if (error) throw error;

    return NextResponse.json({ success: true, saved: rows.length });
  } catch (err) {
    console.error('[POST /api/whiteboard]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/whiteboard?lecture_id=xxx — Replay whiteboard events
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lectureId = req.nextUrl.searchParams.get('lecture_id');
    if (!lectureId) return NextResponse.json({ error: 'lecture_id required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('whiteboard_events')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('timestamp_ms', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ events: data });
  } catch (err) {
    console.error('[GET /api/whiteboard]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
