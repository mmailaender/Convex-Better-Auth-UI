import { RefillingTokenBucket } from '$lib/auth/rate-limit';
import {
	deleteAccessTokenCookie,
	deleteRefreshTokenCookie,
	refreshAccessToken,
	setAccessTokenCookie,
	setRefreshTokenCookie
} from '$lib/auth/session';
import { sequence } from '@sveltejs/kit/hooks';

import { redirect, type Handle } from '@sveltejs/kit';
import { i18n } from '$lib/i18n';
import { getUser } from '$lib/auth/user';
import { createRouteMatcher } from '$lib/auth/createRouteMatcher';

const handleParaglide: Handle = i18n.handle();

const bucket = new RefillingTokenBucket<string>(100, 1);

const isPublicRoute = createRouteMatcher(['/sign-in*', '/api/auth/oauth*', '/api/auth/webauthn*']);

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
	// Skip authentication for static assets
	if (
		event.url.pathname === '/favicon.ico' ||
		event.url.pathname.startsWith('/static') ||
		event.url.pathname.startsWith('/assets')
	) {
		return resolve(event);
	}

	const accessToken = event.cookies.get('access_token') ?? null;

	try {
		if (accessToken === null) {
			console.info('No access token present');
			throw new Error('Access token required');
		}

		const user = await getUser(accessToken);
		event.locals.user = user;
	} catch (error) {
		if (error instanceof Error && error.message === 'Access token required') {
			console.info('Checking for refresh token');
			const refreshToken = event.cookies.get('refresh_token') ?? null;
			if (refreshToken === null) {
				console.info('No refresh token present\n');
				event.locals.user = null;
				// const response = await resolve(event);
				// response.headers.append(
				// 	'Set-Cookie',
				// 	'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax'
				// );

				deleteAccessTokenCookie(event);

				// Redirect to sign-in page if not a public route
				if (!isPublicRoute(event.url.pathname)) {
					console.info('Redirecting to sign-in page');
					redirect(307, `/sign-in?redirect_url=${encodeURIComponent(event.url.pathname)}`);
				} else {
					console.info('\n');
					// return response;
					return resolve(event)
				}
			}

			try {
				console.info('Refreshing access token');
				const { access, refresh } = await refreshAccessToken(refreshToken);
				const user = await getUser(access.secret!);
				event.locals.user = user;

				// const response = await resolve(event);
				// response.headers.append(
				// 	'Set-Cookie',
				// 	`access_token=${access.secret!}; Path=/; Expires=${access.ttl!.toDate().toUTCString()}; HttpOnly; Secure; SameSite=lax`
				// );
				// response.headers.append(
				// 	'Set-Cookie',
				// 	`refresh_token=${refresh.secret!}; Path=/; Expires=${refresh.ttl!.toDate().toUTCString()}; HttpOnly; Secure; SameSite=lax`
				// );
				// return response;

				setAccessTokenCookie(event, access.secret!, access.ttl!.toDate());
				setRefreshTokenCookie(event, refresh.secret!, refresh.ttl!.toDate());
				return resolve(event);
			} catch (error) {
				console.info('Failed to refresh access token: ', error);
				// const response = await resolve(event);
				// response.headers.append(
				// 	'Set-Cookie',
				// 	'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax'
				// );
				// response.headers.append(
				// 	'Set-Cookie',
				// 	'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=lax'
				// );

				deleteRefreshTokenCookie(event);
				deleteAccessTokenCookie(event);

				// Redirect to sign-in page if not a public route
				if (!isPublicRoute(event.url.pathname)) {
					// Redirect to sign-in
					console.info('Redirecting to sign-in page');
					redirect(307, `/sign-in?redirect_url=${encodeURIComponent(event.url.pathname)}`);
				} else {
					// return response;
					return resolve(event)
				}
			}
		} else {
			console.error('Unexpected error in authHandle: ', error);
			throw error;
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(rateLimitHandle, authHandle, handleParaglide);
