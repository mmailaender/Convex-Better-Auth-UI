import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';
import { api } from '$convex/_generated/api';
import {
	createConvexAuthHooks,
	createRouteMatcher
} from '@mmailaender/convex-auth-svelte/sveltekit/server';

/* --------------------------------------------------------- */
/* -------------------- route match helpers ---------------- */
/* --------------------------------------------------------- */

const isLogin = createRouteMatcher(['/signin']);
const isInvitationAccept = createRouteMatcher(['/api/invitations/accept']);
const isCreateOrg = createRouteMatcher(['/org/create']);
const isPublic = createRouteMatcher([
	'/',
	'/signin',
	'/pricing',
	'/docs{/*rest}',
	'/about',
	'/terms',
	'/privacy'
]);
const isActiveOrganization = createRouteMatcher([
	'/active-org{/*rest}',
	'/active-organization{/*rest}'
]);

/* --------------------------------------------------------- */
/* ---------------------- auth helpers --------------------- */
/* --------------------------------------------------------- */

const {
	handleAuth,
	isAuthenticated: isAuthenticatedPromise,
	createConvexHttpClient
} = createConvexAuthHooks();

/** Builds `/path?redirectTo=/original/path%3Fquery`  */
const withRedirect = (to: string, event: Parameters<Handle>[0]['event']) =>
	`${to}?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`;

/* --------------------------------------------------------- */
/* ---------------------- main handler --------------------- */
/* --------------------------------------------------------- */

const requireAuth: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isAuthenticated = await isAuthenticatedPromise(event);

	/* ---------- 1. Handle public routes first ---------- */
	if (isPublic(pathname)) {
		// Special case: redirect authenticated users away from signin
		if (isLogin(pathname) && isAuthenticated) {
			throw redirect(307, '/');
		}
		return resolve(event);
	}

	/* ---------- 2. All other routes require authentication ---------- */
	if (!isAuthenticated) {
		throw redirect(307, withRedirect('/signin', event));
	}

	/* ---------- 3. Handle special API routes ---------- */
	if (isInvitationAccept(pathname)) {
		const invitationId = event.url.searchParams.get('invitationId');
		if (invitationId) {
			try {
				const client = await createConvexHttpClient(event);
				await client.mutation(api.organizations.invitations.mutations.acceptInvitation, {
					invitationId
				});
			} catch (err) {
				console.error('Error accepting invitation', err);
			}
		}
		throw redirect(307, '/');
	}

	/* ---------- 4. Handle active organization redirects ---------- */
	if (isActiveOrganization(pathname)) {
		const client = await createConvexHttpClient(event);
		const activeOrganization = await client.query(
			api.organizations.queries.getActiveOrganization,
			{}
		);

		if (activeOrganization) {
			// Replace /active-org or /active-organization with the organization slug
			const newPath = pathname
				.replace(/^\/active-org(?=\/|$)/, `/${activeOrganization.slug}`)
				.replace(/^\/active-organization(?=\/|$)/, `/${activeOrganization.slug}`);

			// Include query parameters if they exist
			const fullUrl = newPath + event.url.search;
			throw redirect(307, fullUrl);
		}

		// If no active organization, redirect to create one
		throw redirect(307, withRedirect('/org/create', event));
	}

	/* ---------- 5. Authenticated user checks ---------- */
	const client = await createConvexHttpClient(event);
	const activeOrganization = await client.query(
		api.organizations.queries.getActiveOrganization,
		{}
	);

	// Allow access to org creation page even without active org
	if (isCreateOrg(pathname)) {
		return resolve(event);
	}

	// For all other protected routes, ensure user has an active organization
	if (!activeOrganization) {
		throw redirect(307, withRedirect('/org/create', event));
	}

	return resolve(event);
};

/* --------------------------------------------------------- */
/* ---------------------- exported hook -------------------- */
/* --------------------------------------------------------- */

export const handle = sequence(
	/* 1 */ handleAuth, // must stay first
	/* 2 */ requireAuth
);
export type { Handle };
