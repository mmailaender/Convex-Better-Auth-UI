// API
import { useQuery } from 'convex-svelte';
import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
import { getAuthContext } from '#lib/auth/context.svelte.js';

/**
 * Reactive helper exposing whether the authenticated user is an application
 * ("site") admin. Drives UI gating of the admin entry point only — every
 * privileged admin function enforces `requireAppAdmin` on the server.
 */
export function useIsAppAdmin() {
	const { api } = getAuthContext();
	const auth = useAuth();

	const response = useQuery(
		api.admin.queries.isCurrentUserAdmin,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({ initialData: false })
	);

	return {
		get isAppAdmin() {
			return response?.data ?? false;
		}
	};
}
