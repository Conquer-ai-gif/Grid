import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeUniversity } from '@/lib/normalize';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!q) return NextResponse.json({ results: [] });

    const university = normalizeUniversity((user.publicMetadata?.university as string) ?? '');

    let query = supabaseAdmin
      .from('lectures')
      .select('id, title, description, stream_call_id, started_at, ended_at, created_at, courses(name, code)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (university) query = query.ilike('university', university);

    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ results: data ?? [] });
  } catch (err) {
    console.error('[GET /api/lectures/search]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
