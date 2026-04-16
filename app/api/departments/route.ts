import { NextRequest, NextResponse } from 'next/server';
import { COMMON_DEPARTMENTS } from '@/constants/departments';

/**
 * GET /api/departments?q=comp&university=University+of+Lagos
 *
 * Returns departments from the canonical list that match the search query.
 * The university param is accepted for future extensibility (e.g. per-university
 * department lists stored in Supabase) but currently the same global list is used
 * for all universities since no public university-department API exists.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase().trim() ?? '';

  if (!q || q.length < 1) {
    // Return full list when no query — useful for showing all options on focus
    return NextResponse.json(COMMON_DEPARTMENTS);
  }

  const filtered = COMMON_DEPARTMENTS.filter((dept) =>
    dept.toLowerCase().includes(q)
  );

  return NextResponse.json(filtered);
}
