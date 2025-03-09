// lib
import { getUserAndAccounts } from '$lib/user/api/server';

// types
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, cookies }) => {
	const { user: layoutUser } = await parent();
	const layoutUserData = layoutUser ? JSON.parse(layoutUser) : null;

	const accessToken = cookies.get('access_token')!;

	const userWithAccounts = await getUserAndAccounts(accessToken);

	const mergedUser = {
		...layoutUserData,
		...userWithAccounts,
		accounts: userWithAccounts.accounts,
		activeOrganization: layoutUserData?.activeOrganization,
		organizations: layoutUserData?.organizations
	};
	const stringifiedUser = JSON.stringify(mergedUser);

	return { user: stringifiedUser, accessToken };
}) satisfies PageServerLoad;
