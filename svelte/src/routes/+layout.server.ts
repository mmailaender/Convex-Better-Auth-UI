import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import type { LayoutServerLoad } from './$types';
import { api } from '$convex/_generated/api';

export const load = (async ({ locals }) => {
	const token = locals.token;
	if (!token) return {};
	const client = createConvexHttpClient({ token });

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
		client.query(api.organizations.queries.getActiveOrganization),
		client.query(api.organizations.queries.listOrganizations),
		client.query(api.organizations.invitations.queries.listInvitations),
		client.query(api.organizations.queries.getOrganizationRole, {})
	]);

	const role = roleResult ?? undefined;

	return { activeUser, accountList, activeOrganization, organizationList, invitationList, role };
}) satisfies LayoutServerLoad;
