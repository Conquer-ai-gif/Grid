import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/lectures/role?call_id=xxx
// Returns whether the current user is the lecturer for this call
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const callId = req.nextUrl.searchParams.get('call_id');
    if (!callId) return NextResponse.json({ error: 'call_id required' }, { status: 400 });

    // Check by stream_call_id first, then by UUID
    const { data } = await supabaseAdmin
      .from('lectures')
      .select('lecturer_id')
      .or(`stream_call_id.eq.${callId},id.eq.${callId}`)
      .single();

    const is_lecturer = data?.lecturer_id === user.id;
    return NextResponse.json({ is_lecturer });
  } catch {
    // If lecture not found (e.g. personal room), default to false
    return NextResponse.json({ is_lecturer: false });
  }
}
