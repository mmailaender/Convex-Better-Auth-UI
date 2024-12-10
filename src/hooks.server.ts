import { TokenBucket } from "$lib/auth/rate-limit";
import { refreshAccessToken, setAccessTokenCookie, setRefreshTokenCookie } from "$lib/auth/sign-in/session";
import { sequence } from "@sveltejs/kit/hooks";

import type { Handle } from '@sveltejs/kit';
import { i18n } from '$lib/i18n';
import { getUser } from "$lib/auth/sign-in/user";


const handleParaglide: Handle = i18n.handle();

const bucket = new TokenBucket<string>(100, 1);

const rateLimitHandle: Handle = async ({ event, resolve }) => {
    // Note: Assumes X-Forwarded-For will always be defined.
	const clientIP = event.request.headers.get("X-Forwarded-For");
	if (clientIP === null) {
        return resolve(event);
	}
	let cost: number;
	if (event.request.method === "GET" || event.request.method === "OPTIONS") {
        cost = 1;
	} else {
        cost = 3;
	}
	if (!bucket.consume(clientIP, cost)) {
        return new Response("Too many requests", {
            status: 429
		});
	}
	return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
    const accessToken = event.cookies.get("access_token") ?? null;
	if (accessToken === null) {
		const refreshToken = event.cookies.get("refresh_token") ?? null;
		if (refreshToken === null) {
			event.locals.user = null;
			// event.locals.session = null;
			return resolve(event);
		} else {
			const {access, refresh} = await refreshAccessToken(refreshToken);
			setAccessTokenCookie(event, access.secret!, access.ttl!.toDate());
			setRefreshTokenCookie(event, refresh.secret!, refresh.ttl!.toDate());
		}
	}
    
	const user = await getUser(event.cookies.get("access_token")!);
	event.locals.user = user;
	return resolve(event);
};

export const handle: Handle = sequence(rateLimitHandle, authHandle, handleParaglide);
