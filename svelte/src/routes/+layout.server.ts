import { callForm } from '$lib/primitives/api/callForm';

import type { LayoutServerLoad } from './$types';
import type { UsersOrganizations } from '$lib/organization/api/types';

export const load = (async ({ locals, fetch }) => {
	if (locals.user) {
		const usersOrganizations = await callForm<UsersOrganizations>({
			url: '/api/org?/getUsersOrganizations',
			fetch
		});

		const user = locals.user;

		user.activeOrganization = usersOrganizations.activeOrganization;
		user.organizations = usersOrganizations.organizations;

		const stringifiedUser = JSON.stringify(user);
		return { user: stringifiedUser };
	}
}) satisfies LayoutServerLoad;
