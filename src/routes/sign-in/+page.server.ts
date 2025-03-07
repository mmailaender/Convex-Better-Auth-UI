import { redirect } from '@sveltejs/kit';

import type { RequestEvent } from './$types';

export async function load(event: RequestEvent) {
	// If the user is already signed in, redirect home
	if (event.locals.user !== null) {
		throw redirect(302, '/');
	}
}
