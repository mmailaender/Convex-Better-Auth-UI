import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import type { LayoutServerLoad } from './$types';
import { api } from '$convex/_generated/api';

export const load = (async ({ locals }) => {
	const token = locals.token;
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
