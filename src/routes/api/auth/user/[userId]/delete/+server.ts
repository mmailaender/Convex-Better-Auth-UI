import { type RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteUser } from '$lib/auth/user';

export const DELETE: RequestHandler = async (event: RequestEvent) => {
	const userId = event.params.userId;
	console.log('DELETE request received for userId:', userId);

	if (!userId) {
		console.warn('User ID is required but not provided');
		return new Response('User ID is required', { status: 400 });
	}

	const success = await deleteUser(event, userId);
	if (success) {
		console.log('User deleted successfully, redirecting to sign-in');
        return new Response(null, {
			status: 303,
			headers: { Location: '/sign-in' }
		});
	} else {
		console.error('Failed to delete user with userId:', userId);
		return new Response('Failed to delete user', { status: 500 });
	}
};

