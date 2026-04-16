import { NextRequest, NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeDepartment, normalizeUniversity } from '@/lib/normalize';

const schema = z.object({
  role: z.enum(['student', 'lecturer']),
  university: z.string().min(4).max(100),
  department: z.string().max(100).nullable().optional(),
  registration_number: z.string().min(3).max(50).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { role, university: rawUniversity, department: rawDepartment, registration_number } = parsed.data;

    // Normalize on the server — client-side normalization is best-effort only
    const university = normalizeUniversity(rawUniversity);
    const department = normalizeDepartment(rawDepartment ?? null);
    const regNumber = role === 'student' ? (registration_number?.trim().toUpperCase() ?? null) : null;

    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role,
        university,
        department,           // null if student left blank — sees all lectures
        registration_number: regNumber,
        onboardingComplete: true,
      },
    });

    await supabaseAdmin.from('platform_users').upsert({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? '',
      full_name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      role,
      university,
      department,
      registration_number: regNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/onboarding]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
