import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const publicRoutes = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding',
  '/api/onboarding',
  '/admin(.*)',
  '/api/admin(.*)',
]);

const protectedRoutes = createRouteMatcher([
  '/',
  '/upcoming',
  '/meeting(.*)',
  '/previous',
  '/recordings',
  '/personal-room',
  '/courses(.*)',
  '/analytics(.*)',
  '/replay(.*)',
  '/feedback',
  '/api/polls(.*)',
  '/api/quizzes(.*)',
  '/api/wit(.*)',
  '/api/attendance(.*)',
  '/api/lectures(.*)',
  '/api/ai(.*)',
  '/api/whiteboard(.*)',
  '/api/feedback(.*)',
]);

export default clerkMiddleware((auth, req) => {
  const { userId, sessionClaims } = auth();
  const url = req.nextUrl;

  // Allow public routes through without any checks
  if (publicRoutes(req)) return NextResponse.next();

  // Unauthenticated users trying to access protected routes → sign in
  if (!userId && protectedRoutes(req)) {
    return auth().redirectToSignIn();
  }

  // Authenticated users who haven't completed onboarding → onboarding page
  if (userId && !sessionClaims?.publicMetadata?.onboardingComplete) {
    if (!url.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
