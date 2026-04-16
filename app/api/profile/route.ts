import { NextRequest, NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeDepartment } from '@/lib/normalize';

const schema = z.object({
  department: z.string().max(100).nullable(),
});

/**
 * PATCH /api/profile
 * Lets a user update their department at any time after onboarding.
 * Syncs to both Clerk metadata and Supabase.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const department = normalizeDepartment(parsed.data.department);

    // Preserve all existing metadata, only overwrite department
    const existing = user.publicMetadata ?? {};
    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...existing,
        department,
      },
    });

    await supabaseAdmin
      .from('platform_users')
      .update({ department, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({ success: true, department });
  } catch (err) {
    console.error('[PATCH /api/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
