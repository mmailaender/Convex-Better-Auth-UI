import {
	createConvexHttpClient,
	getAuthState
} from '@mmailaender/convex-better-auth-svelte/sveltekit';
import type { LayoutServerLoad } from './$types';
import { api } from '$convex/_generated/api';
import { AUTH_CONSTANTS } from '$convex/auth.constants';
import { createAuth } from '$convex/auth';

export const load = (async ({ locals, cookies }) => {
	const authState = await getAuthState(createAuth, cookies);
	const token = locals.token;
	if (!token) return { authState, initialData: undefined };
	const client = createConvexHttpClient({ token });

	const orgs = AUTH_CONSTANTS.organizations;

	const [
		activeUser,
		accountList,
		activeOrganization,
		organizationList,
		invitationList,
		roleResult
	] = await Promise.all([
		client.query(api.users.queries.getActiveUser),
		client.query(api.users.queries.listAccounts),
		orgs
			? client.query(api.organizations.queries.getActiveOrganization)
			: Promise.resolve(undefined),
		orgs ? client.query(api.organizations.queries.listOrganizations) : Promise.resolve(undefined),
		orgs
			? client.query(api.organizations.invitations.queries.listInvitations)
			: Promise.resolve(undefined),
		orgs
			? client.query(api.organizations.queries.getOrganizationRole, {})
			: Promise.resolve(undefined)
	]);

	return {
		authState,
		initialData: {
			activeUser,
			accountList,
			activeOrganization,
			organizationList,
			invitationList,
			role: roleResult ?? undefined
		}
	};
}) satisfies LayoutServerLoad;
