import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { createRouteMatcher } from '@/components/primitives/utils/routeMatcher';
import { createAuth } from './components/auth/lib/auth';

/* --------------------------------------------------------- */
/* -------------------- route match helpers ---------------- */
/* --------------------------------------------------------- */

const isLogin = createRouteMatcher(['/signin']);
const isInvitationAccept = createRouteMatcher(['/api/invitations/accept']);
const isCreateOrg = createRouteMatcher(['/org/create']);
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

// export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
// 	const isAuthenticated = await convexAuth.isAuthenticated();

// /* ---------- 3. Handle special API routes ---------- */
// if (isInvitationAccept(request)) {
// 	const url = new URL(request.url);
// 	const invitationId = url.searchParams.get('invitationId');
// 	if (invitationId) {
// 		try {
// 			await fetchMutation(
// 				api.organizations.invitations.mutations.acceptInvitation,
// 				{ invitationId },
// 				{ token: await convexAuthNextjsToken() }
// 			);
// 		} catch (err) {
// 			console.error('Error accepting invitation', err);
// 		}
// 	}
// 	return NextResponse.redirect(new URL('/', request.url));
// }

// /* ---------- 5. Authenticated user checks ---------- */
// const activeOrganization = await fetchQuery(
// 	api.organizations.queries.getActiveOrganization,
// 	{},
// 	{ token: await convexAuthNextjsToken() }
// );

// // Allow access to org creation page even without active org
// if (isCreateOrg(request)) {
// 	return NextResponse.next();
// }

// // For all other protected routes, ensure user has an active organization
// if (!activeOrganization) {
// 	return NextResponse.redirect(new URL(withRedirect('/org/create', request), request.url));
// }

// 	return NextResponse.next();
// });

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
