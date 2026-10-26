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
	'/reset-password',
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

/**
 * Whether Better Auth accepts the session of this request's cookies, asked through the app's own
 * auth route. A session cookie alone proves nothing: `getSessionCookie()` also finds one Better
 * Auth no longer reads, such as `better-auth.session_token` once the cookies became `__Secure-`.
 * No session, an error or a failed request all count as signed out. The check doesn't renew the
 * session (`disableRefresh`): the redirect that follows would drop a renewed cookie.
 */
const hasValidSession = async (request: NextRequest) => {
	try {
		const response = await fetch(
			new URL('/api/auth/get-session?disableRefresh=true', request.url),
			{
				headers: { cookie: request.headers.get('cookie') ?? '' }
			}
		);
		if (!response.ok) return false;
		const data = (await response.json()) as { session?: unknown } | null;
		return Boolean(data?.session);
	} catch {
		return false;
	}
};

/* --------------------------------------------------------- */
/* ---------------------- main handler --------------------- */
/* --------------------------------------------------------- */

export async function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);
	// /* ---------- 1. Handle public routes first ---------- */
	if (isPublic(request)) {
		// Special case: redirect signed-in users away from sign-in. Only here is the cookie
		// checked against Better Auth, so a stale one can't keep anyone from signing in.
		if (isLogin(request) && sessionCookie && (await hasValidSession(request))) {
			return NextResponse.redirect(new URL('/', request.url));
		}
		return NextResponse.next();
	}
	// /* ---------- 2. All other routes require authentication ---------- */
	// Optimistic, as Better Auth recommends: the cookie's presence is enough here. Pages check the
	// session itself; /admin sends a signed-out reader to /signin, and the header offers sign-in.
	if (!sessionCookie) {
		return NextResponse.redirect(new URL(withRedirect('/signin', request), request.url));
	}

	return NextResponse.next();
}

/* --------------------------------------------------------- */
/* ---------------------- exported config ------------------ */
/* --------------------------------------------------------- */

export const config = {
	// The following matcher runs proxy on all routes except static assets.
	matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
};
