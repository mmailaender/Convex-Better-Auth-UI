// lib
import { getUserAccounts } from '$lib/user/api/server';

// types
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, cookies }) => {
	const { user: user } = await parent();
	const userData = user ? JSON.parse(user) : null;

	const accessToken = cookies.get('access_token')!;

	const accounts = await getUserAccounts(accessToken);

	userData.accounts = accounts;
	const stringifiedUser = JSON.stringify(userData);

	return { user: stringifiedUser, accessToken };
}) satisfies PageServerLoad;
