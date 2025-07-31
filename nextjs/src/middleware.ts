import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { createRouteMatcher } from '@/components/primitives/utils/routeMatcher';

/* --------------------------------------------------------- */
/* -------------------- route match helpers ---------------- */
/* --------------------------------------------------------- */

const isLogin = createRouteMatcher(['/signin']);
const isPublic = createRouteMatcher([
	'/',
	'/signin',
	'/api/auth{/*rest}',
	'/pricing',
	'/docs{/*rest}',
	'/about',
	'/terms',
	'/privacy'
]);

/* --------------------------------------------------------- */
/* ---------------------- auth helpers --------------------- */
/* --------------------------------------------------------- */

/** Builds `/path?redirectTo=/original/path%3Fquery`  */
const withRedirect = (to: string, request: NextRequest) => {
	const url = new URL(request.url);
	return `${to}?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;
};

/* --------------------------------------------------------- */
/* ---------------------- main handler --------------------- */
/* --------------------------------------------------------- */

export async function middleware(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);
	// /* ---------- 1. Handle public routes first ---------- */
	if (isPublic(request)) {
		// Special case: redirect authenticated users away from signin
		if (isLogin(request) && sessionCookie) {
			return NextResponse.redirect(new URL('/', request.url));
		}
		return NextResponse.next();
	}
	// /* ---------- 2. All other routes require authentication ---------- */
	if (!sessionCookie) {
		return NextResponse.redirect(new URL(withRedirect('/signin', request), request.url));
	}

	return NextResponse.next();
}

/* --------------------------------------------------------- */
/* ---------------------- exported config ------------------ */
/* --------------------------------------------------------- */

export const config = {
	// The following matcher runs middleware on all routes
	// except static assets.
	matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
};
