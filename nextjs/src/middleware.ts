import { api } from '@/convex/_generated/api';
import {
	convexAuthNextjsMiddleware,
	convexAuthNextjsToken,
	createRouteMatcher
} from '@convex-dev/auth/nextjs/server';
import { fetchMutation } from 'convex/nextjs';
import { NextResponse } from 'next/server';

const isLoginPage = createRouteMatcher(['/login']);
const isInvitationAcceptRoute = createRouteMatcher(['/api/invitations/accept']);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
	if (isLoginPage(request)) {
		const isAuthenticated = await convexAuth.isAuthenticated();
		if (isAuthenticated) {
			return NextResponse.redirect(new URL('/', request.url));
		}
	}

	if (isInvitationAcceptRoute(request)) {
		const isAuthenticated = await convexAuth.isAuthenticated();

		if (!isAuthenticated) {
			// If not authenticated, redirect to login with return URL
			const url = new URL(request.url);
			return NextResponse.redirect(
				new URL(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`, request.url)
			);
		}

		// Get invitation ID from query params
		const url = new URL(request.url);
		const invitationId = url.searchParams.get('invitationId');

		if (invitationId) {
			try {
				// Call the mutation directly with the auth token
				await fetchMutation(
					api.organizations.invitations.db.acceptInvitation,
					{ invitationId },
					{ token: await convexAuthNextjsToken() }
				);

				// Redirect to home page
				return NextResponse.redirect(new URL('/', request.url));
			} catch (error: unknown) {
				// Extract error message and redirect to error page

				console.error('Error accepting invitation: ', error);
				return NextResponse.error();
			}
		}
	}

	// For other routes, no special handling
	return;
});

export const config = {
	// The following matcher runs middleware on all routes
	// except static assets.
	matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
};
