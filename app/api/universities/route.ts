import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://universities.hipolabs.com/search?name=${encodeURIComponent(q)}&limit=8`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const names: string[] = Array.from(
      new Set((data as { name: string }[]).map((u) => u.name))
    ).slice(0, 8);

    return NextResponse.json(names);
  } catch {
    return NextResponse.json([]);
  }
}
