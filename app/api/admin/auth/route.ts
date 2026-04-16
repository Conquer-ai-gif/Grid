import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSessionToken, ADMIN_COOKIE } from '@/lib/admin-auth';

const loginSchema = z.object({
  password: z.string().min(1).max(200),
});

// Simple in-memory rate limiter (resets on cold start — good enough for admin)
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  record.count += 1;
  if (record.count > 5) return true;
  return false;
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a minute and try again.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_SECRET_PASSWORD;

  // If password not configured — block access
  if (!adminPassword) {
    return NextResponse.json(
      { error: 'Admin access is not configured. Set ADMIN_SECRET_PASSWORD in .env.local' },
      { status: 503 }
    );
  }

  // Constant-time comparison to prevent timing attacks
  const provided = parsed.data.password;
  const isCorrect =
    provided.length === adminPassword.length &&
    provided.split('').every((char, i) => char === adminPassword[i]);

  if (!isCorrect) {
    // Generic error — never hint what was wrong
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  // Generate session token and set cookie
  const token = generateSessionToken();

  const res = NextResponse.json({ success: true });

  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,                              // JS cannot read this
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',                          // No cross-site requests
    maxAge: 60 * 60 * 24,                        // 24 hours
    path: '/admin',                              // Only sent for /admin routes
  });

  return res;
}

// DELETE /api/admin/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
