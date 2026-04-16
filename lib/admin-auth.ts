import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE = 'yoom_admin_session';
// Cookie value is a signed token: timestamp + hash
// This prevents someone from just setting the cookie manually

export function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const secret = process.env.ADMIN_SECRET_PASSWORD ?? '';
  // Simple HMAC-style token: base64(timestamp:secret_hash)
  const raw = `${timestamp}:${Buffer.from(secret + timestamp).toString('base64')}`;
  return Buffer.from(raw).toString('base64');
}

export function validateSessionToken(token: string): boolean {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const [timestamp, hash] = raw.split(':');
    const secret = process.env.ADMIN_SECRET_PASSWORD ?? '';
    const expectedHash = Buffer.from(secret + timestamp).toString('base64');

    if (hash !== expectedHash) return false;

    // Token expires after 24 hours
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 24 * 60 * 60 * 1000) return false;

    return true;
  } catch {
    return false;
  }
}

// Use in server components / layouts
export function isAdminAuthenticated(): boolean {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;
    if (!token) return false;
    return validateSessionToken(token);
  } catch {
    return false;
  }
}

// Use in API routes / middleware
export function isAdminAuthenticatedFromRequest(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return validateSessionToken(token);
}
