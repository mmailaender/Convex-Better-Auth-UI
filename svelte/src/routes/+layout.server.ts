import { createConvexHttpClient, getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import type { LayoutServerLoad } from './$types';
import { api } from '$convex/_generated/api';
import { createAuth } from '$convex/auth';

export const load = (async ({ cookies }) => {
	const token = await getToken(createAuth, cookies);
	if (!token) return {};

	const client = createConvexHttpClient({ token });

	// Execute all queries in parallel for faster load times
	const [
		activeUser,
		activeOrganization,
		organizationList,
		invitationList,
		roleResult,
		accountList
	] = await Promise.all([
		client.query(api.users.queries.getActiveUser),
		client.query(api.organizations.queries.getActiveOrganization),
		client.query(api.organizations.queries.listOrganizations),
		client.query(api.organizations.invitations.queries.listInvitations),
		client.query(api.organizations.queries.getOrganizationRole, {}),
		client.query(api.users.queries.listAccounts)
	]);

	const role = roleResult ?? undefined;

	return { activeUser, activeOrganization, organizationList, invitationList, role, accountList };
}) satisfies LayoutServerLoad;
