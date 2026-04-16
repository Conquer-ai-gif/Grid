import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { inngest } from '@/inngest/client';

const attendanceSchema = z.object({
  lecture_id: z.string().uuid(),
  action: z.enum(['join', 'leave']),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = attendanceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { lecture_id, action } = parsed.data;

    await inngest.send({
      name: 'app/attendance.update',
      data: { lecture_id, user_id: user.id, action, timestamp: new Date().toISOString() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/attendance]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lectureId = req.nextUrl.searchParams.get('lecture_id');
    if (!lectureId) return NextResponse.json({ error: 'lecture_id required' }, { status: 400 });

    // Only the lecture creator can view attendance
    const { data: lecture } = await supabaseAdmin
      .from('lectures')
      .select('lecturer_id')
      .eq('id', lectureId)
      .single();

    if (lecture?.lecturer_id !== user.id) {
      return NextResponse.json({ error: 'Only the lecture creator can view attendance' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ attendance: data });
  } catch (err) {
    console.error('[GET /api/attendance]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
