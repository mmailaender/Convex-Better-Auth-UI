import { redirect } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { getSessionCookie } from 'better-auth/cookies';
import { createRouteMatcher } from '#lib/primitives/utils/routeMatcher.js';
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { withServerConvexToken } from 'convex-svelte/sveltekit/server';

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
const withRedirect = (to: string, event: Parameters<Handle>[0]['event']) =>
	`${to}?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`;

/**
 * Whether Better Auth accepts the session of this request's cookies, asked through the app's own
 * auth route. A session cookie alone proves nothing: `getSessionCookie()` also finds one Better
 * Auth no longer reads, such as `better-auth.session_token` once the cookies became `__Secure-`.
 * No session, an error or a failed request all count as signed out.
 */
const hasValidSession = async (event: Parameters<Handle>[0]['event']) => {
	try {
		const response = await event.fetch('/api/auth/get-session');
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

export const requireAuth: Handle = async ({ event, resolve }) => {
	// ⛑️ During build/prerender, skip all auth logic.
	// This prevents "Cannot access url.search on a page with prerendering enabled".
	if (building) {
		return resolve(event);
	}

	const { pathname } = event.url;
	const sessionCookie = getSessionCookie(event.request);

	/* ---------- 1. Handle public routes first ---------- */
	if (isPublic(pathname)) {
		// Special case: redirect signed-in users away from sign-in. Only here is the cookie
		// checked against Better Auth, so a stale one can't keep anyone from signing in.
		if (isLogin(pathname) && sessionCookie && (await hasValidSession(event))) {
			throw redirect(307, '/');
		}
		return resolve(event);
	}

	/* ---------- 2. All other routes require authentication ---------- */
	// Optimistic, as Better Auth recommends: the cookie's presence is enough here. Pages check the
	// session itself; /admin sends a signed-out reader to /signin, and the header offers sign-in.
	if (!sessionCookie) {
		throw redirect(307, withRedirect('/signin', event));
	}

	return resolve(event);
};

export const setTokenFromCookies: Handle = async ({ event, resolve }) => {
	// ⛑️ During build/prerender, skip all auth logic.
	// This prevents "BetterAuthError on a page with prerendering enabled".
	if (building) {
		return resolve(event);
	}

	const token = getToken(event.cookies);
	event.locals.token = token;

	return withServerConvexToken(token, () => resolve(event));
};

/* --------------------------------------------------------- */
/* ---------------------- exported hook -------------------- */
/* --------------------------------------------------------- */

export const handle = sequence(/* 1 */ requireAuth, /* 2 */ setTokenFromCookies);
export type { Handle };
