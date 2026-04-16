import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lectureId = req.nextUrl.searchParams.get('lecture_id');
    if (!lectureId) return NextResponse.json({ error: 'lecture_id required' }, { status: 400 });

    const { data: lecture } = await supabaseAdmin
      .from('lectures')
      .select('lecturer_id, title')
      .eq('id', lectureId)
      .single();

    if (lecture?.lecturer_id !== user.id) {
      return NextResponse.json({ error: 'Only the lecture creator can view this report' }, { status: 403 });
    }

    const { data: records, error } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    if (!records?.length) {
      return NextResponse.json({ lecture, records: [] });
    }

    const userIds = [...new Set(records.map((r) => r.user_id))];
    const { data: platformUsers } = await supabaseAdmin
      .from('platform_users')
      .select('id, full_name, email')
      .in('id', userIds);

    const userMap = new Map((platformUsers ?? []).map((u) => [u.id, u]));

    const enriched = records.map((r) => {
      const u = userMap.get(r.user_id);
      const durationSec = r.duration_seconds
        ?? (r.joined_at && r.left_at
          ? Math.floor((new Date(r.left_at).getTime() - new Date(r.joined_at).getTime()) / 1000)
          : null);
      return {
        ...r,
        full_name: u?.full_name ?? 'Unknown',
        email: u?.email ?? '',
        duration_seconds: durationSec,
      };
    });

    return NextResponse.json({ lecture, records: enriched });
  } catch (err) {
    console.error('[GET /api/attendance/report]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
