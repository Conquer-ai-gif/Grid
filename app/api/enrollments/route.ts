import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const schema = z.object({ course_id: z.string().uuid() });

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const courseId = req.nextUrl.searchParams.get('course_id');
    const role = (user.publicMetadata?.role as string) ?? '';

    if (role === 'lecturer' && courseId) {
      const { data: lecture } = await supabaseAdmin
        .from('courses')
        .select('created_by')
        .eq('id', courseId)
        .single();

      if (lecture?.created_by !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('course_enrollments')
        .select('student_id, enrolled_at, platform_users(full_name, email)')
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ enrollments: data ?? [] });
    }

    if (courseId) {
      const { data } = await supabaseAdmin
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .single();
      return NextResponse.json({ enrolled: !!data });
    }

    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', user.id);

    if (error) throw error;
    return NextResponse.json({ course_ids: (data ?? []).map((e) => e.course_id) });
  } catch (err) {
    console.error('[GET /api/enrollments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (user.publicMetadata?.role as string) ?? '';
    if (role !== 'student') {
      return NextResponse.json({ error: 'Only students can enroll' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { course_id } = parsed.data;

    const { error } = await supabaseAdmin
      .from('course_enrollments')
      .insert({ student_id: user.id, course_id, enrolled_at: new Date().toISOString() });

    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });
    }
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/enrollments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const courseId = req.nextUrl.searchParams.get('course_id');
    if (!courseId) return NextResponse.json({ error: 'course_id required' }, { status: 400 });

    await supabaseAdmin
      .from('course_enrollments')
      .delete()
      .eq('student_id', user.id)
      .eq('course_id', courseId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/enrollments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
