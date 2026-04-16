import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const lectureId = req.nextUrl.searchParams.get('lecture_id');
    if (!lectureId) return NextResponse.json({ error: 'lecture_id required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('transcripts')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('timestamp_ms', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ chunks: data });
  } catch (err) {
    console.error('[GET /api/lectures/transcript]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
