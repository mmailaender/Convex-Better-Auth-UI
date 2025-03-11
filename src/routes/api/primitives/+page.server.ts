// modules
import { error } from '@sveltejs/kit';

// types
import type { Actions } from './$types';
import client from '$lib/db/client';

export const actions = {
	newId: async ({ cookies }) => {
		const accessToken = cookies.get('access_token');
		try {
			const newId = await client(accessToken!).newId();
			return { newId };
		} catch (err) {
			console.error('Error generating new ID:', err);
			return error(400, { message: 'Failed to generate new ID' });
		}
	}
} satisfies Actions;
