import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeDepartment, normalizeUniversity } from '@/lib/normalize';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  department: z.string().max(100).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (user.publicMetadata?.role as string) ?? '';
    const university = normalizeUniversity((user.publicMetadata?.university as string) ?? '');
    const department = normalizeDepartment((user.publicMetadata?.department as string) ?? null);

    let query = supabaseAdmin
      .from('courses')
      .select('*, lectures(id)')
      .order('created_at', { ascending: false });

    if (role === 'lecturer') {
      // Lecturers only see their own courses
      query = query.eq('created_by', user.id);
    } else {
      // Students see all courses from their university
      if (university) query = query.ilike('university', university);

      // If student has a department, filter to that department OR university-wide (null dept)
      if (department) {
        query = query.or(`department.ilike.${department},department.is.null`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ courses: data ?? [] });
  } catch (err) {
    console.error('[GET /api/courses]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (user.publicMetadata?.role as string) ?? '';
    if (role !== 'lecturer') {
      return NextResponse.json({ error: 'Only lecturers can create courses' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, code, description, department: rawDept } = parsed.data;
    const university = normalizeUniversity((user.publicMetadata?.university as string) ?? '');
    const department = normalizeDepartment(rawDept ?? (user.publicMetadata?.department as string) ?? null);

    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        name,
        code: code ?? null,
        description: description ?? null,
        university,
        department,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ course: data });
  } catch (err) {
    console.error('[POST /api/courses]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
