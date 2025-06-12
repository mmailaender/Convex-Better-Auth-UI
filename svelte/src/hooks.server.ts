import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';
import {
	createConvexAuthHooks,
	createRouteMatcher
} from '@mmailaender/convex-auth-svelte/sveltekit/server';

const isLoginPage = createRouteMatcher(['/signin']);
const isInvitationAcceptRoute = createRouteMatcher(['/api/invitations/accept']);

// Create auth hooks
const { handleAuth, isAuthenticated: isAuthenticatedPromise } = createConvexAuthHooks();

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
		return resolve(event);
	}

	return resolve(event);
};

// Apply hooks in sequence
export const handle = sequence(
	handleAuth, // This MUST come first to handle auth requests
	requireAuth // Then enforce authentication
);
