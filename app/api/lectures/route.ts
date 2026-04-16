import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeDepartment, toTitleCase } from '@/lib/normalize';
import { inngest } from '@/inngest/client';

const createLectureSchema = z.object({
  stream_call_id: z.string().min(1),
  title: z.string().min(1).max(200).default('Untitled Lecture'),
  description: z.string().max(1000).optional(),
  course_id: z.string().uuid().optional(),
  department: z.string().max(100).nullable().optional(),
  is_live: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = createLectureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { stream_call_id, title, description, course_id, department, is_live } = parsed.data;

    // Always normalize before storing so comparisons are consistent
    const university = toTitleCase((user.publicMetadata?.university as string) ?? '');
    const normalizedDepartment = normalizeDepartment(department);

    const { data, error } = await supabaseAdmin
      .from('lectures')
      .upsert(
        {
          stream_call_id,
          title,
          description,
          course_id: course_id ?? null,
          lecturer_id: user.id,
          university,
          // null = visible to ALL departments in this university
          department: normalizedDepartment,
          is_summarized: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stream_call_id' }
      )
      .select()
      .single();

    if (error) throw error;

    // Fire notification event when lecture goes live (not just scheduled)
    if (is_live && data) {
      await inngest.send({
        name: 'app/lecture.live',
        data: {
          lecture_id: data.id,
          lecturer_id: user.id,
          university,
          department: normalizedDepartment,
          title,
        },
      });
    }

    return NextResponse.json({ lecture: data });
  } catch (err) {
    console.error('[POST /api/lectures]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const courseId = req.nextUrl.searchParams.get('course_id');

    // Normalize incoming params so queries are always case-consistent
    const rawUniversity = req.nextUrl.searchParams.get('university') ?? '';
    const rawDepartment = req.nextUrl.searchParams.get('department') ?? '';
    const university = rawUniversity.trim() ? toTitleCase(rawUniversity) : '';
    const department = normalizeDepartment(rawDepartment);

    let query = supabaseAdmin
      .from('lectures')
      .select('*, courses(name, code)')
      .order('created_at', { ascending: false });

    if (courseId) query = query.eq('course_id', courseId);

    // University filter — ilike as a safety net for any old un-normalized data
    if (university) query = query.ilike('university', university);

    if (department) {
      // Show lectures for THIS department OR lectures open to all departments (null)
      // ilike handles any remaining case inconsistencies in old data
      query = query.or(`department.ilike.${department},department.is.null`);
    }
    // If no department supplied (student left it blank), no department filter is applied
    // → student sees ALL lectures for their university across every department

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ lectures: data });
  } catch (err) {
    console.error('[GET /api/lectures]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
