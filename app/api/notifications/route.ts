import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    return NextResponse.json({ notifications: data ?? [] });
  } catch (err) {
    console.error('[GET /api/notifications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id } = body as { id?: string };

    if (id) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/notifications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
