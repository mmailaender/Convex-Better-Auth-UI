// modules
import { error } from '@sveltejs/kit';

// types
import type { Actions } from './$types';
import client from '$lib/db/client';
import { FAUNA_SIGNIN_KEY } from '$env/static/private';

export const actions = {
	newId: async () => {
		try {
			const newId = await client(FAUNA_SIGNIN_KEY).newId();
			return newId;
		} catch (err) {
			console.error('Error generating new ID:', err);
			return error(400, { message: 'Failed to generate new ID' });
		}
	}
} satisfies Actions;
