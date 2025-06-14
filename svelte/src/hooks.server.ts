import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';

import { api } from '$convex/_generated/api';
import {
	createConvexAuthHooks,
	createRouteMatcher
} from '@mmailaender/convex-auth-svelte/sveltekit/server';

const isLoginPage = createRouteMatcher(['/signin']);
const isInvitationAcceptRoute = createRouteMatcher(['/api/invitations/accept']);

// Create auth hooks
const {
	handleAuth,
	isAuthenticated: isAuthenticatedPromise,
	createConvexHttpClient
} = createConvexAuthHooks();

// Create custom auth handler
const requireAuth: Handle = async ({ event, resolve }) => {
	if (isLoginPage(event.url.pathname)) {
		const isAuthenticated = await isAuthenticatedPromise(event);
		if (isAuthenticated) {
			return redirect(307, '/');
		}
		return resolve(event);
	}

	if (isInvitationAcceptRoute(event.url.pathname)) {
		const isAuthenticated = await isAuthenticatedPromise(event);
		if (!isAuthenticated) {
			// If not authenticated, redirect to signin with return URL
			return redirect(
				307,
				`/signin?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`
			);
		}
		// Get invitation ID from query params
		const invitationId = event.url.searchParams.get('invitationId');
		if (invitationId) {
			const client = await createConvexHttpClient(event);
			try {
				// Call the mutation directly with the auth token
				await client.mutation(api.organizations.invitations.db.acceptInvitation, { invitationId });
				return redirect(307, '/');
			} catch (error: unknown) {
				console.error('Error accepting invitation: ', error);
				return redirect(307, '/');
			}
		}
	}

	return resolve(event);
};

// Apply hooks in sequence
export const handle = sequence(
	handleAuth, // This MUST come first to handle auth requests
	requireAuth // Then enforce authentication
);
