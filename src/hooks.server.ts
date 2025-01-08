import { RefillingTokenBucket } from '$lib/auth/rate-limit';
import {
	deleteAccessTokenCookie,
	deleteRefreshTokenCookie,
	refreshAccessToken,
	setAccessTokenCookie,
	setRefreshTokenCookie
} from '$lib/auth/session';
import { sequence } from '@sveltejs/kit/hooks';

import type { Handle } from '@sveltejs/kit';
import { i18n } from '$lib/i18n';
import { getUser } from '$lib/auth/user';

const handleParaglide: Handle = i18n.handle();

const bucket = new RefillingTokenBucket<string>(100, 1);

const rateLimitHandle: Handle = async ({ event, resolve }) => {
	// Note: Assumes X-Forwarded-For will always be defined.
	const clientIP = event.request.headers.get('X-Forwarded-For');
	if (clientIP === null) {
		return resolve(event);
	}
	let cost: number;
	if (event.request.method === 'GET' || event.request.method === 'OPTIONS') {
		cost = 1;
	} else {
		cost = 3;
	}
	if (!bucket.consume(clientIP, cost)) {
		return new Response('Too many requests', {
			status: 429
		});
	}
	return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('access_token') ?? null;

	try {
		if (accessToken === null) {
			throw new Error('Access token required');
		}

		const user = await getUser(accessToken);
		event.locals.user = user;
	} catch (error) {
		if (error instanceof Error && error.message === 'Access token required') {
			const refreshToken = event.cookies.get('refresh_token') ?? null;
			if (refreshToken === null) {
				event.locals.user = null;
				const response = await resolve(event);
				response.headers.append('Set-Cookie',
					'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax'
				);
				return response;
			}

			try {
				const { access, refresh } = await refreshAccessToken(refreshToken);
				event.locals.user = await getUser(access.secret!);
				
				const response = await resolve(event);
				response.headers.append('Set-Cookie',
					`access_token=${access.secret!}; Path=/; Expires=${access.ttl!.toDate().toUTCString()}; HttpOnly; Secure; SameSite=lax`
				);
				response.headers.append('Set-Cookie',
					`refresh_token=${refresh.secret!}; Path=/; Expires=${refresh.ttl!.toDate().toUTCString()}; HttpOnly; Secure; SameSite=lax`
				);
				return response;
			} catch (refreshError) {
				const response = await resolve(event);
				response.headers.append('Set-Cookie',
					'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax'
				);
				response.headers.append('Set-Cookie',
					'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax'
				);

				// Redirect to sign-in
				response.headers.set('Location', '/sign-in');
				return new Response(null, {
					status: 302,
					headers: response.headers
				});
			}
		} else {
			throw error; 
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(rateLimitHandle, authHandle, handleParaglide);
